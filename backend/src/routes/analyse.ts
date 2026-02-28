import { Router, Request, Response, NextFunction } from 'express';
import { analyseSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { aiLimiter } from '../middleware/rateLimiter';
import { analysePost } from '../services/analysis.service';

const router = Router();

router.post(
    '/',
    authenticate,
    aiLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = analyseSchema.parse(req.body);
            const analysis = await analysePost(data.content);

            res.json({
                success: true,
                data: analysis,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
