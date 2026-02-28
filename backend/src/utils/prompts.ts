export const PLATFORM_CONFIGS = {
    INSTAGRAM: {
        name: 'Instagram',
        maxLength: 2200,
        idealLength: { min: 100, max: 300 },
        hashtagRange: { min: 5, max: 15 },
        style: 'Visual storytelling, conversational, line breaks for readability, authentic',
        ctaStyle: 'Save this for later., Tell me your experience in the comments.',
    },
    LINKEDIN: {
        name: 'LinkedIn',
        maxLength: 3000,
        idealLength: { min: 150, max: 600 },
        hashtagRange: { min: 3, max: 5 },
        style: 'Professional but personal, storytelling with insights, short paragraphs, relatable',
        ctaStyle: 'Share your perspective below., Would love to hear your experiences with this.',
    },
    X: {
        name: 'X (Twitter)',
        maxLength: 280,
        idealLength: { min: 80, max: 280 },
        hashtagRange: { min: 1, max: 3 },
        style: 'Concise, punchy, conversational, specific',
        ctaStyle: 'Drop a reply if you agree., Bookmark this idea.',
    },
    FACEBOOK: {
        name: 'Facebook',
        maxLength: 63206,
        idealLength: { min: 80, max: 250 },
        hashtagRange: { min: 0, max: 3 },
        style: 'Conversational, community-focused, relatable personal updates',
        ctaStyle: 'Tag someone who needs to see this., Let me know your experience in the comments.',
    },
    TIKTOK: {
        name: 'TikTok',
        maxLength: 2200,
        idealLength: { min: 50, max: 150 },
        hashtagRange: { min: 3, max: 8 },
        style: 'Gen-Z friendly, trendy, highly casual, short sentences',
        ctaStyle: 'Save this video., Tell me your experience below.',
    },
} as const;

export type PlatformKey = keyof typeof PLATFORM_CONFIGS;

