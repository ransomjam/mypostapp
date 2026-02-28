'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export default function StyleSamples() {
    const [contexts, setContexts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    const fetchContexts = async () => {
        setIsLoading(true);
        try {
            const res = await api.getContexts();
            if (res.success && res.data) {
                // Filter only POST_SAMPLE type
                setContexts(res.data.filter((c: any) => c.type === 'POST_SAMPLE'));
            }
        } catch (err: any) {
            console.error('Failed to fetch style samples');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchContexts();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !description) return;

        setIsCreating(true);
        setError(null);

        try {
            const payload = {
                name,
                type: 'POST_SAMPLE',
                description,
                keywords: [],
            };

            const res = editId
                ? await api.updateContext(editId, payload)
                : await api.createContext(payload);

            if (res.success) {
                setName('');
                setDescription('');
                setEditId(null);
                fetchContexts(); // Refresh list
            } else {
                setError(res.error || `Failed to ${editId ? 'update' : 'create'} style sample`);
            }
        } catch (err: any) {
            setError(err.message || `Error ${editId ? 'updating' : 'creating'} style sample`);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (ctx: any) => {
        setEditId(ctx.id);
        setName(ctx.name);
        setDescription(ctx.description);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setName('');
        setDescription('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sample?')) return;
        try {
            const res = await api.deleteContext(id);
            if (res.success) {
                fetchContexts();
            }
        } catch (err) {
            console.error('Failed to delete sample');
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Style Samples</h2>
                <p className="text-slate-400 mt-1">Manage external post styles and examples. The AI will refer to these globally when generating new posts.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Create Form */}
                <div className="lg:col-span-1 border border-slate-800 rounded-2xl p-6 bg-slate-900/50 h-fit">
                    <h3 className="text-lg font-semibold text-white mb-4">{editId ? 'Edit Sample' : 'Add New Sample'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sample Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Friendly LinkedIn Thread"
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">Sample Content</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Paste the post content, formatting, or style rules here..."
                                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 resize-none transition-all h-48"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-2">
                            <button
                                type="submit"
                                disabled={isCreating}
                                className="w-full py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                            >
                                {isCreating ? 'Saving...' : editId ? 'Update Sample' : 'Save Style Sample'}
                            </button>
                            {editId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="w-full py-2.5 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 transition-all"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-semibold text-white mb-4">Your Saved Samples</h3>
                    {isLoading ? (
                        <div className="text-center py-12 text-slate-500">Loading style samples...</div>
                    ) : contexts.length === 0 ? (
                        <div className="text-center py-12 bg-slate-800/20 border border-slate-700/30 rounded-2xl border-dashed">
                            <span className="text-4xl block mb-3">🎨</span>
                            <p className="text-slate-400">No style samples saved yet.</p>
                            <p className="text-sm text-slate-500 mt-1">Create one or save directly from your History.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {contexts.map((ctx) => (
                                <div key={ctx.id} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 hover:border-slate-600/50 transition-all relative group">
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                        <button
                                            onClick={() => handleEdit(ctx)}
                                            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
                                            title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ctx.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-400 bg-slate-800 rounded-lg border border-slate-700 hover:border-red-500/50 transition-colors"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-3 mb-3">
                                        <h4 className="text-lg font-semibold text-white">{ctx.name}</h4>
                                    </div>
                                    <p className="text-slate-400 text-sm whitespace-pre-wrap leading-relaxed line-clamp-4">
                                        {ctx.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
