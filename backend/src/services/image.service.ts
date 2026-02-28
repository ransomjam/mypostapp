import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface ImageDimensions {
    width: number;
    height: number;
    ratio: string;
}

export interface OptimisedImage {
    ratio: string;
    width: number;
    height: number;
    filename: string;
    path: string;
    sizeKB: number;
}

export interface ImageOptimisationResult {
    original: ImageDimensions;
    suggestedRatios: string[];
    optimised: OptimisedImage[];
}

const PLATFORM_RATIOS: Record<string, { width: number; height: number; label: string }> = {
    '1:1': { width: 1080, height: 1080, label: 'Square (Instagram Feed, Facebook)' },
    '4:5': { width: 1080, height: 1350, label: 'Portrait (Instagram Feed Optimal)' },
    '16:9': { width: 1920, height: 1080, label: 'Landscape (YouTube, LinkedIn, X)' },
    '9:16': { width: 1080, height: 1920, label: 'Stories/Reels (Instagram, TikTok)' },
};

function getRatioString(w: number, h: number): string {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const d = gcd(w, h);
    return `${w / d}:${h / d}`;
}

export async function optimiseImage(
    filePath: string,
    requestedRatios?: string[]
): Promise<ImageOptimisationResult> {
    logger.info(`Optimising image: ${filePath}`);

    // Ensure upload directory exists
    const outputDir = path.join(config.upload.uploadDir, 'optimised');
    await fs.mkdir(outputDir, { recursive: true });

    // Get original metadata
    const metadata = await sharp(filePath).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    const original: ImageDimensions = {
        width: originalWidth,
        height: originalHeight,
        ratio: getRatioString(originalWidth, originalHeight),
    };

    // Determine which ratios to produce
    const ratiosToProcess = requestedRatios && requestedRatios.length > 0
        ? requestedRatios.filter((r) => r in PLATFORM_RATIOS)
        : Object.keys(PLATFORM_RATIOS);

    const suggestedRatios = Object.entries(PLATFORM_RATIOS).map(
        ([ratio, info]) => `${ratio} — ${info.label}`
    );

    const optimised: OptimisedImage[] = [];
    const batchId = uuidv4().slice(0, 8);

    for (const ratio of ratiosToProcess) {
        const target = PLATFORM_RATIOS[ratio];
        if (!target) continue;

        const filename = `${batchId}_${ratio.replace(':', 'x')}.webp`;
        const outputPath = path.join(outputDir, filename);

        await sharp(filePath)
            .resize(target.width, target.height, {
                fit: 'cover',
                position: 'centre',
            })
            .webp({ quality: 85 })
            .toFile(outputPath);

        const stat = await fs.stat(outputPath);

        optimised.push({
            ratio,
            width: target.width,
            height: target.height,
            filename,
            path: `/uploads/optimised/${filename}`,
            sizeKB: Math.round(stat.size / 1024),
        });
    }

    logger.info(`Image optimised into ${optimised.length} variants`);

    return { original, suggestedRatios, optimised };
}