export function getGenerationPrompt(params: {
    topic: string;
    platform: PlatformKey;
    tone: string;
    lengthPreference: string;
    audience: string;
    samplePost?: string;
    contextData?: string;
    goal?: string;
}): string {
    const pConfig = PLATFORM_CONFIGS[params.platform];

    let prompt = `You are an expert social media content strategist. Generate a high-performing ${pConfig.name} post.

REQUIREMENTS:
- Topic: ${params.topic}
- Platform: ${pConfig.name}
- Tone: ${params.tone === 'auto' ? 'AUTO — Determine and apply the single most effective tone for this specific topic and platform from your expertise. Do NOT announce what you chose; simply write in it.' : params.tone}
- Length: ${params.lengthPreference === 'auto' ? `AUTO — Choose the most impactful length for this topic and platform. Do not pad or stretch. Ideal range reference: ${pConfig.idealLength.min}-${pConfig.idealLength.max} characters.` : `${params.lengthPreference} (ideal range: ${pConfig.idealLength.min}-${pConfig.idealLength.max} characters)`}
- Target Audience: ${params.audience === 'auto-detect based on topic and platform' ? 'AUTO — Infer the most relevant target audience from the topic and platform context. Write specifically for them.' : params.audience}
- Platform Style: ${pConfig.style}`;

    if (params.goal) {
        prompt += `\n- End Goal / Objective: ${params.goal}`;
    }

    if (params.samplePost) {
        prompt += `\n\n=== VERBAL IDENTITY & STYLE SAMPLES ===
The user has provided the following high-performing examples from their niche to establish their preferred formatting and voice:
"""
${params.samplePost}
"""
CRITICAL INSTRUCTION ON SAMPLES: Use these samples STRICTLY as your ultimate blueprint for tone, hook style, way of speaking, and vocabulary choices. Adapt the cadence, pacing, and personality of these samples precisely to the new Topic. DO NOT copy the specific subject matter or factual content of the samples, but DO mimic their structural DNA. If the samples do not use a CTA, then do NOT use a CTA. Match their exact stylistic vibe.`;
    }

    if (params.contextData) {
        prompt += `\n\n=== BACKGROUND KNOWLEDGE ===
(Facts and details provided by the user)
"""
${params.contextData}
"""
CRITICAL INSTRUCTION ON KNOWLEDGE: Use this data ONLY for factual grounding (e.g., to reference correct organization names, value props, or specific details if they naturally fit the Topic). Do NOT forcibly cram all this information into the post. Be creative and let the Topic drive the narrative organically.`;
    }

    prompt += `

CORE WRITING GUIDELINES — ANTI-GENERIC, HUMAN-FIRST:

1. ROLE: Write like a real human who was PHYSICALLY PRESENT at this event or situation. You are not a marketer. Not a motivational speaker. Not an AI. You are an observer describing what actually happened.

2. BE CONCRETE, NOT ABSTRACT:
   - Mention real actions: what people did, learned, built, or experienced.
   - GOOD: "Students practiced SQL queries and analysed real survey data."
   - BAD: "Students are transforming their future."

3. BANNED HYPE & CLICHÉS — DO NOT USE ANY OF THESE:
   "game-changer", "level up", "movement", "unlock your potential", "the future is here", "ignite transformation", "dive in", "unleash", "elevate", "robust", "revolutionary", "empowering the next generation", "no fluff", "landscape", "delve", "embark", "tapestry", "pivot"

4. BANNED OPENINGS: "Ever wonder...", "Struggling with...", "In today's fast-paced...", "Let's talk about...", "Here's a secret..."

5. BANNED CONTRAST PHRASES: "this is not just another", "it's more than just", "goes beyond", "more than ever"

6. LANGUAGE: Use natural, clear, direct sentences. No corporate speak. No motivational tone. Write like you'd describe it to a friend.

7. SHOW, DON'T EXAGGERATE: Let the activity itself demonstrate value. Do not over-dramatise. Specific details > grand claims.

8. BANNED FORMATTING: No bullet lists with bold emoji titles. No arbitrary line breaks after every sentence. No hashtags mid-text.

9. NO QUESTIONS IN HOOKS OR CTAS: Open with a grounded observation or fact — never a question. If you use a CTA, make it a practical command.

10. AFRICAN AUDIENCE LENS: Ground the post in real African contexts — campuses, local organisations, real names and places. Sound like someone who lives and works on the continent, not an outside observer.

POST STRUCTURE:
Line 1: Real observation or concrete fact (the hook)
Line 2–3: What people actually did — specific actions
Line 4: Why it matters in practical terms
Optional last line: Simple, direct CTA only if it makes sense

STRUCTURE EXAMPLE (DO NOT COPY, ONLY USE AS FORMAT REFERENCE):
"Students at UBa Tech Camp spent this morning learning how to clean and analyse data using Excel and SQL. Many of them had never worked with datasets before, but by the end of the session they were already creating summaries and charts from real survey data. These are practical skills they can use for research, internships, and freelance work."

RULES:
1. Maximum length: ${pConfig.maxLength} characters. Match ${pConfig.name}'s native style perfectly.
2. CALL TO ACTION: Only include if it makes obvious, practical sense (e.g. join, register, see photos). Avoid generic CTAs entirely.
3. Place ${pConfig.hashtagRange.min}-${pConfig.hashtagRange.max} relevant, non-spammy hashtags on a SEPARATE final line.

OUTPUT FORMAT:
Return ONLY the raw post content followed by hashtags on a new line. No explanations, no meta description.`;

    return prompt;
}

