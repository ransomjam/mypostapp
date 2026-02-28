import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { createContextSchema, updateContextSchema } from '../middleware/validator';

const router = Router();
const prisma = new PrismaClient();

// Get all context profiles for user
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const contexts = await prisma.contextProfile.findMany({
            where: { userId: req.user!.userId },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: contexts });
    } catch (error) {
        next(error);
    }
});

// Create new context profile
router.post('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = createContextSchema.parse(req.body);

        const context = await prisma.contextProfile.create({
            data: {
                userId: req.user!.userId,
                name: data.name,
                type: data.type,
                description: data.description,
                keywords: data.keywords,
            },
        });

        res.status(201).json({ success: true, data: context });
    } catch (error) {
        next(error);
    }
});

// Get a single context profile
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const context = await prisma.contextProfile.findUnique({
            where: { id: req.params.id, userId: req.user!.userId },
        });

        if (!context) {
            return res.status(404).json({ success: false, error: 'Context profile not found' });
        }

        res.json({ success: true, data: context });
    } catch (error) {
        next(error);
    }
});

// Update context profile
router.put('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = updateContextSchema.parse(req.body);

        const exists = await prisma.contextProfile.findUnique({
            where: { id: req.params.id, userId: req.user!.userId },
        });

        if (!exists) {
            return res.status(404).json({ success: false, error: 'Context profile not found' });
        }

        const context = await prisma.contextProfile.update({
            where: { id: req.params.id },
            data,
        });

        res.json({ success: true, data: context });
    } catch (error) {
        next(error);
    }
});

// Delete context profile
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const exists = await prisma.contextProfile.findUnique({
            where: { id: req.params.id, userId: req.user!.userId },
        });

        if (!exists) {
            return res.status(404).json({ success: false, error: 'Context profile not found' });
        }

        await prisma.contextProfile.delete({
            where: { id: req.params.id },
        });

        res.json({ success: true, data: { deleted: true } });
    } catch (error) {
        next(error);
    }
});

export default router;
