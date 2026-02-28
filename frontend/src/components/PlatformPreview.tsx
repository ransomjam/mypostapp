'use client';

import { Platform, PLATFORMS } from '@/lib/types';

interface PlatformPreviewProps {
    content: string;
    platform: Platform;
    metadata?: {
        wordCount: number;
        charCount: number;
        hashtagCount: number;
        estimatedReadTime: string;
    };
}

export default function PlatformPreview({ content, platform, metadata }: PlatformPreviewProps) {
    const platformInfo = PLATFORMS.find((p) => p.key === platform)!;

    return (
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl overflow-hidden">
            {/* Platform Header */}
            <div className="px-5 py-3 border-b border-slate-700/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">{platformInfo.icon}</span>
                    <span className="text-sm font-medium text-white">{platformInfo.label} Preview</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/20">
                    Simulated
                </span>
            </div>

            {/* Simulated Feed Card */}
            <div className="p-5">
                <div className={`rounded-xl border overflow-hidden ${platform === 'X' ? 'bg-black border-slate-700' :
                        platform === 'LINKEDIN' ? 'bg-white border-slate-200' :
                            platform === 'FACEBOOK' ? 'bg-white border-slate-200' :
                                'bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700'
                    }`}>
                    {/* User Header */}
                    <div className={`flex items-center gap-3 p-4 ${platform === 'LINKEDIN' || platform === 'FACEBOOK' ? 'text-gray-900' : 'text-white'
                        }`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                            U
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Your Brand</p>
                            <p className={`text-xs ${platform === 'LINKEDIN' || platform === 'FACEBOOK' ? 'text-gray-500' : 'text-slate-400'
                                }`}>
                                {platform === 'LINKEDIN' ? 'Thought Leader • 1st' :
                                    platform === 'X' ? '@yourbrand · just now' :
                                        platform === 'FACEBOOK' ? 'Just now · 🌐' :
                                            platform === 'TIKTOK' ? '@yourbrand' :
                                                'yourbrand'}
                            </p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`px-4 pb-4 ${platform === 'LINKEDIN' || platform === 'FACEBOOK' ? 'text-gray-800' : 'text-white'
                        }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-line">{content}</p>
                    </div>

                    {/* Platform-specific interactions */}
                    <div className={`px-4 py-3 border-t flex items-center gap-6 text-xs ${platform === 'LINKEDIN' || platform === 'FACEBOOK'
                            ? 'border-slate-200 text-gray-500'
                            : 'border-slate-700 text-slate-400'
                        }`}>
                        {platform === 'INSTAGRAM' && (
                            <>
                                <span>♡ Like</span>
                                <span>💬 Comment</span>
                                <span>↗ Share</span>
                                <span className="ml-auto">⊡ Save</span>
                            </>
                        )}
                        {platform === 'LINKEDIN' && (
                            <>
                                <span>👍 Like</span>
                                <span>💬 Comment</span>
                                <span>↗ Repost</span>
                                <span>↗ Send</span>
                            </>
                        )}
                        {platform === 'X' && (
                            <>
                                <span>💬 Reply</span>
                                <span>🔁 Repost</span>
                                <span>♡ Like</span>
                                <span>📊 Views</span>
                            </>
                        )}
                        {platform === 'FACEBOOK' && (
                            <>
                                <span>👍 Like</span>
                                <span>💬 Comment</span>
                                <span>↗ Share</span>
                            </>
                        )}
                        {platform === 'TIKTOK' && (
                            <>
                                <span>♡ Like</span>
                                <span>💬 Comment</span>
                                <span>↗ Share</span>
                                <span>⊡ Save</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Metadata */}
            {metadata && (
                <div className="px-5 pb-4 grid grid-cols-4 gap-2">
                    {[
                        { label: 'Words', value: metadata.wordCount },
                        { label: 'Chars', value: metadata.charCount },
                        { label: 'Hashtags', value: metadata.hashtagCount },
                        { label: 'Read time', value: metadata.estimatedReadTime },
                    ].map((m) => (
                        <div key={m.label} className="bg-slate-800/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-slate-400">{m.label}</p>
                            <p className="text-sm font-semibold text-white">{m.value}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
