'use client';

import { useState, useRef } from 'react';
import { api } from '@/lib/api';

export default function ImageOptimiser() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isOptimising, setIsOptimising] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) {
            setFile(f);
            setPreview(URL.createObjectURL(f));
            setResult(null);
        }
    };

    const handleOptimise = async () => {
        if (!file) return;
        setIsOptimising(true);
        setError(null);
        try {
            const res = await api.optimiseImage(file);
            if (res.success) setResult(res.data);
            else setError(res.error || 'Optimisation failed');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsOptimising(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-white">Image Optimiser</h2>
                <p className="text-slate-400 mt-1">Resize and compress images for every social media platform</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload */}
                <div className="space-y-4">
                    <div
                        onClick={() => inputRef.current?.click()}
                        className="border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-violet-500/50 transition-colors"
                    >
                        {preview ? (
                            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-xl" />
                        ) : (
                            <div className="text-slate-400">
                                <span className="text-5xl block mb-3">🖼️</span>
                                <p className="text-sm">Click to upload an image</p>
                                <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP, GIF — Max 10MB</p>
                            </div>
                        )}
                        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </div>

                    {file && (
                        <div className="bg-slate-800/40 rounded-xl p-3 text-sm text-slate-300">
                            <p>📁 {file.name}</p>
                            <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    )}

                    <button
                        onClick={handleOptimise}
                        disabled={isOptimising || !file}
                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-2"
                    >
                        {isOptimising ? 'Optimising...' : '🖼️ Optimise Image'}
                    </button>

                    {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
                </div>

                {/* Results */}
                <div>
                    {result ? (
                        <div className="space-y-4">
                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
                                <h3 className="text-sm font-semibold text-white mb-3">Original</h3>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-xs text-slate-400">Width</p><p className="text-sm font-bold text-white">{result.original.width}px</p></div>
                                    <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-xs text-slate-400">Height</p><p className="text-sm font-bold text-white">{result.original.height}px</p></div>
                                    <div className="bg-slate-800/50 rounded-lg p-2"><p className="text-xs text-slate-400">Ratio</p><p className="text-sm font-bold text-white">{result.original.ratio}</p></div>
                                </div>
                            </div>

                            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-4">
                                <h3 className="text-sm font-semibold text-white mb-3">Optimised Versions</h3>
                                <div className="space-y-2">
                                    {result.optimised.map((img: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between bg-slate-800/50 rounded-lg p-3">
                                            <div>
                                                <p className="text-sm font-medium text-white">{img.ratio}</p>
                                                <p className="text-xs text-slate-400">{img.width}×{img.height} · {img.sizeKB} KB</p>
                                            </div>
                                            <a href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${img.path}`} download className="px-3 py-1.5 bg-violet-500/20 text-violet-300 rounded-lg text-xs font-medium hover:bg-violet-500/30 transition-colors">
                                                ↓ Download
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[200px] sm:min-h-[300px] flex items-center justify-center bg-slate-800/20 border border-slate-700/30 rounded-2xl border-dashed">
                            <div className="text-center text-slate-500">
                                <span className="text-4xl block mb-3">📐</span>
                                <p className="text-sm">Optimised results appear here</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
