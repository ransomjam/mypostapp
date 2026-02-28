'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { PLATFORMS, Platform } from '@/lib/types';
import ScorePanel from './ScorePanel';
import RiskPanel from './RiskPanel';

export default function PostAnalyser() {
    const [content, setContent] = useState('');
    const [platform, setPlatform] = useState<Platform>('INSTAGRAM');
    const [isAnalysing, setIsAnalysing] = useState(false);
    const [analysis, setAnalysis] = useState<any>(null);
    const [score, setScore] = useState<any>(null);
    const [risk, setRisk] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [isFixing, setIsFixing] = useState(false);
    const [fixedPost, setFixedPost] = useState<string | null>(null);

    const handleAnalyse = async () => {
        if (!content.trim()) return;
        setIsAnalysing(true);
        setError(null);
        setFixedPost(null);
        try {
            const [aRes, sRes, rRes] = await Promise.all([
                api.analyse(content, platform),
                api.score(content, platform),
                api.risk(content),
            ]);
            if (aRes.success) setAnalysis(aRes.data);
            if (sRes.success) setScore(sRes.data);
            if (rRes.success) setRisk(rRes.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsAnalysing(false);
        }
    };

    const handleFix = async () => {
        if (!score) return;
        setIsFixing(true);
        setError(null);
        try {
            const res = await api.fixScore({
                content,
                platform,
                suggestions: score.suggestions,
                penalties: score.breakdown.penalties.reasons,
            });
            if (res.success) {
                setFixedPost(res.data);
            } else {
                setError(res.error || 'Failed to fix post');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsFixing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Analyse Post</h2>
                <p className="text-slate-400 mt-1">Deep analysis, engagement score, and risk detection</p>
            </div>
            <div className="space-y-5">
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your post content..." className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none" rows={6} />
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {PLATFORMS.map((p) => (
                        <button key={p.key} onClick={() => setPlatform(p.key)} className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl text-xs font-medium transition-all ${platform === p.key ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30' : 'bg-slate-800/40 text-slate-400 border border-slate-700/50 hover:border-slate-600'}`}>
                            <span className="text-xl">{p.icon}</span><span>{p.label}</span>
                        </button>
                    ))}
                </div>
                <button onClick={handleAnalyse} disabled={isAnalysing || !content.trim()} className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2">
                    {isAnalysing ? 'Analysing...' : '📊 Analyse Post'}
                </button>
                {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
            </div>

            {analysis && (
                <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Structural Breakdown</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[{ l: 'Words', v: analysis.wordCount }, { l: 'Chars', v: analysis.charCount }, { l: 'Sentences', v: analysis.sentenceCount }, { l: 'Hashtags', v: analysis.hashtagCount }, { l: 'Questions', v: analysis.questionCount }, { l: 'Emojis', v: analysis.emojiCount }, { l: 'Readability', v: analysis.readabilityLevel }, { l: 'Structure', v: analysis.structureQuality }].map((s) => (
                            <div key={s.l} className="bg-slate-800/50 rounded-lg p-3">
                                <p className="text-xs text-slate-400">{s.l}</p>
                                <p className="text-lg font-bold text-white capitalize">{s.v}</p>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-xs text-slate-400">🪝 Hook</p><p className="text-sm text-white mt-1">{analysis.hook || 'Not detected'}</p></div>
                        <div className="bg-slate-800/50 rounded-lg p-3"><p className="text-xs text-slate-400">📢 CTA</p><p className="text-sm text-white mt-1">{analysis.cta || 'No CTA'}</p></div>
                    </div>
                </div>
            )}

            {(score || risk) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {score && <ScorePanel score={score} onFix={handleFix} isFixing={isFixing} />}
                    {risk && <RiskPanel risk={risk} />}
                </div>
            )}

            {fixedPost && (
                <div className="bg-slate-800/30 border border-violet-500/30 rounded-2xl p-6 shadow-[0_0_15px_rgba(139,92,246,0.1)] mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">✨ AI Optimised Post</h3>
                        <button onClick={() => { navigator.clipboard.writeText(fixedPost); }} className="text-xs px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded-lg hover:bg-violet-500/30 transition-colors">Copy</button>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                        <p className="text-slate-300 whitespace-pre-wrap">{fixedPost}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
