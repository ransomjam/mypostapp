import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { chatCompletion } from '../services/ai.service';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const generatePlanSchema = z.object({
    contextIds: z.array(z.string()).min(1),
    topic: z.string().optional(),
    postCount: z.number().min(1).max(10).default(5),
});

// Generate Content Plan directly from Knowledge Base

router.post(
    '/generate',
    authenticate,
    aiLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = generatePlanSchema.parse(req.body);

            const contexts = await prisma.contextProfile.findMany({
                where: {
                    id: { in: data.contextIds },
                    userId: req.user!.userId,
                },
            });

            const contextData = contexts
                .map(c => `[${c.type}] ${c.name}\n${c.description}`)
                .join('\n\n');

            const prompt = `You are an expert social media strategist. 
Your task is to create a practical, highly engaging ${data.postCount}-post content plan based strictly on the provided Knowledge Base and the general topic focus if provided.

KNOWLEDGE BASE:
"""
${contextData}
"""
${data.topic ? `\nGENERAL TOPIC/FOCUS: ${data.topic}` : ''}

TASK:
Develop a content plan consisting of ${data.postCount} distinct post concepts. 
Each post should be distinct, avoiding repetitive themes, and formatted to ensure maximum audience engagement. Do not generate the full exact post, but rather a "Content Plan entry".

OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
    "planTitle": "Name of the Content Plan",
    "strategySummary": "1-2 sentences on the overall approach based on the background knowledge.",
    "posts": [
        {
            "day": "Day 1",
            "concept": "The core idea or angle of the post",
            "format": "e.g., Short text, Story-driven, Actionable tip, Behind-the-scenes",
            "hookIdea": "A suggested opening line or hook constraint",
            "callToAction": "The desired action to drive (e.g. comment below, sign up, reflect)",
            "whyItWorks": "Why this specific post works for their goals"
        }
    ]
}

Ensure the output is 100% valid JSON with no trailing commas and no markdown wrapping.`;

            const responseText = await chatCompletion(prompt, 'You are a master social media strategist who only outputs correct, structured JSON.');

            let parsed;
            try {
                parsed = JSON.parse(responseText);
            } catch (err) {
                const jsonStr = responseText.replace(/```json\n?|\n?```/g, '').trim();
                parsed = JSON.parse(jsonStr);
            }

            res.json({ success: true, data: parsed });
        } catch (error) {
            next(error);
        }
    }
);

// Save a plan
const savePlanSchema = z.object({
    planTitle: z.string(),
    strategySummary: z.string(),
    posts: z.array(z.object({
        day: z.string(),
        concept: z.string(),
        format: z.string(),
        hookIdea: z.string(),
        callToAction: z.string(),
        whyItWorks: z.string(),
    }))
});

router.post(
    '/save',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = savePlanSchema.parse(req.body);

            const newPlan = await prisma.contentPlan.create({
                data: {
                    userId: req.user!.userId,
                    planTitle: data.planTitle,
                    strategySummary: data.strategySummary,
                    posts: {
                        create: data.posts.map(p => ({
                            day: p.day,
                            concept: p.concept,
                            format: p.format,
                            hookIdea: p.hookIdea,
                            callToAction: p.callToAction,
                            whyItWorks: p.whyItWorks,
                        }))
                    }
                },
                include: { posts: true }
            });

            res.json({ success: true, data: newPlan });
        } catch (error) {
            next(error);
        }
    }
);

// Get all saved plans for the user
router.get(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const plans = await prisma.contentPlan.findMany({
                where: { userId: req.user!.userId },
                include: { posts: true },
                orderBy: { createdAt: 'desc' }
            });

            res.json({ success: true, data: plans });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
