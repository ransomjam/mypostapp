import { z } from 'zod';

const platformEnum = z.enum(['INSTAGRAM', 'LINKEDIN', 'X', 'FACEBOOK', 'TIKTOK']);
const toneEnum = z.enum([
    'auto', 'professional', 'casual', 'inspirational', 'educational',
    'humorous', 'authoritative', 'empathetic', 'provocative',
]);
const lengthEnum = z.enum(['auto', 'short', 'medium', 'long']);

export const generateSchema = z.object({
    topic: z.string().min(3, 'Topic must be at least 3 characters').max(5000),
    platform: platformEnum,
    tone: toneEnum.default('professional'),
    lengthPreference: lengthEnum.default('medium'),
    audience: z.string().min(2).max(200).default('general audience'),
    goal: z.string().max(200).optional(),
    samplePost: z.string().max(5000).optional(),
    contextIds: z.array(z.string().uuid()).optional(),
    useSamples: z.boolean().optional(),
});

export const adaptSchema = z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(10000),
    targetPlatforms: z.array(platformEnum).min(1, 'At least one target platform required'),
});

export const analyseSchema = z.object({
    content: z.string().min(10, 'Content must be at least 10 characters').max(10000),
    platform: platformEnum.optional(),
});

export const scoreSchema = z.object({
    content: z.string().min(10).max(10000),
    platform: platformEnum,
});

export const fixSchema = z.object({
    content: z.string().min(10).max(10000),
    platform: platformEnum,
    suggestions: z.array(z.string()).default([]),
    penalties: z.array(z.string()).default([]),
});

export const riskSchema = z.object({
    content: z.string().min(5).max(10000),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

const contextTypeEnum = z.enum(['ORGANIZATION', 'PROGRAM', 'EVENT', 'PRODUCT', 'PERSON', 'POST_SAMPLE', 'OTHER']);

export const createContextSchema = z.object({
    name: z.string().min(2).max(100),
    type: contextTypeEnum.default('OTHER'),
    description: z.string().min(10).max(50000),
    keywords: z.array(z.string()).default([]),
});

export const updateContextSchema = createContextSchema.partial();

export type GenerateInput = z.infer<typeof generateSchema>;
export type AdaptInput = z.infer<typeof adaptSchema>;
export type AnalyseInput = z.infer<typeof analyseSchema>;
export type ScoreInput = z.infer<typeof scoreSchema>;
export type FixInput = z.infer<typeof fixSchema>;
export type RiskInput = z.infer<typeof riskSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateContextInput = z.infer<typeof createContextSchema>;
export type UpdateContextInput = z.infer<typeof updateContextSchema>;
