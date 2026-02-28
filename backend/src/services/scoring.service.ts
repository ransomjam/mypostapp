import { PlatformKey, PLATFORM_CONFIGS } from '../utils/prompts';
import { logger } from '../utils/logger';

export interface ScoreBreakdown {
    hookStrength: { score: number; max: 20; reason: string };
    ctaPresence: { score: number; max: 10; reason: string };
    emotionalIntensity: { score: number; max: 15; reason: string };
    platformLengthCompliance: { score: number; max: 15; reason: string };
    hashtagOptimisation: { score: number; max: 10; reason: string };
    readabilityMatch: { score: number; max: 15; reason: string };
    questionEngagement: { score: number; max: 10; reason: string };
    penalties: { score: number; max: -15; reasons: string[] };
}

export interface ScoringResult {
    totalScore: number;
    grade: string;
    breakdown: ScoreBreakdown;
    suggestions: string[];
}

const EMOTIONAL_WORDS = [
    'amazing', 'powerful', 'transform', 'discover', 'secret', 'proven', 'essential',
    'incredible', 'stunning', 'breakthrough', 'revolutionary', 'life-changing',
    'mind-blowing', 'shocking', 'unbelievable', 'exclusive', 'ultimate', 'massive',
    'extraordinary', 'remarkable', 'crucial', 'urgent', 'critical', 'brilliant',
    'game-changing', 'epic', 'legendary', 'unstoppable', 'fearless', 'bold',
];

const CTA_PATTERNS = [
    /comment/i, /share/i, /follow/i, /click/i, /subscribe/i, /join/i,
    /link in bio/i, /check out/i, /learn more/i, /sign up/i, /get started/i,
    /tag (a |someone|your)/i, /let me know/i, /what do you think/i,
    /drop a/i, /save this/i, /repost/i, /dm me/i, /tell me/i,
];

