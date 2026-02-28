import { chatCompletion } from './ai.service';
import { getGenerationPrompt, PlatformKey } from '../utils/prompts';
import { logger } from '../utils/logger';

export interface GenerationParams {
    topic: string;
    platform: PlatformKey;
    tone: string;
    lengthPreference: string;
    audience: string;
    goal?: string;
    samplePost?: string;
    contextData?: string;
}

export interface GenerationResult {
    content: string;
    platform: PlatformKey;
    metadata: {
        wordCount: number;
        charCount: number;
        hashtagCount: number;
        estimatedReadTime: string;
    };
}

export async function generatePost(params: GenerationParams): Promise<GenerationResult> {
    logger.info(`Generating post for ${params.platform} — topic: "${params.topic}"`);

    const prompt = getGenerationPrompt(params);
    let content = await chatCompletion(prompt, 'You are a skilled social media writer for a real African organisation. You write like a human observer who was physically present — specific, grounded, and direct. You never use hype, clichés, or generic inspiration. You describe what actually happened, who was involved, and why it matters in simple, honest language.');

    // -------------------------------------------------------------
    // SELF-ANALYSIS & IMPROVEMENT LOOP
    // -------------------------------------------------------------
    logger.info(`Self-analyzing generated post for ${params.platform}...`);
    const { scorePost } = require('./scoring.service');
    const score = scorePost(content, params.platform);

    if (score.suggestions.length > 0 || score.breakdown.penalties.reasons.length > 0) {
        logger.info(`Self-correcting post based on ${score.suggestions.length} suggestions and ${score.breakdown.penalties.reasons.length} penalties.`);

        content = await fixPost({
            content,
            platform: params.platform,
            suggestions: score.suggestions,
            penalties: score.breakdown.penalties.reasons
        });
    } else {
        logger.info('Self-analysis passed with flying colors. No rewrite needed.');
    }
    // -------------------------------------------------------------

    const wordCount = content.split(/\s+/).filter(Boolean).length;
    const hashtagCount = (content.match(/#\w+/g) || []).length;
    const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

    return {
        content,
        platform: params.platform,
        metadata: {
            wordCount,
            charCount: content.length,
            hashtagCount,
            estimatedReadTime: `${readTimeMinutes} min read`,
        },
    };
}

export async function fixPost(params: {
    content: string;
    platform: PlatformKey;
    suggestions: string[];
    penalties: string[];
}): Promise<string> {
    logger.info(`Fixing post for ${params.platform}`);
    const prompt = require('../utils/prompts').getFixPrompt(params);
    const fixedContent = await chatCompletion(prompt, 'You are a world-class social media content editor.');
    return fixedContent;
}
