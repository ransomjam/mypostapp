'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Platform, Tone, LengthPreference, PLATFORMS, TONES, LENGTHS, GenerationResult, ScoringResult, RiskResult, AnalysisResult } from '@/lib/types';
import { PaperAirplaneIcon, UserIcon, SparklesIcon, PencilIcon, ChartBarIcon, QuestionMarkCircleIcon, TagIcon, ArrowsRightLeftIcon, HeartIcon, BookOpenIcon, LightBulbIcon, CheckCircleIcon, ExclamationTriangleIcon, ShieldCheckIcon, SparklesIcon as SparklesOutlineIcon, DocumentIcon, ChatBubbleLeftEllipsisIcon, FaceSmileIcon, Bars3Icon, PuzzlePieceIcon } from '@heroicons/react/24/outline';
import PlatformPreview from './PlatformPreview';
import ScorePanel from './ScorePanel';
import RiskPanel from './RiskPanel';

export default function PostCreator() {
    const [topic, setTopic] = useState('');
    const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
    const [tone, setTone] = useState<Tone>('auto');
    const [length, setLength] = useState<LengthPreference>('auto');
    const [goal, setGoal] = useState<string>('Regular Update / Brand Awareness');
    const [audience, setAudience] = useState('');
    const [autoAudience, setAutoAudience] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isHumanizing, setIsHumanizing] = useState(false);
    const [result, setResult] = useState<GenerationResult | null>(null);
    const [humanizedContent, setHumanizedContent] = useState<string | null>(null);
    const [score, setScore] = useState<ScoringResult | null>(null);
    const [risk, setRisk] = useState<RiskResult | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFixing, setIsFixing] = useState(false);

    const [availableContexts, setAvailableContexts] = useState<any[]>([]);
    const [selectedContextIds, setSelectedContextIds] = useState<string[]>([]);
    const [isLoadingContexts, setIsLoadingContexts] = useState(false);
    const [useSamples, setUseSamples] = useState(true);

    useEffect(() => {
        const fetchContexts = async () => {
            setIsLoadingContexts(true);
            try {
                const res = await api.getContexts();
                if (res.success && res.data) {
                    setAvailableContexts(res.data);
                }
            } catch (err) {
                console.error('Failed to load contexts');
            } finally {
                setIsLoadingContexts(false);
            }
        };
        fetchContexts();
    }, []);

    const bgContexts = availableContexts.filter(c => c.type !== 'POST_SAMPLE');
    const hasSampleContexts = availableContexts.some(c => c.type === 'POST_SAMPLE');

    const toggleContext = (id: string) => {
        setSelectedContextIds(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsGenerating(true);
        setError(null);
        setResult(null);
        setHumanizedContent(null);
        setScore(null);
        setRisk(null);
        setAnalysis(null);

        try {
            const genRes = await api.generate({
                topic,
                platform,
                tone,
                lengthPreference: length,
                goal: goal,
                audience: autoAudience ? 'auto-detect based on topic and platform' : (audience || 'general audience'),
                contextIds: selectedContextIds.length > 0 ? selectedContextIds : undefined,
                useSamples,
            });

            if (genRes.success && genRes.data) {
                setResult(genRes.data);

                // Run score, risk, and analysis in parallel
                const [scoreRes, riskRes, analysisRes] = await Promise.all([
                    api.score(genRes.data.content, platform, genRes.data.postId),
                    api.risk(genRes.data.content),
                    api.analyse(genRes.data.content, platform),
                ]);

                if (scoreRes.success) setScore(scoreRes.data);
                if (riskRes.success) setRisk(riskRes.data);
                if (analysisRes.success) setAnalysis(analysisRes.data);
            } else {
                setError(genRes.error || 'Generation failed');
            }
        } catch (err: any) {
            setError(err.message || 'Something went wrong');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFix = async () => {
        if (!result || !score) return;
        setIsFixing(true);
        setError(null);
        try {
            const fixRes = await api.fixScore({
                content: result.content,
                platform,
                suggestions: score.suggestions,
                penalties: score.breakdown.penalties.reasons,
            });
            if (fixRes.success) {
                const newContent = fixRes.data;
                const newWordCount = newContent.split(/\s+/).filter(Boolean).length;
                const newHashtagCount = (newContent.match(/#\w+/g) || []).length;
                const readTimeMinutes = Math.max(1, Math.ceil(newWordCount / 200));

                setResult({
                    ...result,
                    content: newContent,
                    metadata: {
                        wordCount: newWordCount,
                        charCount: newContent.length,
                        hashtagCount: newHashtagCount,
                        estimatedReadTime: `${readTimeMinutes} min read`,
                    }
                });

                if (result.postId) {
                    await api.updateHistory(result.postId, newContent);
                }

                const [scoreRes, riskRes, analysisRes] = await Promise.all([
                    api.score(newContent, platform, result.postId),
                    api.risk(newContent),
                    api.analyse(newContent, platform),
                ]);

                if (scoreRes.success) setScore(scoreRes.data);
                if (riskRes.success) setRisk(riskRes.data);
                if (analysisRes.success) setAnalysis(analysisRes.data);
            } else {
                setError(fixRes.error || 'Failed to fix post');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFixing(false);
        }
    };

    const handleHumanize = async () => {
        if (!result) return;
        setIsHumanizing(true);
        setError(null);
        try {
            const res = await api.humanize(result.content);
            if (res.success && res.data) {
                setHumanizedContent(res.data);
            } else {
                setError(res.error || 'Humanization failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsHumanizing(false);
        }
    };

    const handleUseHumanized = async () => {
        if (!result || !humanizedContent) return;
        const newContent = humanizedContent;
        const newWordCount = newContent.split(/\s+/).filter(Boolean).length;
        const newHashtagCount = (newContent.match(/#\w+/g) || []).length;
        const readTimeMinutes = Math.max(1, Math.ceil(newWordCount / 200));

        setResult({
            ...result,
            content: newContent,
            metadata: {
                wordCount: newWordCount,
                charCount: newContent.length,
                hashtagCount: newHashtagCount,
                estimatedReadTime: `${readTimeMinutes} min read`,
            }
        });
        setHumanizedContent(null);

        if (result.postId) {
            await api.updateHistory(result.postId, newContent);
        }

        const [scoreRes, riskRes, analysisRes] = await Promise.all([
            api.score(newContent, platform, result.postId),
            api.risk(newContent),
            api.analyse(newContent, platform),
        ]);

        if (scoreRes.success) setScore(scoreRes.data);
        if (riskRes.success) setRisk(riskRes.data);
        if (analysisRes.success) setAnalysis(analysisRes.data);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-white">Create New Post</h2>
                <p className="text-slate-400 mt-1">Generate AI-powered social media content optimised for your platform</p>
            </div>

            {/* Input Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-5">
                    {/* Topic */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Topic / Idea</label>
                        <textarea
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g. 5 productivity hacks for remote workers..."
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none transition-all"
                            rows={3}
                        />
                    </div>

                    {/* Context Profiles */}
                    {bgContexts.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2"><PuzzlePieceIcon className="w-5 h-5 inline-block mr-1" /> Include Background Context</label>
                            <p className="text-xs text-slate-400 mb-2">Attach knowledge items so AI can use correct facts, branding, or specific details.</p>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {bgContexts.map(ctx => (
                                    <label key={ctx.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedContextIds.includes(ctx.id)
                                        ? 'bg-violet-500/20 border-violet-500/50 text-white'
                                        : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                                        }`}>
                                        <div className="flex h-5 items-center">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500/20 bg-slate-800"
                                                checked={selectedContextIds.includes(ctx.id)}
                                                onChange={() => toggleContext(ctx.id)}
                                            />
                                        </div>
                                        <div className="flex flex-col flex-1 min-w-0">
                                            <span className="text-sm font-medium">{ctx.name} <span className="text-[10px] uppercase font-bold text-violet-400 ml-1">({ctx.type})</span></span>
                                            <span className="text-xs opacity-70 truncate block">{ctx.description}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Style Samples Toggle */}
                    {hasSampleContexts && (
                        <div>
                            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${useSamples
                                ? 'bg-violet-500/20 border-violet-500/50 text-white'
                                : 'bg-slate-800/40 border-slate-700/50 text-slate-300 hover:border-slate-600'
                                }`}>
                                <div className="flex h-5 items-center">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-600 text-violet-500 focus:ring-violet-500/20 bg-slate-800"
                                        checked={useSamples}
                                        onChange={(e) => setUseSamples(e.target.checked)}
                                    />
                                </div>
                                <div className="flex flex-col flex-1 min-w-0">
                                    <SparklesOutlineIcon className="w-5 h-5 inline-block mr-1" /> <span className="text-sm font-medium">Use My Style Samples</span>
                                    <span className="text-xs opacity-70 block mt-0.5">Include your saved style samples to match your unique brand voice.</span>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Platform Selector */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
                        <div className="grid grid-cols-5 gap-2">
                            {PLATFORMS.map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setPlatform(p.key)}
                                    className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-xs font-medium transition-all duration-200 ${platform === p.key
                                        ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 border shadow-lg shadow-violet-500/10'
                                        : 'bg-slate-800/40 border border-slate-700/50 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                                        }`}
                                >
                                    <span className="text-xl">{p.icon}</span>
                                    <span>{p.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tone */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                        <div className="grid grid-cols-5 gap-2">
                            {TONES.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => setTone(t.key)}
                                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${t.key === 'auto'
                                        ? tone === 'auto'
                                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                                            : 'bg-slate-800/40 text-emerald-400/70 border border-emerald-700/40 hover:border-emerald-600'
                                        : tone === t.key
                                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                            : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                                        }`}
                                >

                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Length */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Length</label>
                        <div className="grid grid-cols-4 gap-2">
                            {LENGTHS.map((l) => (
                                <button
                                    key={l.key}
                                    onClick={() => setLength(l.key)}
                                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${l.key === 'auto'
                                        ? length === 'auto'
                                            ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-500/10'
                                            : 'bg-slate-800/40 text-emerald-400/70 border border-emerald-700/40 hover:border-emerald-600'
                                        : length === l.key
                                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                            : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                                        }`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Goal */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Primary Goal</label>
                        <select
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all appearance-none"
                        >
                            <option value="Regular Update / Brand Awareness">Keep Brand Top of Mind & Regular Update</option>
                            <option value="Lead Generation & Client Acquisition">Get More Clients / Lead Generation</option>
                            <option value="Educate and Inform Audience">Inform & Educate People</option>
                            <option value="Share a Milestone or Achievement">Share an Achievement / Milestone</option>
                            <option value="Showcase Work / Build Portfolio">Showcase Work & Build Portfolio</option>
                        </select>
                    </div>

                    {/* Audience */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-slate-300">Target Audience</label>
                            <button
                                onClick={() => setAutoAudience(!autoAudience)}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border ${autoAudience
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-slate-800/40 text-slate-400 border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <SparklesOutlineIcon className="w-4 h-4 inline-block mr-1" /> Auto-detect
                            </button>
                        </div>
                        {!autoAudience && (
                            <input
                                type="text"
                                value={audience}
                                onChange={(e) => setAudience(e.target.value)}
                                placeholder="e.g. startup founders, tech professionals..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                            />
                        )}
                        {autoAudience && (
                            <p className="text-xs text-emerald-400/80 px-1">AI will detect the ideal audience based on your topic and platform.</p>
                        )}
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !topic.trim()}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Generating...
                            </>
                        ) : (
                            <>
                                <PaperAirplaneIcon className="w-5 h-5 inline-block mr-1" /> Generate Post
                            </>
                        )}
                    </button>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Preview Panel */}
                <div>
                    {result ? (
                        <div className="space-y-3">
                            <PlatformPreview content={result.content} platform={platform} metadata={result.metadata} />
                            <button
                                onClick={handleHumanize}
                                disabled={isHumanizing}
                                className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-semibold rounded-xl hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-teal-500/20 hover:shadow-teal-500/35 flex items-center justify-center gap-2 text-sm"
                            >
                                {isHumanizing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                        Humanizing...
                                    </>
                                ) : (
                                    <>
                                        <UserIcon className="w-5 h-5 inline-block mr-1" /> Humanize Post
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center bg-slate-800/20 border border-slate-700/30 rounded-2xl border-dashed">
                            <div className="text-center text-slate-500">
                                <SparklesIcon className="w-6 h-6 text-violet-400" />
                                <p className="text-sm">Your post preview will appear here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Humanized Comparison Panel */}
            {humanizedContent && result && (
                <div className="rounded-2xl border border-teal-500/30 bg-teal-950/20 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-teal-500/20 bg-teal-900/10">
                        <div className="flex items-center gap-3">
                            <UserIcon className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300" />
                            <div>
                                <h3 className="text-sm font-semibold text-teal-300">Humanized Version</h3>
                                <p className="text-xs text-teal-400/60">AI language stripped — reads like a real person wrote it</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setHumanizedContent(null)}
                                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-lg transition-all"
                            >
                                Dismiss
                            </button>
                            <button
                                onClick={handleUseHumanized}
                                className="px-4 py-1.5 text-xs font-medium text-teal-900 bg-teal-400 hover:bg-teal-300 rounded-lg transition-all shadow-sm"
                            >
                                ✓ Use This Version
                            </button>
                        </div>
                    </div>

                    {/* Side-by-side content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-teal-500/20">
                        {/* Original */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                                <span className="text-xs font-semibold text-violet-300 uppercase tracking-wide">Original (AI Generated)</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{result.content}</p>
                        </div>

                        {/* Humanized */}
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                                <span className="text-xs font-semibold text-teal-300 uppercase tracking-wide">Humanized</span>
                            </div>
                            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{humanizedContent}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Results Panels */}
            {(score || risk) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {score && <ScorePanel score={score} onFix={handleFix} isFixing={isFixing} />}
                    {risk && <RiskPanel risk={risk} />}
                </div>
            )}

            {/* Analysis Details */}
            {analysis && (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4"><ChartBarIcon className="w-5 h-5 inline-block mr-1" /> Structural Analysis</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Words', value: analysis.wordCount, icon: <PencilIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Characters', value: analysis.charCount, icon: <DocumentIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Sentences', value: analysis.sentenceCount, icon: <ChatBubbleLeftEllipsisIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Hashtags', value: analysis.hashtagCount, icon: <TagIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Questions', value: analysis.questionCount, icon: <QuestionMarkCircleIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Emojis', value: analysis.emojiCount, icon: <FaceSmileIcon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Lines', value: analysis.lineCount, icon: <Bars3Icon className="w-5 h-5 inline-block mr-1" /> },
                            { label: 'Avg words/sent', value: analysis.avgWordsPerSentence, icon: <ChartBarIcon className="w-5 h-5 inline-block mr-1" /> },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm">{stat.icon}</span>
                                    <span className="text-xs text-slate-400">{stat.label}</span>
                                </div>
                                <p className="text-2xl font-bold text-white">{stat.value}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <span className="text-xs text-slate-400">Readability</span>
                            <p className="text-lg font-semibold text-white capitalize mt-1">{analysis.readabilityLevel}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <span className="text-xs text-slate-400">Tone Detected</span>
                            <p className="text-lg font-semibold text-white capitalize mt-1">{analysis.toneDetected}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <span className="text-xs text-slate-400">Structure Quality</span>
                            <p className={`text-lg font-semibold capitalize mt-1 ${analysis.structureQuality === 'strong' ? 'text-emerald-400' :
                                analysis.structureQuality === 'moderate' ? 'text-amber-400' : 'text-red-400'
                                }`}>{analysis.structureQuality}</p>
                        </div>
                    </div>

                    {analysis.emotionalTriggerWords.length > 0 && (
                        <div className="mt-4">
                            <span className="text-xs text-slate-400">Emotional Trigger Words</span>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {analysis.emotionalTriggerWords.map((word, i) => (
                                    <span key={i} className="px-3 py-1 bg-violet-500/15 text-violet-300 rounded-full text-xs border border-violet-500/20">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Hook / CTA display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <span className="text-xs text-slate-400"><SparklesIcon className="w-5 h-5 inline-block mr-1" /> Hook</span>
                            <p className="text-sm text-white mt-2 leading-relaxed">{analysis.hook || 'Not detected'}</p>
                        </div>
                        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                            <span className="text-xs text-slate-400"><ChatBubbleLeftEllipsisIcon className="w-5 h-5 inline-block mr-1" /> CTA</span>
                            <p className="text-sm text-white mt-2 leading-relaxed">{analysis.cta || 'No CTA detected'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