const HOOK_PATTERNS = [
    /^(stop|wait|listen|attention|breaking|imagine|what if|did you know)/i,
    /^[\u{1F600}-\u{1F6FF}]/u,
    /^\d+ (things|ways|tips|reasons|steps|secrets|mistakes)/i,
    /^(here'?s? (what|why|how))/i,
    /^(the truth|nobody|most people|unpopular opinion)/i,
    /!$/,
];

export function scorePost(content: string, platform: PlatformKey): ScoringResult {
    logger.info(`Scoring post for ${platform}`);

    const pConfig = PLATFORM_CONFIGS[platform];
    const lines = content.split('\n').filter((l) => l.trim().length > 0);
    const words = content.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const charCount = content.length;
    const hashtags = content.match(/#\w+/g) || [];
    const hashtagCount = hashtags.length;
    const questionCount = (content.match(/\?/g) || []).length;
    const sentences = content.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgWordsPerSentence = sentences.length > 0 ? wordCount / sentences.length : 0;
    const lowerContent = content.toLowerCase();
    const firstLine = lines[0] || '';

    const suggestions: string[] = [];

    // 1. Hook Strength (0-20)
    let hookScore = 5; // baseline
    let hookReason = 'Basic opening';
    const hookMatches = HOOK_PATTERNS.filter((p) => p.test(firstLine)).length;
    if (hookMatches >= 2) {
        hookScore = 18;
        hookReason = 'Powerful hook with multiple engagement triggers';
    } else if (hookMatches === 1) {
        hookScore = 14;
        hookReason = 'Good hook with engagement trigger';
    } else if (firstLine.length > 10 && firstLine.length < 80) {
        hookScore = 10;
        hookReason = 'Decent opening but could be stronger';
        suggestions.push('Start with a bold statement or number to create a stronger hook');
    } else {
        hookScore = 5;
        hookReason = 'Weak hook — needs improvement';
        suggestions.push('Your opening line needs work. Try: "Stop doing X...", or a bold claim');
    }

    let ctaScore = 0;
    let ctaReason = 'No CTA detected';
    const ctaMatches = CTA_PATTERNS.filter((p) => p.test(content)).length;
    if (ctaMatches >= 2) {
        ctaScore = 10;
        ctaReason = 'Strong CTA with multiple action prompts';
    } else if (ctaMatches === 1) {
        ctaScore = 7;
        ctaReason = 'CTA present but could be stronger';
        suggestions.push('Consider adding a second CTA or making your existing one more specific');
    } else {
        ctaScore = 0;
        ctaReason = 'No clear call-to-action found (if one is needed)';
        suggestions.push('If applicable, add a bold CTA command. Avoid questions.');
    }

    // 3. Emotional Intensity (0-15)
    const emotionalWordCount = EMOTIONAL_WORDS.filter((w) => lowerContent.includes(w)).length;
    let emotionalScore = Math.min(15, emotionalWordCount * 3);
    let emotionalReason = '';
    if (emotionalWordCount >= 5) {
        emotionalScore = 15;
        emotionalReason = 'High emotional resonance';
    } else if (emotionalWordCount >= 3) {
        emotionalScore = 10;
        emotionalReason = 'Good emotional engagement';
    } else if (emotionalWordCount >= 1) {
        emotionalScore = 5;
        emotionalReason = 'Some emotional triggers present';
        suggestions.push('Add more power words like "transform", "discover", "essential" to boost engagement');
    } else {
        emotionalScore = 2;
        emotionalReason = 'Low emotional intensity';
        suggestions.push('Your post lacks emotional triggers. Add words that evoke curiosity, urgency, or excitement');
    }

    // 4. Platform Length Compliance (0-15)
    let lengthScore = 0;
    let lengthReason = '';
    const { idealLength, maxLength } = pConfig;
    if (charCount >= idealLength.min && charCount <= idealLength.max) {
        lengthScore = 15;
        lengthReason = `Perfect length for ${pConfig.name}`;
    } else if (charCount < idealLength.min) {
        const ratio = charCount / idealLength.min;
        lengthScore = Math.round(ratio * 10);
        lengthReason = `Too short for ${pConfig.name} (${charCount}/${idealLength.min} min chars)`;
        suggestions.push(`Your post is too short for ${pConfig.name}. Aim for ${idealLength.min}-${idealLength.max} characters`);
    } else if (charCount > idealLength.max && charCount <= maxLength) {
        lengthScore = 10;
        lengthReason = `Slightly long for ${pConfig.name} but within limits`;
    } else {
        lengthScore = 3;
        lengthReason = `Exceeds ${pConfig.name} limits`;
        suggestions.push(`Your post exceeds the ideal length for ${pConfig.name}. Trim to under ${idealLength.max} characters`);
    }

    // 5. Hashtag Optimisation (0-10)
    let hashtagScore = 0;
    let hashtagReason = '';
    const { hashtagRange } = pConfig;
    if (hashtagCount >= hashtagRange.min && hashtagCount <= hashtagRange.max) {
        hashtagScore = 10;
        hashtagReason = `Optimal hashtag count for ${pConfig.name}`;
    } else if (hashtagCount < hashtagRange.min) {
        hashtagScore = hashtagCount > 0 ? 5 : 2;
        hashtagReason = `Too few hashtags for ${pConfig.name}`;
        suggestions.push(`Add ${hashtagRange.min - hashtagCount} more hashtags. ${pConfig.name} works best with ${hashtagRange.min}-${hashtagRange.max}`);
    } else {
        hashtagScore = Math.max(0, 10 - (hashtagCount - hashtagRange.max) * 2);
        hashtagReason = `Too many hashtags for ${pConfig.name}`;
        suggestions.push(`Reduce hashtags to ${hashtagRange.max} max for ${pConfig.name}`);
    }

    // 6. Readability Match (0-15)
    let readabilityScore = 10; // baseline
    let readabilityReason = 'Good readability';
    if (avgWordsPerSentence <= 15 && lines.length >= 3) {
        readabilityScore = 15;
        readabilityReason = 'Excellent readability with line breaks';
    } else if (avgWordsPerSentence > 25) {
        readabilityScore = 5;
        readabilityReason = 'Sentences too long — hard to read on mobile';
        suggestions.push('Break up long sentences. Social media users prefer short, punchy sentences');
    } else if (lines.length < 2) {
        readabilityScore = 7;
        readabilityReason = 'Add line breaks for better readability';
        suggestions.push('Use line breaks to structure your post. Wall-of-text posts get lower engagement');
    }

    // 7. Statement Emphasis (0-10)
    let questionScore = 0;
    let questionReason = '';
    if (questionCount === 0) {
        questionScore = 10;
        questionReason = 'Strong authoritative statements, zero questions utilized.';
    } else if (questionCount === 1) {
        questionScore = 5;
        questionReason = 'One question present — could dilute authority.';
        suggestions.push('Avoid questions. Turn your question into a definitive statement to sound more authoritative.');
    } else {
        questionScore = 0;
        questionReason = 'Too many questions used';
        suggestions.push('You are asking too many questions! Remove your questions and assert your point definitively.');
    }

    // 8. Penalties
    let penaltyScore = 0;
    const penaltyReasons: string[] = [];

    // All caps overuse
    const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w)).length;
    const capsRatio = wordCount > 0 ? capsWords / wordCount : 0;
    if (capsRatio > 0.3) {
        penaltyScore -= 5;
        penaltyReasons.push('Excessive use of ALL CAPS');
        suggestions.push('Reduce ALL CAPS usage — it looks like shouting and may be flagged as spam');
    }

    // Excessive exclamation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 5) {
        penaltyScore -= 3;
        penaltyReasons.push('Too many exclamation marks');
    }

    // Engagement bait
    const baitPhrases = ['follow for follow', 'like for like', 'f4f', 'l4l', 'follow back', 'share and win'];
    const hasBait = baitPhrases.some((p) => lowerContent.includes(p));
    if (hasBait) {
        penaltyScore -= 5;
        penaltyReasons.push('Engagement bait detected');
        suggestions.push('Remove engagement bait phrases — algorithms penalize this behavior');
    }

    // Spam phrases
    const spamPhrases = ['buy now', 'limited time', 'act now', 'click here', '100% free', 'no credit card'];
    const hasSpam = spamPhrases.some((p) => lowerContent.includes(p));
    if (hasSpam) {
        penaltyScore -= 5;
        penaltyReasons.push('Spam-like language detected');
    }

    penaltyScore = Math.max(-15, penaltyScore);

    const breakdown: ScoreBreakdown = {
        hookStrength: { score: hookScore, max: 20, reason: hookReason },
        ctaPresence: { score: ctaScore, max: 10, reason: ctaReason },
        emotionalIntensity: { score: emotionalScore, max: 15, reason: emotionalReason },
        platformLengthCompliance: { score: lengthScore, max: 15, reason: lengthReason },
        hashtagOptimisation: { score: hashtagScore, max: 10, reason: hashtagReason },
        readabilityMatch: { score: readabilityScore, max: 15, reason: readabilityReason },
        questionEngagement: { score: questionScore, max: 10, reason: questionReason },
        penalties: { score: penaltyScore, max: -15, reasons: penaltyReasons },
    };

    const totalScore = Math.max(0, Math.min(100,
        hookScore + ctaScore + emotionalScore + lengthScore +
        hashtagScore + readabilityScore + questionScore + penaltyScore
    ));

    let grade = 'F';
    if (totalScore >= 90) grade = 'A+';
    else if (totalScore >= 80) grade = 'A';
    else if (totalScore >= 70) grade = 'B';
    else if (totalScore >= 60) grade = 'C';
    else if (totalScore >= 50) grade = 'D';

    return {
        totalScore,
        grade,
        breakdown,
        suggestions,
    };
}
