'use client';

import { RiskResult } from '@/lib/types';
import { ShieldCheckIcon, LightBulbIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface RiskPanelProps {
    risk: RiskResult;
}

export default function RiskPanel({ risk }: RiskPanelProps) {
    const severityColor = {
        low: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        medium: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
        high: 'border-red-500/30 bg-red-500/10 text-red-300',
    };

    const riskLevelStyle = {
        low: 'text-emerald-400',
        medium: 'text-amber-400',
        high: 'text-red-400',
    };

    return (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white"><ShieldCheckIcon className="w-5 h-5 inline-block mr-1" /> Risk Detection</h3>
                <span className={`text-sm font-bold uppercase ${riskLevelStyle[risk.riskLevel]}`}>
                    {risk.riskLevel} risk
                </span>
            </div>

            {/* Risk Level Indicator */}
            <div className="mb-5">
                <div className="flex gap-1 h-2">
                    <div className={`flex-1 rounded-l-full ${risk.riskLevel === 'low' ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                    <div className={`flex-1 ${risk.riskLevel === 'medium' || risk.riskLevel === 'high' ? 'bg-amber-500' : 'bg-slate-700'}`} />
                    <div className={`flex-1 rounded-r-full ${risk.riskLevel === 'high' ? 'bg-red-500' : 'bg-slate-700'}`} />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                </div>
            </div>

            {/* Warnings */}
            {risk.warnings.length > 0 ? (
                <div className="space-y-2 mb-4">
                    <p className="text-xs text-slate-400 font-medium">Issues Found</p>
                    {risk.warnings.map((w, i) => (
                        <div key={i} className={`p-3 rounded-xl border ${severityColor[w.severity]}`}>
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-semibold">{w.type.replace(/_/g, ' ')}</span>
                                <span className="text-[10px] uppercase font-bold">{w.severity}</span>
                            </div>
                            <p className="text-xs opacity-80 mb-1">{w.message}</p>
                            <p className="text-xs opacity-60"><LightBulbIcon className="w-4 h-4 inline-block mr-1" /> {w.suggestion}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center mb-4">
                    <CheckCircleIcon className="w-6 h-6 text-emerald-400 mx-auto" />
                    <p className="text-sm text-emerald-400 mt-1 font-medium">No issues detected!</p>
                </div>
            )}

            {/* Passed Checks */}
            {risk.passedChecks.length > 0 && (
                <div>
                    <p className="text-xs text-slate-400 font-medium mb-2">Passed Checks</p>
                    <div className="space-y-1">
                        {risk.passedChecks.map((check, i) => (
                            <div key={i} className="flex items-center gap-2 text-xs text-emerald-400/80">
                                <span>✓</span>
                                <span>{check}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
