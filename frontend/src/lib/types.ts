export type Platform = 'INSTAGRAM' | 'LINKEDIN' | 'X' | 'FACEBOOK' | 'TIKTOK';
export type Tone = 'auto' | 'professional' | 'casual' | 'inspirational' | 'educational' | 'humorous' | 'authoritative' | 'empathetic' | 'provocative';
export type LengthPreference = 'auto' | 'short' | 'medium' | 'long';

export interface User {
    id: string;
    email: string;
    role?: string;
    planType: string;
    createdAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface GenerationParams {
    topic: string;
    platform: Platform;
    tone: Tone;
    lengthPreference: LengthPreference;
    audience: string;
}

export interface GenerationResult {
    postId: string;
    content: string;
    platform: Platform;
    metadata: {
        wordCount: number;
        charCount: number;
        hashtagCount: number;
        estimatedReadTime: string;
    };
}

export interface AdaptationResult {
    platform: Platform;
    content: string;
    metadata: {
        wordCount: number;
        charCount: number;
        hashtagCount: number;
        withinLimits: boolean;
    };
}

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

export interface ScoreBreakdown {
    hookStrength: { score: number; max: number; reason: string };
    ctaPresence: { score: number; max: number; reason: string };
    emotionalIntensity: { score: number; max: number; reason: string };
    platformLengthCompliance: { score: number; max: number; reason: string };
    hashtagOptimisation: { score: number; max: number; reason: string };
    readabilityMatch: { score: number; max: number; reason: string };
    questionEngagement: { score: number; max: number; reason: string };
    penalties: { score: number; max: number; reasons: string[] };
}

export interface ScoringResult {
    totalScore: number;
    grade: string;
    breakdown: ScoreBreakdown;
    suggestions: string[];
}

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

export interface ImageOptimisationResult {
    original: { width: number; height: number; ratio: string };
    suggestedRatios: string[];
    optimised: {
        ratio: string;
        width: number;
        height: number;
        filename: string;
        path: string;
        sizeKB: number;
    }[];
}

export interface APIResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    details?: { field: string; message: string }[];
}

export const PLATFORMS: { key: Platform; label: string; icon: string; color: string }[] = [
    { key: 'INSTAGRAM', label: 'Instagram', icon: '📸', color: '#E4405F' },
    { key: 'LINKEDIN', label: 'LinkedIn', icon: '💼', color: '#0A66C2' },
    { key: 'X', label: 'X (Twitter)', icon: '𝕏', color: '#000000' },
    { key: 'FACEBOOK', label: 'Facebook', icon: '📘', color: '#1877F2' },
    { key: 'TIKTOK', label: 'TikTok', icon: '🎵', color: '#000000' },
];

export const TONES: { key: Tone; label: string; emoji: string }[] = [
    { key: 'auto', label: 'Auto', emoji: '✨' },
    { key: 'professional', label: 'Professional', emoji: '👔' },
    { key: 'casual', label: 'Casual', emoji: '😊' },
    { key: 'inspirational', label: 'Inspirational', emoji: '✨' },
    { key: 'educational', label: 'Educational', emoji: '📚' },
    { key: 'humorous', label: 'Humorous', emoji: '😄' },
    { key: 'authoritative', label: 'Authoritative', emoji: '🎯' },
    { key: 'empathetic', label: 'Empathetic', emoji: '💛' },
    { key: 'provocative', label: 'Provocative', emoji: '🔥' },
];

export const LENGTHS: { key: LengthPreference; label: string }[] = [
    { key: 'auto', label: '✨ Auto' },
    { key: 'short', label: 'Short & punchy' },
    { key: 'medium', label: 'Medium length' },
    { key: 'long', label: 'Long-form' },
];
