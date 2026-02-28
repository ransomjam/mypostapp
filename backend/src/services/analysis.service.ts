import { chatCompletionJSON } from './ai.service';
import { getAnalysisPrompt } from '../utils/prompts';
import { logger } from '../utils/logger';

export interface AnalysisResult {
    hook: string;
    body: string;
    cta: string | null;
    emotionalTriggerWords: string[];
    questionCount: number;
    readabilityLevel: 'easy' | 'moderate' | 'advanced';
    sentenceCount: number;
    avgWordsPerSentence: number;
    toneDetected: string;
    structureQuality: 'strong' | 'moderate' | 'weak';
    wordCount: number;
    charCount: number;
    hashtagCount: number;
    hashtags: string[];
    lineCount: number;
    emojiCount: number;
}

const EMOTIONAL_WORDS = [
    'amazing', 'powerful', 'transform', 'discover', 'secret', 'proven', 'essential',
    'incredible', 'stunning', 'breakthrough', 'revolutionary', 'life-changing',
    'mind-blowing', 'shocking', 'unbelievable', 'exclusive', 'ultimate', 'massive',
    'extraordinary', 'remarkable', 'crucial', 'urgent', 'critical', 'brilliant',
    'game-changing', 'epic', 'legendary', 'unstoppable', 'fearless', 'bold',
];

export async function analysePost(content: string): Promise<AnalysisResult> {
    logger.info(`Analysing post — ${content.length} characters`);

    const words = content.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = content.length;
    const hashtags = content.match(/#\w+/g) || [];
    const hashtagCount = hashtags.length;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const sentenceCount = sentences.length;
    const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;
    const questionCount = (content.match(/\?/g) || []).length;
    const lineCount = content.split('\n').filter((l) => l.trim().length > 0).length;
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
    const emojiCount = (content.match(emojiRegex) || []).length;

    const lowerContent = content.toLowerCase();
    const foundEmotionalWords = EMOTIONAL_WORDS.filter((w) => lowerContent.includes(w));

    // Determine readability
    let readabilityLevel: 'easy' | 'moderate' | 'advanced' = 'moderate';
    if (avgWordsPerSentence <= 10) readabilityLevel = 'easy';
    else if (avgWordsPerSentence >= 20) readabilityLevel = 'advanced';

    // Try AI analysis for hook/body/CTA extraction
    let aiAnalysis: any = {};
    try {
        const prompt = getAnalysisPrompt(content);
        aiAnalysis = await chatCompletionJSON(prompt, 'You are a social media content analyst. Return only valid JSON.');
    } catch {
        logger.warn('AI analysis failed, using heuristic fallback');
    }

    // Heuristic fallback for hook/body/CTA
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const hook = aiAnalysis.hook || lines[0] || '';
    const cta = aiAnalysis.cta || (lines.length > 2 ? lines[lines.length - 1] : null);
    const body = aiAnalysis.body || (lines.length > 2 ? lines.slice(1, -1).join('\n') : lines.slice(1).join('\n'));

    // Determine structure quality
    let structureQuality: 'strong' | 'moderate' | 'weak' = 'moderate';
    if (hook && cta && lineCount >= 3) structureQuality = 'strong';
    else if (!cta || lineCount < 2) structureQuality = 'weak';

    return {
        hook,
        body,
        cta,
        emotionalTriggerWords: foundEmotionalWords.length > 0
            ? foundEmotionalWords
            : (aiAnalysis.emotionalTriggerWords || []),
        questionCount,
        readabilityLevel,
        sentenceCount,
        avgWordsPerSentence,
        toneDetected: aiAnalysis.toneDetected || 'professional',
        structureQuality,
        wordCount,
        charCount,
        hashtagCount,
        hashtags,
        lineCount,
        emojiCount,
    };
}
