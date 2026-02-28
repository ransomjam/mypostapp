import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';
import { logger } from '../utils/logger';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic | null {
    if (!config.anthropic.apiKey) {
        return null;
    }
    if (!anthropicClient) {
        anthropicClient = new Anthropic({
            apiKey: config.anthropic.apiKey,
        });
    }
    return anthropicClient;
}

export async function chatCompletion(prompt: string, systemMessage?: string): Promise<string> {
    const client = getClient();

    if (!client) {
        logger.warn('Anthropic API key not configured — returning mock response');
        return generateMockResponse(prompt);
    }

    try {
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: config.openai.maxTokens,
            temperature: 0.7,
            system: systemMessage,
            messages: [
                { role: 'user', content: prompt }
            ]
        });

        // @ts-ignore - The text block exists on the response format
        return response.content[0]?.text || '';
    } catch (error: any) {
        logger.error(`Anthropic API error: ${error.message}`);
        throw new Error(`AI service unavailable: ${error.message}`);
    }
}

export async function chatCompletionJSON<T = any>(prompt: string, systemMessage?: string): Promise<T> {
    const client = getClient();

    if (!client) {
        logger.warn('Anthropic API key not configured — returning mock JSON');
        const mockText = generateMockResponse(prompt);
        try {
            return JSON.parse(mockText) as T;
        } catch {
            return {} as T;
        }
    }

    try {
        // Claude handles JSON primarily through standard prompting with prefilled Assistant text
        const response = await client.messages.create({
            model: 'claude-3-haiku-20240307',
            max_tokens: config.openai.maxTokens,
            temperature: 0.3,
            system: systemMessage,
            messages: [
                { role: 'user', content: prompt + '\nIMPORTANT: Return ONLY valid JSON, no markdown. Do not include introductory text.' },
                { role: 'assistant', content: '{' } // Prefill to force JSON structure
            ]
        });

        // @ts-ignore
        const text = response.content[0]?.text?.trim() || '';

        // Reconstruct the JSON since we prefilled the first bracket
        const fullJson = '{' + text;
        return JSON.parse(fullJson) as T;
    } catch (error: any) {
        logger.error(`Anthropic JSON API error: ${error.message}`);
        throw new Error(`AI service unavailable: ${error.message}`);
    }
}

function generateMockResponse(prompt: string): string {
    if (prompt.includes('Analyze') || prompt.includes('analyse')) {
        return JSON.stringify({
            hook: 'Opening hook line of the post',
            body: 'The main body content of the post',
            cta: 'Follow for more insights!',
            emotionalTriggerWords: ['powerful', 'transform', 'discover', 'essential'],
            questionCount: 1,
            readabilityLevel: 'moderate',
            sentenceCount: 5,
            avgWordsPerSentence: 12,
            toneDetected: 'professional',
            structureQuality: 'strong',
        });
    }

    return `🚀 Here's a powerful insight about your topic!

Every expert was once a beginner. The key difference? They never stopped showing up.

Here are 3 things that separate the top 1%:

1️⃣ They prioritize consistency over perfection
2️⃣ They learn from every failure
3️⃣ They invest in their personal growth daily

The best time to start was yesterday. The second best time is NOW.

💡 What's one habit that transformed your career? Drop it in the comments!

#GrowthMindset #Success #Motivation #Leadership #PersonalDevelopment`;
}
