import { chatCompletion } from './ai.service';
import { getAdaptationPrompt, PlatformKey, PLATFORM_CONFIGS } from '../utils/prompts';
import { logger } from '../utils/logger';

export interface AdaptationResult {
    platform: PlatformKey;
    content: string;
    metadata: {
        wordCount: number;
        charCount: number;
        hashtagCount: number;
        withinLimits: boolean;
    };
}

export async function adaptPost(
    content: string,
    targetPlatforms: PlatformKey[]
): Promise<AdaptationResult[]> {
    logger.info(`Adapting post to ${targetPlatforms.length} platforms`);

    const results: AdaptationResult[] = [];

    for (const platform of targetPlatforms) {
        const prompt = getAdaptationPrompt({ content, targetPlatform: platform });
        const adapted = await chatCompletion(prompt, 'You are an expert social media content adapter.');

        const pConfig = PLATFORM_CONFIGS[platform];
        const wordCount = adapted.split(/\s+/).filter(Boolean).length;
        const hashtagCount = (adapted.match(/#\w+/g) || []).length;

        results.push({
            platform,
            content: adapted,
            metadata: {
                wordCount,
                charCount: adapted.length,
                hashtagCount,
                withinLimits: adapted.length <= pConfig.maxLength,
            },
        });
    }

    return results;
}
