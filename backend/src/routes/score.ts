import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { scoreSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { scorePost } from '../services/scoring.service';
import { PlatformKey } from '../utils/prompts';

const router = Router();
const prisma = new PrismaClient();

router.post(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = scoreSchema.parse(req.body);
            const result = scorePost(data.content, data.platform as PlatformKey);

            // Optionally save if postId provided
            if (req.body.postId) {
                await prisma.analysisResult.create({
                    data: {
                        postId: req.body.postId,
                        engagementScore: result.totalScore,
                        hookScore: result.breakdown.hookStrength.score,
                        ctaScore: result.breakdown.ctaPresence.score,
                        readabilityScore: result.breakdown.readabilityMatch.score,
                        hashtagScore: result.breakdown.hashtagOptimisation.score,
                        emotionalScore: result.breakdown.emotionalIntensity.score,
                        lengthScore: result.breakdown.platformLengthCompliance.score,
                        questionScore: result.breakdown.questionEngagement.score,
                        riskFlags: [],
                        breakdownJson: result.breakdown as any,
                        suggestions: result.suggestions,
                    },
                });
            }

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/fix',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { fixSchema } = require('../middleware/validator');
            const data = fixSchema.parse(req.body);
            const { fixPost } = require('../services/generation.service');
            const fixedContent = await fixPost({
                content: data.content,
                platform: data.platform,
                suggestions: data.suggestions,
                penalties: data.penalties,
            });

            res.json({
                success: true,
                data: fixedContent,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