export function getAdaptationPrompt(params: {
    content: string;
    targetPlatform: PlatformKey;
}): string {
    const pConfig = PLATFORM_CONFIGS[params.targetPlatform];

    return `You are an expert social media content adapter. Transform the following post for ${pConfig.name}.

ORIGINAL POST:
${params.content}

TARGET PLATFORM: ${pConfig.name}
- Ideal length: ${pConfig.idealLength.min}-${pConfig.idealLength.max} characters
- Max length: ${pConfig.maxLength} characters
- Hashtag range: ${pConfig.hashtagRange.min}-${pConfig.hashtagRange.max}
- Style: ${pConfig.style}
- CTA suggestions: ${pConfig.ctaStyle}

CORE WRITING GUIDELINES (CRITICAL ANTI-AI DIRECTIVES):
1. Extreme Authenticity: Write EXACTLY like a real human expressing a genuine, unpolished thought. Forget standard marketing formulas. 
2. BANNED OPENINGS (DO NOT USE): "Ever wonder...", "Struggling with...", "Are you tired of...", "In today's fast-paced...", "Let's talk about...", "Here's a secret...". Simply start mid-thought or with a bold, unexpected statement.
3. BANNED CLICHES & BUZZWORDS: "Dive in", "Unlock", "Elevate", "Game-changer", "Crucial", "Unleash", "Landscape", "Robust", "Revolutionary", "Delve", "Embark", "Tapestry". Use zero jargon.
4. BANNED FORMATTING (DO NOT USE): Do NOT use predictable bulleted lists with bold titles and emojis (e.g. "✅ Step 1: **Title**"). Do NOT use bullet points at all unless implicitly requested. NO arbitrary line breaks after every single sentence. NO trailing hashtags inside sentences. 
5. Narrative Pacing: Write natively. Use varied sentence lengths. Occasional fragments for emphasis are great. 
6. Show, Don't Tell: Give hyper-specific, mundane real-world examples rather than high-level platitudes.
7. BANNED CONTRAST PHRASES (DO NOT USE): "this is not just another", "it's not all about", "it's more than just", "goes beyond", "more than ever". Stop using these forced, AI-sounding contrast/emphasis phrases.
8. AVOID TOOL FOCUS & TECHNICAL CLICHES: Do not build the narrative around learning "tools," technical details, or software. BANNED EXAMPLE (DO NOT WRITE LIKE THIS): "Sometimes the most rewarding work happens quietly, in a campus hall where the only sound is the clicking of keyboards... Often, it's the quiet confidence of knowing how to use the tools the world expects you to know." Focus on the human impact or insight instead.
9. EXACTLY ZERO QUESTIONS IN HOOKS AND CTAS: Do NOT use any questions for your hook (opening sentence) or your Call To Action (CTA). Your hook should be a bold statement or observation. Your CTA (if used) should be a definitive command or omitted entirely. Do not ask the audience a question.

ADAPTATION RULES:
1. Maintain the core message but completely rewrite it to naturally fit the target platform's nuances.
2. Apply the Core Writing Guidelines rigorously so the post does NOT sound AI-generated.
3. Conclude with a very casual, conversational question or sign-off. Use CTA style: ${pConfig.ctaStyle}
4. Add ${pConfig.hashtagRange.min}-${pConfig.hashtagRange.max} relevant, non-spammy hashtags at the very bottom.
5. Absolute refusal of cringe formatting: No messy emojis, bullet point abuse, or numbered list boilerplate.

OUTPUT FORMAT:
Return ONLY the raw adapted post content. No explanations.`;
}

export function getAnalysisPrompt(content: string): string {
    return `You are an expert social media content analyst. Analyze the following post and return a structured JSON analysis.

POST:
${content}

Analyze and return a JSON object with exactly these fields:
{
    "hook": "The identified hook/opening line",
    "body": "The main body content",
    "cta": "The call-to-action, or null if none",
    "emotionalTriggerWords": ["list", "of", "emotional", "words"],
    "questionCount": 0,
    "readabilityLevel": "easy|moderate|advanced",
    "sentenceCount": 0,
    "avgWordsPerSentence": 0,
    "toneDetected": "professional|casual|inspirational|educational|humorous",
    "structureQuality": "strong|moderate|weak"
}

Return ONLY valid JSON. No markdown, no explanations.`;
}

