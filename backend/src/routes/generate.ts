import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { generatePost } from '../services/generation.service';
import { PlatformKey, getHumanizePrompt } from '../utils/prompts';
import { chatCompletion } from '../services/ai.service';

const router = Router();
const prisma = new PrismaClient();

router.post(
    '/',
    authenticate,
    aiLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = generateSchema.parse(req.body);

            let contextData = '';
            let styleSamplesData = '';

            if (data.contextIds && data.contextIds.length > 0) {
                // User made an explicit selection — use ONLY those profiles, nothing else
                const selectedContexts = await prisma.contextProfile.findMany({
                    where: {
                        id: { in: data.contextIds },
                        userId: req.user!.userId,
                    },
                });

                const sampleProfiles = selectedContexts.filter((c: any) => c.type === 'POST_SAMPLE');
                const bgProfiles = selectedContexts.filter((c: any) => c.type !== 'POST_SAMPLE');

                if (sampleProfiles.length > 0) {
                    styleSamplesData = sampleProfiles
                        .map((c: any) => `Sample Post (${c.name}):\n${c.description}`)
                        .join('\n\n---\n\n');
                }

                if (bgProfiles.length > 0) {
                    contextData = bgProfiles
                        .map((c: any) => `[${c.type}] ${c.name}: ${c.description}\nKeywords: ${Array.isArray(c.keywords) ? c.keywords.join(', ') : 'None'}`)
                        .join('\n\n');
                }
            } else if (data.useSamples !== false) {
                // No explicit selection — fall back to all the user's style samples as default voice
                const allSamples = await prisma.contextProfile.findMany({
                    where: {
                        userId: req.user!.userId,
                        type: 'POST_SAMPLE',
                    },
                });

                if (allSamples.length > 0) {
                    styleSamplesData = allSamples
                        .map((c: any) => `Sample Post (${c.name}):\n${c.description}`)
                        .join('\n\n---\n\n');
                }
            }

            // Fetch admin-curated scraped samples for the platform (always included as baseline)
            let scrapedSamplesData = '';
            if (data.useSamples !== false) {
                const scrapedSamples = await prisma.scrapedSample.findMany({
                    where: {
                        platform: data.platform,
                        isActive: true
                    },
                    take: 3,
                    orderBy: { engagementScore: 'desc' }
                });

                if (scrapedSamples.length > 0) {
                    scrapedSamplesData = scrapedSamples
                        .map(s => `Top-Rated Example (${s.platform}):\n${s.content}`)
                        .join('\n\n---\n\n');
                }
            }

            const finalSamplePost = [data.samplePost, styleSamplesData, scrapedSamplesData].filter(Boolean).join('\n\n=== ADDITIONAL SAMPLES ===\n\n');


            const result = await generatePost({
                topic: data.topic,
                platform: data.platform as PlatformKey,
                tone: data.tone,
                lengthPreference: data.lengthPreference,
                audience: data.audience,
                goal: data.goal,
                samplePost: finalSamplePost || undefined,
                contextData: contextData || undefined,
            });

            // Save to database
            const post = await prisma.post.create({
                data: {
                    userId: req.user!.userId,
                    originalPrompt: data.topic,
                    generatedContent: result.content,
                    platform: data.platform,
                    topic: data.topic,
                    tone: data.tone,
                    audience: data.audience,
                    goal: data.goal,
                },
            });

            res.status(201).json({
                success: true,
                data: {
                    postId: post.id,
                    ...result,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Humanize the generated post to remove AI-sounding language
router.post(
    '/humanize',
    authenticate,
    aiLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { content } = req.body;
            if (!content || typeof content !== 'string' || content.trim().length < 10) {
                return res.status(400).json({ success: false, error: 'A valid content string is required.' });
            }

            const prompt = getHumanizePrompt(content);
            const humanized = await chatCompletion(
                prompt,
                'You are a strict human editor. Your job is to surgically edit out AI-sounding hype and marketing phrases while retaining 100% of the original facts, context, and meaning. You do not rewrite from scratch, and you never invent details.'
            );

            res.json({ success: true, data: humanized });
        } catch (error) {
            next(error);
        }
    }
);

// Get user's posts
router.get(
    '/history',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
            const skip = (page - 1) * limit;

            const [posts, total] = await Promise.all([
                prisma.post.findMany({
                    where: { userId: req.user!.userId },
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take: limit,
                    include: {
                        analysisResults: {
                            orderBy: { createdAt: 'desc' },
                            take: 1,
                        },
                    },
                }),
                prisma.post.count({ where: { userId: req.user!.userId } }),
            ]);

            res.json({
                success: true,
                data: {
                    posts,
                    pagination: {
                        page,
                        limit,
                        total,
                        totalPages: Math.ceil(total / limit),
                    },
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

// Update generated post content
router.put(
    '/history/:id',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { content } = req.body;
            if (!content || typeof content !== 'string') {
                return res.status(400).json({ success: false, error: 'Content string is required' });
            }

            // Check if post exists and belongs to user
            const exists = await prisma.post.findUnique({
                where: { id: req.params.id, userId: req.user!.userId },
            });

            if (!exists) {
                return res.status(404).json({ success: false, error: 'Post not found' });
            }

            const post = await prisma.post.update({
                where: { id: req.params.id },
                data: { generatedContent: content },
            });

            res.json({ success: true, data: post });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
