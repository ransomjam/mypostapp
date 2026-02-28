import { Router, Request, Response, NextFunction } from 'express';
import { riskSchema } from '../middleware/validator';
import { authenticate } from '../middleware/auth';
import { detectRisks } from '../services/risk.service';

const router = Router();

router.post(
    '/',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = riskSchema.parse(req.body);
            const result = detectRisks(data.content);

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
