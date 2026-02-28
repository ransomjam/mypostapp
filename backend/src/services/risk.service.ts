import { logger } from '../utils/logger';

export interface RiskWarning {
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    suggestion: string;
}

export interface RiskResult {
    riskLevel: 'low' | 'medium' | 'high';
    warnings: RiskWarning[];
    passedChecks: string[];
}

const SPAM_PHRASES = [
    'buy now', 'limited time offer', 'act now', 'click here now',
    '100% free', 'no credit card', 'make money fast', 'double your income',
    'get rich quick', 'once in a lifetime', 'guaranteed results',
    'you won\'t believe', 'doctors hate this', 'one weird trick',
];

const ENGAGEMENT_BAIT = [
    'follow for follow', 'like for like', 'f4f', 'l4l', 'follow back',
    'share to win', 'tag to win', 'like and share', 'share and tag',
    'comment your zodiac', 'type yes if', 'ignore if you don\'t care',
    'only real ones', 'share if you agree',
];

const SENSITIVE_KEYWORDS = [
    'vaccine', 'conspiracy', 'political', 'election', 'terrorist',
    'suicide', 'self-harm', 'eating disorder', 'drug abuse',
    'hate speech', 'racial slur', 'discriminat',
];

export function detectRisks(content: string): RiskResult {
    logger.info('Running risk detection');

    const warnings: RiskWarning[] = [];
    const passedChecks: string[] = [];
    const lowerContent = content.toLowerCase();
    const words = content.split(/\s+/).filter(Boolean);
    const hashtags = content.match(/#\w+/g) || [];

    // 1. Excessive Hashtags
    if (hashtags.length > 20) {
        warnings.push({
            type: 'EXCESSIVE_HASHTAGS',
            severity: 'high',
            message: `${hashtags.length} hashtags detected — most platforms will flag this as spam`,
            suggestion: 'Reduce to 5-15 hashtags maximum. Quality over quantity.',
        });
    } else if (hashtags.length > 15) {
        warnings.push({
            type: 'EXCESSIVE_HASHTAGS',
            severity: 'medium',
            message: `${hashtags.length} hashtags detected — nearing spam threshold`,
            suggestion: 'Consider reducing hashtags. 5-10 targeted hashtags perform best.',
        });
    } else {
        passedChecks.push('Hashtag count within acceptable range');
    }

    // 2. Engagement Bait
    const baitFound = ENGAGEMENT_BAIT.filter((phrase) => lowerContent.includes(phrase));
    if (baitFound.length > 0) {
        warnings.push({
            type: 'ENGAGEMENT_BAIT',
            severity: 'high',
            message: `Engagement bait detected: "${baitFound.join('", "')}"`,
            suggestion: 'Remove engagement bait phrases. Algorithms actively suppress this content.',
        });
    } else {
        passedChecks.push('No engagement bait detected');
    }

    // 3. Spam Phrases
    const spamFound = SPAM_PHRASES.filter((phrase) => lowerContent.includes(phrase));
    if (spamFound.length > 0) {
        warnings.push({
            type: 'SPAM_PHRASES',
            severity: spamFound.length >= 3 ? 'high' : 'medium',
            message: `Spam-like phrases detected: "${spamFound.join('", "')}"`,
            suggestion: 'Rewrite using authentic language. Avoid clickbait and promotional clichés.',
        });
    } else {
        passedChecks.push('No spam phrases detected');
    }

    // 4. All Caps Overuse
    const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase() && /[A-Z]/.test(w));
    const capsRatio = words.length > 0 ? capsWords.length / words.length : 0;
    if (capsRatio > 0.5) {
        warnings.push({
            type: 'ALL_CAPS_OVERUSE',
            severity: 'high',
            message: `${Math.round(capsRatio * 100)}% of words are ALL CAPS`,
            suggestion: 'Use caps sparingly for emphasis. Excessive caps looks spammy and aggressive.',
        });
    } else if (capsRatio > 0.2) {
        warnings.push({
            type: 'ALL_CAPS_OVERUSE',
            severity: 'low',
            message: `${Math.round(capsRatio * 100)}% of words are ALL CAPS — nearing threshold`,
            suggestion: 'Reduce caps usage. Use bold or emojis for emphasis instead.',
        });
    } else {
        passedChecks.push('All-caps usage within acceptable range');
    }

    // 5. Sensitive Keywords
    const sensitiveFound = SENSITIVE_KEYWORDS.filter((kw) => lowerContent.includes(kw));
    if (sensitiveFound.length > 0) {
        warnings.push({
            type: 'SENSITIVE_CONTENT',
            severity: 'medium',
            message: `Potentially sensitive topics detected: "${sensitiveFound.join('", "')}"`,
            suggestion: 'Review content carefully. Sensitive topics may receive reduced distribution on some platforms.',
        });
    } else {
        passedChecks.push('No sensitive keywords detected');
    }

    // 6. Excessive Exclamation
    const exclamationCount = (content.match(/!/g) || []).length;
    if (exclamationCount > 8) {
        warnings.push({
            type: 'EXCESSIVE_PUNCTUATION',
            severity: 'low',
            message: `${exclamationCount} exclamation marks — may appear spammy`,
            suggestion: 'Use exclamation marks sparingly. 2-3 per post is ideal.',
        });
    } else {
        passedChecks.push('Punctuation usage is appropriate');
    }

    // 7. URL overuse
    const urlCount = (content.match(/https?:\/\//g) || []).length;
    if (urlCount > 2) {
        warnings.push({
            type: 'EXCESSIVE_LINKS',
            severity: 'medium',
            message: `${urlCount} links detected — most platforms suppress multi-link posts`,
            suggestion: 'Use a single link or "link in bio" strategy. Multiple links reduce reach.',
        });
    } else {
        passedChecks.push('Link count is appropriate');
    }

    // Determine overall risk level
    const highCount = warnings.filter((w) => w.severity === 'high').length;
    const mediumCount = warnings.filter((w) => w.severity === 'medium').length;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (highCount >= 2 || (highCount >= 1 && mediumCount >= 2)) riskLevel = 'high';
    else if (highCount >= 1 || mediumCount >= 2) riskLevel = 'medium';

    return { riskLevel, warnings, passedChecks };
}
