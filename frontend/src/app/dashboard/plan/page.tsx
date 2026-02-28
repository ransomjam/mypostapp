'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function ContentPlan() {
    // Data states
    const [contexts, setContexts] = useState<any[]>([]);
    const [selectedContexts, setSelectedContexts] = useState<string[]>([]);

    // Core states
    const [topic, setTopic] = useState('');
    const [postCount, setPostCount] = useState(5);
    const [plan, setPlan] = useState<any | null>(null);
    const [viewMode, setViewMode] = useState<'CREATE' | 'SAVED'>('CREATE');
    const [savedPlans, setSavedPlans] = useState<any[]>([]);

    // Loading & UI states
    const [isLoadingContexts, setIsLoadingContexts] = useState(true);
    const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [inlinePosts, setInlinePosts] = useState<Record<string, { loading: boolean, content?: string }>>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchContexts();
        fetchSavedPlans();
    }, []);

    const fetchSavedPlans = async () => {
        try {
            const res = await api.getSavedPlans();
            if (res.success && res.data) {
                setSavedPlans(res.data);
            }
        } catch (err) {
            console.error('Failed to fetch saved plans:', err);
        }
    };

    const fetchContexts = async () => {
        setIsLoadingContexts(true);
        try {
            const res = await api.getContexts();
            if (res.success && res.data) {
                // Filter out style samples, we only want actual knowledge base profiles
                setContexts(res.data.filter((c: any) => c.type !== 'POST_SAMPLE'));
            }
        } catch (err) {
            console.error('Failed to fetch contexts', err);
        } finally {
            setIsLoadingContexts(false);
        }
    };

    const toggleContext = (id: string) => {
        setSelectedContexts(prev =>
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        );
    };

    const handleGeneratePlan = async () => {
        if (selectedContexts.length === 0) {
            setError('Please select at least one Knowledge Base profile first.');
            return;
        }

        setIsGeneratingPlan(true);
        setError(null);
        setPlan(null);
        setInlinePosts({});

        try {
            const res = await api.generateContentPlan(selectedContexts, postCount, topic);
            if (res.success && res.data) {
                setPlan(res.data);
                setViewMode('CREATE'); // Force scroll/view to output
            } else {
                setError(res.error || 'Failed to generate content plan.');
            }
        } catch (err: any) {
            setError(err.message || 'Error occurred generating the plan.');
        } finally {
            setIsGeneratingPlan(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan) return;
        setIsSaving(true);
        try {
            const res = await api.saveContentPlan(plan);
            if (res.success) {
                await fetchSavedPlans();
                setViewMode('SAVED');
                setPlan(null); // Optional: clear current
            } else {
                setError(res.error || 'Failed to save plan.');
            }
        } catch (err: any) {
            setError(err.message || 'Error occurred saving the plan.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleInlineGenerate = async (idx: number, post: any) => {
        const key = `inline_${idx}`;
        setInlinePosts(prev => ({ ...prev, [key]: { loading: true } }));
        try {
            const topicCombo = `${post.concept} - Hook: ${post.hookIdea} - CTA: ${post.callToAction}`;
            const res = await api.generate({
                topic: topicCombo,
                platform: 'LINKEDIN', // Platform expects uppercase ENUM from Prisma, assuming 'LINKEDIN' is correct, but let's leave it as is if it expects uppercase there. Actually, platform is uppercase.
                tone: 'professional',
                lengthPreference: 'medium',
                audience: 'general',
                contextIds: selectedContexts.length > 0 ? selectedContexts : undefined
            });
            if (res.success) {
                setInlinePosts(prev => ({ ...prev, [key]: { loading: false, content: res.data.content } }));
            } else {
                setInlinePosts(prev => ({ ...prev, [key]: { loading: false, content: 'Error: ' + res.error } }));
            }
        } catch (err: any) {
            setInlinePosts(prev => ({ ...prev, [key]: { loading: false, content: 'Generation failed.' } }));
        }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white">Content Plans</h2>
                    <p className="text-slate-400 mt-1">Generate multi-post strategies instantly and save them for later.</p>
                </div>
                <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 w-fit">
                    <button
                        onClick={() => setViewMode('CREATE')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'CREATE' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Create Builder
                    </button>
                    <button
                        onClick={() => setViewMode('SAVED')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'SAVED' ? 'bg-violet-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        Saved Plans {savedPlans.length > 0 && `(${savedPlans.length})`}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                </div>
            )}

            {/* CREATE MODE: Step 1 Base Inputs */}
            {viewMode === 'CREATE' && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-8 h-8 rounded-full bg-violet-500/20 text-violet-300 font-bold flex items-center justify-center">1</span>
                        <h3 className="text-xl font-semibold text-white">Select Base Knowledge</h3>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Select Profiles</label>
                            {isLoadingContexts ? (
                                <div className="text-slate-500 animate-pulse">Loading profiles...</div>
                            ) : contexts.length === 0 ? (
                                <div className="p-4 bg-slate-800/50 rounded-xl text-slate-400 text-sm border border-slate-700/50 border-dashed">
                                    No profiles found. Go to the Knowledge Base to add some first.
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {contexts.map((ctx) => (
                                        <button
                                            key={ctx.id}
                                            onClick={() => toggleContext(ctx.id)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${selectedContexts.includes(ctx.id)
                                                ? 'bg-violet-600/20 text-violet-300 border-violet-500/50 shadow-sm shadow-violet-500/10'
                                                : 'bg-slate-800/40 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                                                }`}
                                        >
                                            <span className="text-xs mr-2 opacity-50 uppercase tracking-widest">{ctx.type}</span>
                                            {ctx.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3">
                                <label className="block text-sm font-medium text-slate-300 mb-2">General Topic (Optional)</label>
                                <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="E.g. Upcoming June Tech Bootcamp"
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-sm font-medium text-slate-300 mb-2">Number of Posts</label>
                                <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={postCount}
                                    onChange={(e) => setPostCount(parseInt(e.target.value))}
                                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleGeneratePlan}
                            disabled={isGeneratingPlan || selectedContexts.length === 0}
                            className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 text-lg"
                        >
                            {isGeneratingPlan ? 'Generating Plan...' : 'Generate Content Plan ✨'}
                        </button>
                    </div>
                </div>
            )}

            {/* Resulting Plan / Selected Plan */}
            {plan && viewMode === 'CREATE' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 font-bold flex items-center justify-center">✓</span>
                            <h3 className="text-xl font-semibold text-white">Active Plan Output</h3>
                        </div>
                        {!plan.id && (
                            <button
                                onClick={handleSavePlan}
                                disabled={isSaving}
                                className="px-4 py-2 bg-slate-800 hover:bg-emerald-600/20 text-slate-200 hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 rounded-lg text-sm font-medium transition-all"
                            >
                                {isSaving ? 'Saving...' : 'Save this Plan 💾'}
                            </button>
                        )}
                    </div>

                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 overflow-hidden relative">
                        {/* Decorative background flare */}
                        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-emerald-500/5 blur-[100px] pointer-events-none"></div>

                        <div className="mb-8 border-b border-slate-800 pb-6 relative z-10">
                            <h4 className="text-3xl font-bold text-white mb-2">{plan.planTitle}</h4>
                            <p className="text-slate-400 text-lg leading-relaxed">{plan.strategySummary}</p>
                        </div>

                        <div className="space-y-6 relative z-10">
                            {plan.posts?.map((post: any, idx: number) => (
                                <div key={idx} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 font-semibold rounded-lg border border-emerald-500/20 text-sm">
                                                {post.day}
                                            </span>
                                            <span className="text-sm font-medium text-slate-300 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                                                {post.format}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Concept</p>
                                            <p className="text-slate-200 text-lg leading-snug">{post.concept}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Suggested Hook</p>
                                                <p className="text-slate-400 text-sm italic">"{post.hookIdea}"</p>
                                            </div>
                                            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                                                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Call to Action</p>
                                                <p className="text-teal-300/80 text-sm">{post.callToAction}</p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Why it Works</p>
                                            <p className="text-slate-400 text-sm">{post.whyItWorks}</p>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-slate-800/60 flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleInlineGenerate(idx, post)}
                                                disabled={inlinePosts[`inline_${idx}`]?.loading}
                                                className="flex-1 text-sm text-center py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors font-medium disabled:opacity-50"
                                            >
                                                {inlinePosts[`inline_${idx}`]?.loading ? '⚡ Generating...' : '⚡ Generate Post Instantly'}
                                            </button>
                                            <button
                                                onClick={() => window.open(`/dashboard?topic=${encodeURIComponent(post.concept + ' - Hook: ' + post.hookIdea + ' - CTA: ' + post.callToAction)}`, '_blank')}
                                                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors text-sm"
                                                title="Open in Creator"
                                            >
                                                ↗
                                            </button>
                                        </div>

                                        {/* Inline Rendering */}
                                        {inlinePosts[`inline_${idx}`]?.content && (
                                            <div className="mt-3 p-4 bg-slate-900/80 rounded-xl border border-violet-500/30">
                                                <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                                                    <span className="text-xs font-semibold text-violet-400 uppercase tracking-widest">Generated Draft</span>
                                                    <button
                                                        onClick={() => navigator.clipboard.writeText(inlinePosts[`inline_${idx}`].content!)}
                                                        className="text-xs text-slate-400 hover:text-white"
                                                    >
                                                        Copy 📋
                                                    </button>
                                                </div>
                                                <p className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                                                    {inlinePosts[`inline_${idx}`].content}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {!plan.id && (
                        <button
                            onClick={() => {
                                setPlan(null);
                                setInlinePosts({});
                            }}
                            className="w-full py-3 text-slate-400 hover:text-white transition-colors"
                        >
                            Discard active plan
                        </button>
                    )}
                </div>
            )}

            {/* SAVED PLANS LIST VIEW */}
            {viewMode === 'SAVED' && (
                <div className="space-y-4 animate-in fade-in duration-500">
                    {savedPlans.length === 0 ? (
                        <div className="text-center py-16 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed">
                            <span className="text-3xl mb-3 block">📭</span>
                            <p className="text-slate-400">You haven't saved any content plans yet.</p>
                            <button
                                onClick={() => setViewMode('CREATE')}
                                className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700"
                            >
                                Go back and create one
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {savedPlans.map(sp => (
                                <div key={sp.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-2">{sp.planTitle}</h4>
                                            <p className="text-slate-400 text-sm mb-4 line-clamp-2">{sp.strategySummary}</p>
                                            <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-400 rounded-md">
                                                {sp.posts?.length || 0} Posts included
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setPlan(sp);
                                                setViewMode('CREATE');
                                            }}
                                            className="px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-500 transition-colors shadow-lg shadow-violet-500/20"
                                        >
                                            Open Plan
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
