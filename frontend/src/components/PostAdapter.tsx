'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { PLATFORMS, Platform, AdaptationResult } from '@/lib/types';
import PlatformPreview from './PlatformPreview';

export default function PostAdapter() {
    const [content, setContent] = useState('');
    const [targetPlatforms, setTargetPlatforms] = useState<Platform[]>([]);
    const [isAdapting, setIsAdapting] = useState(false);
    const [results, setResults] = useState<AdaptationResult[]>([]);
    const [error, setError] = useState<string | null>(null);

    const togglePlatform = (p: Platform) => {
        setTargetPlatforms((prev) =>
            prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
        );
    };

    const handleAdapt = async () => {
        if (!content.trim() || targetPlatforms.length === 0) return;
        setIsAdapting(true);
        setError(null);
        setResults([]);

        try {
            const res = await api.adapt(content, targetPlatforms);
            if (res.success && res.data) {
                setResults(res.data.adaptations);
            } else {
                setError(res.error || 'Adaptation failed');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAdapting(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Adapt Post</h2>
                <p className="text-slate-400 mt-1">Transform one post into platform-optimised versions</p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Original Post</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your original post content here..."
                        className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none transition-all"
                        rows={6}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Target Platforms</label>
                    <div className="flex flex-wrap gap-2">
                        {PLATFORMS.map((p) => (
                            <button
                                key={p.key}
                                onClick={() => togglePlatform(p.key)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${targetPlatforms.includes(p.key)
                                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                                        : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'
                                    }`}
                            >
                                <span>{p.icon}</span>
                                {p.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleAdapt}
                    disabled={isAdapting || !content.trim() || targetPlatforms.length === 0}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                >
                    {isAdapting ? (
                        <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Adapting...
                        </>
                    ) : (
                        <>🔄 Adapt to {targetPlatforms.length} Platform{targetPlatforms.length !== 1 ? 's' : ''}</>
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>
                )}
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {results.map((r, i) => (
                        <PlatformPreview
                            key={i}
                            content={r.content}
                            platform={r.platform}
                            metadata={{
                                wordCount: r.metadata.wordCount,
                                charCount: r.metadata.charCount,
                                hashtagCount: r.metadata.hashtagCount,
                                estimatedReadTime: `${Math.max(1, Math.ceil(r.metadata.wordCount / 200))} min`,
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
