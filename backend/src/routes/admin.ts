import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { scrapeUrl } from '../services/scraper.service';
import { PlatformKey } from '../utils/prompts';

const router = Router();
const prisma = new PrismaClient();

// Middleware to ensure user is ADMIN
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user || !req.user.userId) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
    }
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (!user || user.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
        return;
    }
    next();
}

router.use(authenticate, requireAdmin);

// Get all scraped samples
router.get('/samples', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const samples = await prisma.scrapedSample.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: samples });
    } catch (error) {
        next(error);
    }
});

// Create or Scrape a new sample
router.post('/samples', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { platform, url, content, engagementScore, isActive } = req.body;

        if (!platform) {
            res.status(400).json({ success: false, error: 'Platform is required' });
            return;
        }

        let finalContent = content;
        let finalUrl = url;

        // If no content passed, trigger scraper (even if URL is empty, we fake it for the demo)
        if (!finalContent) {
            if (!finalUrl) {
                finalUrl = `https://${platform.toLowerCase()}.com/post/demo-pattern-${Date.now()}`;
            }
            finalContent = await scrapeUrl(finalUrl, platform as PlatformKey);
        }

        if (!finalContent && !finalUrl) {
            res.status(400).json({ success: false, error: 'Content or valid URL required' });
            return;
        }

        const sample = await prisma.scrapedSample.create({
            data: {
                platform,
                url: finalUrl || null,
                content: finalContent,
                engagementScore: parseInt(engagementScore) || 0,
                isActive: isActive !== undefined ? isActive : true
            }
        });

        res.status(201).json({ success: true, data: sample });
    } catch (error) {
        next(error);
    }
});

// Update a sample
router.put('/samples/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { platform, url, content, engagementScore, isActive } = req.body;

        const sample = await prisma.scrapedSample.update({
            where: { id: req.params.id },
            data: {
                platform,
                url,
                content,
                engagementScore: engagementScore !== undefined ? parseInt(engagementScore) : undefined,
                isActive
            }
        });

        res.json({ success: true, data: sample });
    } catch (error) {
        next(error);
    }
});

// Delete a sample
router.delete('/samples/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await prisma.scrapedSample.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
