import { Router, Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../middleware/validator';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';
import * as authService from '../services/auth.service';

const router = Router();

router.post(
    '/register',
    authLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = registerSchema.parse(req.body);
            const result = await authService.register(data.email, data.password);
            res.status(201).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

router.post(
    '/login',
    authLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = loginSchema.parse(req.body);
            const result = await authService.login(data.email, data.password);
            res.json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }
);

router.get(
    '/profile',
    authenticate,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const profile = await authService.getProfile(req.user!.userId);
            res.json({ success: true, data: profile });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