export function getFixPrompt(params: {
    content: string;
    platform: PlatformKey;
    suggestions: string[];
    penalties: string[];
}): string {
    const pConfig = PLATFORM_CONFIGS[params.platform];

    let prompt = `You are an expert social media content editor. Rewrite the following post to improve its engagement score by addressing its weak points.

ORIGINAL POST:
${params.content}

TARGET PLATFORM: ${pConfig.name}
- Ideal length: ${pConfig.idealLength.min}-${pConfig.idealLength.max} characters
- Style: ${pConfig.style}
- CTA suggestions: ${pConfig.ctaStyle}

IMPROVEMENT SUGGESTIONS (Address these):
${params.suggestions.map(s => `- ${s}`).join('\n')}

PENALTIES TO FIX (Avoid these):
${params.penalties.map(p => `- ${p}`).join('\n')}

CORE WRITING GUIDELINES (CRITICAL ANTI-AI DIRECTIVES):
1. Extreme Authenticity: Write EXACTLY like a real human expressing a genuine, unpolished thought. Forget standard marketing formulas. 
2. BANNED OPENINGS (DO NOT USE): "Ever wonder...", "Struggling with...", "Are you tired of...", "In today's fast-paced...", "Let's talk about...", "Here's a secret...". Simply start mid-thought or with a bold, unexpected statement.
3. BANNED CLICHES & BUZZWORDS: "Dive in", "Unlock", "Elevate", "Game-changer", "Crucial", "Unleash", "Landscape", "Robust", "Revolutionary", "Delve", "Embark", "Tapestry". Use zero jargon.
4. BANNED FORMATTING (DO NOT USE): Do NOT use predictable bulleted lists with bold titles and emojis (e.g. "✅ Step 1: **Title**"). Do NOT use bullet points at all unless implicitly requested. NO arbitrary line breaks after every single sentence. NO trailing hashtags inside sentences. 
5. Narrative Pacing: Write natively. Use varied sentence lengths. Occasional fragments for emphasis are great. 
6. Show, Don't Tell: Give hyper-specific, mundane real-world examples rather than high-level platitudes.
7. BANNED CONTRAST PHRASES (DO NOT USE): "this is not just another", "it's not all about", "it's more than just", "goes beyond", "more than ever". Stop using these forced, AI-sounding contrast/emphasis phrases.
8. AVOID TOOL FOCUS & TECHNICAL CLICHES: Do not build the narrative around learning "tools," technical details, or software. BANNED EXAMPLE (DO NOT WRITE LIKE THIS): "Sometimes the most rewarding work happens quietly, in a campus hall where the only sound is the clicking of keyboards... Often, it's the quiet confidence of knowing how to use the tools the world expects you to know." Focus on the human impact or insight instead.
9. EXACTLY ZERO QUESTIONS IN HOOKS AND CTAS: Do NOT use any questions for your hook (opening sentence) or your Call To Action (CTA). Your hook should be a bold statement or observation. Your CTA (if used) should be a definitive command or omitted entirely. Do not ask the audience a question.

RULES for rewriting:
1. Maintain the core message but naturally implement the suggestions to create a stronger, more engaging post.
2. Incorporate a stronger hook and better CTA if they were missing or weak.
3. Ensure it perfectly matches the ${pConfig.name} style.
4. Output ONLY the raw rewritten post content. No explanations.`;

    return prompt;
}

export function getHumanizePrompt(content: string): string {
    return `Context-Preserving Humanisation Prompt

ROLE:
You are an editor. Your job is to make the post sound natural and human while preserving the exact meaning, facts, and context.

PRIMARY RULE:
Do NOT change the event, activities, claims, or message. Only remove hype, clichés, and AI tone.

DO NOT:
- Add new details not mentioned
- Remove important context
- Change the activity described
- Replace specific facts with different ones
- Shorten into a dry report

DO:
- Keep the same activities and facts
- Remove hype phrases such as:
  “Stop scrolling”, “future of digital skills”, “transform their careers”, “energy is electric”, “level up”, “game-changer”, “unlock potential”
- Replace hype with neutral, natural wording
- Keep the original structure and intention
- Maintain similar length (±20%)
- Keep emojis only if appropriate
- Keep relevant hashtags

EDITING METHOD (MANDATORY):
Step 1: Remove hype words
Step 2: Simplify sentences
Step 3: Keep the same meaning
Step 4: Ensure it sounds like a real person wrote it

Do NOT rewrite from scratch. Edit only.

INPUT POST:
"""
${content}
"""

OUTPUT:
Return the edited post and hashtags only. No explanations.`;
}
