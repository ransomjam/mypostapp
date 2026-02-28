import { Router, Request, Response, NextFunction } from 'express';
import { adaptSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { adaptPost } from '../services/adaptation.service';
import { PlatformKey } from '../utils/prompts';

const router = Router();

router.post(
    '/',
    authenticate,
    aiLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = adaptSchema.parse(req.body);

            const results = await adaptPost(
                data.content,
                data.targetPlatforms as PlatformKey[]
            );

            res.json({
                success: true,
                data: {
                    original: data.content,
                    adaptations: results,
                },
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
