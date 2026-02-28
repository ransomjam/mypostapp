'use client';

import { useState, useEffect } from 'react';
import { api } from '../../../lib/api';
import { useRouter } from 'next/navigation';

export default function AdminSamplesPage() {
    const router = useRouter();
    const [samples, setSamples] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [scraping, setScraping] = useState(false);
    const [error, setError] = useState('');

    const [newSample, setNewSample] = useState({
        platform: 'LINKEDIN',
        url: '',
        content: '',
        engagementScore: 1000
    });

    useEffect(() => {
        fetchSamples();
    }, []);

    const fetchSamples = async () => {
        setLoading(true);
        const res = await api.getAdminSamples();
        if (res.success) {
            setSamples(res.data);
        } else {
            setError(res.error || 'Failed to fetch samples (Are you an admin?)');
            if (res.error === 'Unauthorized' || res.error?.includes('Forbidden')) {
                setTimeout(() => router.push('/dashboard'), 2000);
            }
        }
        setLoading(false);
    };

    const handleScrapeOrCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setScraping(true);
        setError('');

        const res = await api.createAdminSample(newSample);
        if (res.success) {
            setSamples([res.data, ...samples]);
            setNewSample({ ...newSample, url: '', content: '' }); // reset form
        } else {
            setError(res.error || 'Failed to create/scrape sample');
        }
        setScraping(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sample?')) return;
        const res = await api.deleteAdminSample(id);
        if (res.success) {
            setSamples(samples.filter(s => s.id !== id));
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Admin Dashboard...</div>;

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 mb-2">Admin Panel: Top Rated Scraped Examples</h1>
            <p className="text-gray-600 mb-8 max-w-2xl px-1">
                This system scraped top-rated posts from Facebook and LinkedIn. Active samples act as underlying blueprints so the AI agent smartly creates user posts based on these patterns, rather than generic AI templates.
            </p>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 shadow-sm border border-red-100">
                    ⚠️ {error}
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Add or Scrape New Post Pattern</h2>
                <form onSubmit={handleScrapeOrCreate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                            <select
                                value={newSample.platform}
                                onChange={e => setNewSample({ ...newSample, platform: e.target.value })}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            >
                                <option value="LINKEDIN">LinkedIn</option>
                                <option value="FACEBOOK">Facebook</option>
                                <option value="X">X (Twitter)</option>
                                <option value="INSTAGRAM">Instagram</option>
                                <option value="TIKTOK">TikTok</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Engagement Score (1-10k+)</label>
                            <input
                                type="number"
                                value={newSample.engagementScore}
                                onChange={e => setNewSample({ ...newSample, engagementScore: parseInt(e.target.value) || 0 })}
                                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Scrape via URL (Optional)</label>
                        <input
                            type="url"
                            placeholder="https://linkedin.com/posts/..."
                            value={newSample.url}
                            onChange={e => setNewSample({ ...newSample, url: e.target.value })}
                            className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div className="text-center font-medium text-gray-400">OR</div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Manual Content Pattern (Fallback if scraping fails)</label>
                        <textarea
                            rows={4}
                            placeholder="Paste the top-performing content directly here..."
                            value={newSample.content}
                            onChange={e => setNewSample({ ...newSample, content: e.target.value })}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={scraping}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-md transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {scraping ? 'Processing/Scraping...' : 'Add High-Performing AI Pattern'}
                    </button>
                </form>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Active System Samples ({samples.length})</h2>
                {samples.length === 0 ? (
                    <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500">No scraped patterns available yet. Add some to superpower AI generations.</div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {samples.map((s, idx) => (
                            <div key={idx} className="bg-white p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 relative group overflow-hidden">
                                <span className="absolute top-0 right-0 py-1 px-3 bg-blue-50 text-blue-600 font-semibold text-xs rounded-bl-xl border-b border-l border-blue-100">
                                    {s.platform}
                                </span>
                                {s.url && (
                                    <div className="text-xs text-blue-500 mb-2 truncate max-w-[80%] hover:underline cursor-pointer">
                                        🔗 {s.url}
                                    </div>
                                )}
                                <div className="text-sm font-medium text-gray-400 mb-2">
                                    Engagement Base: {s.engagementScore} | Status: {s.isActive ? '✅ Active Model' : '⏸ Inactive'}
                                </div>
                                <div className="text-gray-800 whitespace-pre-wrap font-serif text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 italic">
                                    "{s.content}"
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleDelete(s.id)}
                                        className="text-red-500 bg-red-50 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-red-100 transition-colors"
                                    >
                                        Delete Pattern
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
