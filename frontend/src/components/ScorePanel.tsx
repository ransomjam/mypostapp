'use client';

import { ScoringResult } from '@/lib/types';
import { SparklesIcon, ChartBarIcon, HeartIcon, ArrowsRightLeftIcon, TagIcon, BookOpenIcon, QuestionMarkCircleIcon, ExclamationTriangleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

interface ScorePanelProps {
    score: ScoringResult;
    onFix?: () => void;
    isFixing?: boolean;
}

export default function ScorePanel({ score, onFix, isFixing }: ScorePanelProps) {
    const getGradeColor = (grade: string) => {
        if (grade.startsWith('A')) return 'text-emerald-400';
        if (grade === 'B') return 'text-green-400';
        if (grade === 'C') return 'text-amber-400';
        if (grade === 'D') return 'text-orange-400';
        return 'text-red-400';
    };

    const getScoreColor = (score: number, max: number) => {
        const pct = score / max;
        if (pct >= 0.8) return 'bg-emerald-500';
        if (pct >= 0.6) return 'bg-green-500';
        if (pct >= 0.4) return 'bg-amber-500';
        if (pct >= 0.2) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const breakdownItems = [
        { key: 'hookStrength', label: (<><SparklesIcon className="w-4 h-4 inline-block mr-1" /> Hook Strength</>), data: score.breakdown.hookStrength },
        { key: 'ctaPresence', label: (<><ChartBarIcon className="w-4 h-4 inline-block mr-1" /> CTA Presence</>), data: score.breakdown.ctaPresence },
        { key: 'emotionalIntensity', label: (<><HeartIcon className="w-4 h-4 inline-block mr-1" /> Emotional Intensity</>), data: score.breakdown.emotionalIntensity },
        { key: 'platformLengthCompliance', label: (<><ArrowsRightLeftIcon className="w-4 h-4 inline-block mr-1" /> Length Compliance</>), data: score.breakdown.platformLengthCompliance },
        { key: 'hashtagOptimisation', label: (<><TagIcon className="w-4 h-4 inline-block mr-1" /> Hashtag Optimisation</>), data: score.breakdown.hashtagOptimisation },
        { key: 'readabilityMatch', label: (<><BookOpenIcon className="w-4 h-4 inline-block mr-1" /> Readability</>), data: score.breakdown.readabilityMatch },
        { key: 'questionEngagement', label: (<><QuestionMarkCircleIcon className="w-4 h-4 inline-block mr-1" /> Question Engagement</>), data: score.breakdown.questionEngagement },
    ];

    // Score gauge SVG
    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (score.totalScore / 100) * circumference;

    return (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4"><ChartBarIcon className="w-5 h-5 inline-block mr-1" /> Engagement Score</h3>

            {/* Score Gauge */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mb-6">
                <div className="relative w-24 h-24 sm:w-32 sm:h-32 shrink-0">
                    <svg className="w-24 h-24 sm:w-32 sm:h-32 transform -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
                        <circle
                            cx="60"
                            cy="60"
                            r="54"
                            fill="none"
                            stroke={
                                score.totalScore >= 80 ? '#10b981' :
                                    score.totalScore >= 60 ? '#f59e0b' :
                                        score.totalScore >= 40 ? '#f97316' : '#ef4444'
                            }
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000 ease-out"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-white">{score.totalScore}</span>
                        <span className={`text-sm font-bold ${getGradeColor(score.grade)}`}>{score.grade}</span>
                    </div>
                </div>

                <div className="flex-1 space-y-1">
                    {breakdownItems.map(({ key, label, data }) => (
                        <div key={key} className="group">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">{label}</span>
                                <span className="text-white font-medium">{data.score}/{data.max}</span>
                            </div>
                            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-700 ${getScoreColor(data.score, data.max)}`}
                                    style={{ width: `${(data.score / data.max) * 100}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Penalties */}
            {score.breakdown.penalties.reasons.length > 0 && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-xs text-red-400 font-medium mb-1">
                        <ExclamationTriangleIcon className="w-4 h-4 inline-block mr-1" /> Penalties ({score.breakdown.penalties.score} pts)
                    </p>
                    {score.breakdown.penalties.reasons.map((r, i) => (
                        <p key={i} className="text-xs text-red-300/80">• {r}</p>
                    ))}
                </div>
            )}

            {/* Suggestions */}
            {score.suggestions.length > 0 && (
                <div>
                    <p className="text-sm font-medium text-white mb-2"><LightBulbIcon className="w-4 h-4 inline-block mr-1" /> Improvement Suggestions</p>
                    <div className="space-y-2">
                        {score.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-3 rounded-lg border border-slate-700/30">
                                <span className="text-amber-400 mt-0.5">→</span>
                                <span>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Fix Button */}
            {onFix && (
                <div className="mt-6 border-t border-slate-700/50 pt-4">
                    <button
                        onClick={onFix}
                        disabled={isFixing}
                        className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2"
                    >
                        {isFixing ? 'Fixing Post...' : (<><SparklesIcon className="w-5 h-5 inline-block mr-1" /> Fix Weak Points (AI)</>)}
                    </button>
                    <p className="text-xs text-center text-slate-400 mt-2">
                        Get a revised version addressing these suggestions
                    </p>
                </div>
            )}
        </div>
    );
}
