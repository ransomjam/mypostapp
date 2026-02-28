'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { PLATFORMS } from '@/lib/types';

export default function PostHistory() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Editing State
    const [editingPostId, setEditingPostId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    // Knowledge Base Save State
    const [contexts, setContexts] = useState<any[]>([]);
    const [isKbModalOpen, setIsKbModalOpen] = useState(false);
    const [selectedPostContent, setSelectedPostContent] = useState('');
    const [kbAction, setKbAction] = useState<'append' | 'new_kb' | 'new_sample'>('append');
    const [selectedContextId, setSelectedContextId] = useState('');
    const [newKbName, setNewKbName] = useState('');
    const [isSavingKb, setIsSavingKb] = useState(false);

    useEffect(() => {
        loadPosts();
    }, [page]);

    const loadPosts = async () => {
        setIsLoading(true);
        const [res, ctxRes] = await Promise.all([
            api.getHistory(page, 10),
            api.getContexts()
        ]);
        if (res.success && res.data) {
            setPosts(res.data.posts);
            setTotalPages(res.data.pagination.totalPages);
        }
        if (ctxRes.success && ctxRes.data) {
            setContexts(ctxRes.data);
            if (ctxRes.data.length > 0) {
                setSelectedContextId(ctxRes.data[0].id);
            } else {
                setKbAction('new_kb');
            }
        }
        setIsLoading(false);
    };

    const handleSaveEdit = async (id: string) => {
        if (!editContent.trim()) return;
        setIsSavingEdit(true);
        const res = await api.updateHistory(id, editContent);
        if (res.success) {
            setPosts(posts.map(p => p.id === id ? { ...p, generatedContent: editContent } : p));
            setEditingPostId(null);
        }
        setIsSavingEdit(false);
    };

    const openKbModal = (content: string) => {
        setSelectedPostContent(content);
        setIsKbModalOpen(true);
    };

    const handleSaveToKb = async () => {
        if (!selectedPostContent) return;
        setIsSavingKb(true);

        try {
            if (kbAction === 'append' && selectedContextId) {
                const targetCtx = contexts.find(c => c.id === selectedContextId);
                if (targetCtx) {
                    const newDesc = `${targetCtx.description}\n\nAdded from Post History:\n${selectedPostContent}`;
                    await api.updateContext(selectedContextId, { description: newDesc });
                }
            } else if (kbAction === 'new_kb' && newKbName) {
                await api.createContext({
                    name: newKbName,
                    type: 'OTHER',
                    description: selectedPostContent,
                    keywords: [],
                });
            } else if (kbAction === 'new_sample' && newKbName) {
                await api.createContext({
                    name: newKbName,
                    type: 'POST_SAMPLE',
                    description: selectedPostContent,
                    keywords: [],
                });
            }
        } catch (error) {
            console.error('Failed to save to KB');
        } finally {
            setIsSavingKb(false);
            setIsKbModalOpen(false);
            setNewKbName('');
        }
    };

    const getPlatformInfo = (key: string) => PLATFORMS.find((p) => p.key === key);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Post History</h2>
                <p className="text-slate-400 mt-1">View your previously generated posts</p>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <svg className="animate-spin h-8 w-8 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
            ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                    <span className="text-5xl mb-3">📝</span>
                    <p>No posts generated yet</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => {
                        const platformInfo = getPlatformInfo(post.platform);
                        const scoreData = post.analysisResults?.[0];
                        return (
                            <div key={post.id} className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-5 hover:border-slate-600/50 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{platformInfo?.icon}</span>
                                        <span className="text-sm font-medium text-white">{platformInfo?.label}</span>
                                        {post.tone && <span className="text-xs px-2 py-0.5 bg-slate-800 rounded-full text-slate-400">{post.tone}</span>}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {scoreData && (
                                            <span className={`text-sm font-bold ${scoreData.engagementScore >= 70 ? 'text-emerald-400' : scoreData.engagementScore >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                                                {Math.round(scoreData.engagementScore)}/100
                                            </span>
                                        )}
                                        <span className="text-xs text-slate-500">{new Date(post.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500 mb-2">Topic: {post.originalPrompt}</p>

                                {editingPostId === post.id ? (
                                    <div className="mt-3">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y min-h-[150px]"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleSaveEdit(post.id)}
                                                disabled={isSavingEdit}
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isSavingEdit ? 'Saving...' : 'Save Changes'}
                                            </button>
                                            <button
                                                onClick={() => setEditingPostId(null)}
                                                className="px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold rounded-lg transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-300 line-clamp-4 whitespace-pre-line">{post.generatedContent}</p>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-700/50">
                                            <button
                                                onClick={() => {
                                                    setEditingPostId(post.id);
                                                    setEditContent(post.generatedContent);
                                                }}
                                                className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                                </svg>
                                                Edit Post
                                            </button>
                                            <button
                                                onClick={() => openKbModal(post.generatedContent)}
                                                className="px-3 py-1.5 bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 rounded-lg text-xs font-medium border border-violet-500/30 transition-colors flex items-center gap-1.5"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                </svg>
                                                Save Post Content
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm disabled:opacity-50">← Prev</button>
                            <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
                            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-sm disabled:opacity-50">Next →</button>
                        </div>
                    )}

                    {/* Knowledge Base Modal */}
                    {isKbModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                                <h3 className="text-xl font-bold text-white mb-4">Save Post Content</h3>

                                <div className="space-y-4">
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kbAction"
                                                value="append"
                                                checked={kbAction === 'append'}
                                                onChange={() => setKbAction('append')}
                                                disabled={contexts.length === 0}
                                                className="text-violet-500 focus:ring-violet-500 bg-slate-800"
                                            />
                                            <span className={`text-sm ${contexts.length === 0 ? 'opacity-50' : ''}`}>Append to Existing</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kbAction"
                                                value="new_kb"
                                                checked={kbAction === 'new_kb'}
                                                onChange={() => setKbAction('new_kb')}
                                                className="text-violet-500 focus:ring-violet-500 bg-slate-800"
                                            />
                                            <span className="text-sm">New KB Profile</span>
                                        </label>
                                        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="kbAction"
                                                value="new_sample"
                                                checked={kbAction === 'new_sample'}
                                                onChange={() => setKbAction('new_sample')}
                                                className="text-violet-500 focus:ring-violet-500 bg-slate-800"
                                            />
                                            <span className="text-sm">New Style Sample</span>
                                        </label>
                                    </div>

                                    {kbAction === 'append' ? (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">Select Profile</label>
                                            <select
                                                value={selectedContextId}
                                                onChange={(e) => setSelectedContextId(e.target.value)}
                                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                                            >
                                                {contexts.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-xs font-medium text-slate-400 mb-1">
                                                {kbAction === 'new_sample' ? 'New Style Sample Name' : 'New Profile Name'}
                                            </label>
                                            <input
                                                type="text"
                                                value={newKbName}
                                                onChange={(e) => setNewKbName(e.target.value)}
                                                placeholder={kbAction === 'new_sample' ? "e.g. Trendy X Thread" : "e.g. Acme Corp Boilerplate"}
                                                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500"
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3 justify-end mt-6">
                                        <button
                                            onClick={() => setIsKbModalOpen(false)}
                                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveToKb}
                                            disabled={isSavingKb || (kbAction !== 'append' && !newKbName)}
                                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                        >
                                            {isSavingKb ? 'Saving...' : 'Save Context'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
