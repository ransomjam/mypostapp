import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { authenticate } from '../middleware/auth';
import { optimiseImage } from '../services/image.service';
import { config } from '../config';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Configure multer
const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        const dir = path.join(config.upload.uploadDir, 'raw');
        await fs.mkdir(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const upload = multer({
    storage,
    limits: {
        fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowed.includes(ext)) {
            cb(null, true);
        } else {
            cb(new AppError('Invalid file type. Allowed: jpg, png, webp, gif', 400) as any);
        }
    },
});

router.post(
    '/optimise',
    authenticate,
    upload.single('image'),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (!req.file) {
                throw new AppError('No image file provided', 400);
            }

            const ratios = req.body.ratios
                ? (Array.isArray(req.body.ratios) ? req.body.ratios : [req.body.ratios])
                : undefined;

            const result = await optimiseImage(req.file.path, ratios);

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
