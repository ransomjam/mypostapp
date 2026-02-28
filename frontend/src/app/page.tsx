'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">P</div>
          <span className="text-xl font-bold text-white">my<span className="text-violet-400">postapp</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors">Sign in</Link>
          <Link href="/register" className="px-5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-500/10 border border-violet-500/20 rounded-full text-xs text-violet-300 mb-6">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          AI-Powered Social Media Intelligence
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6">
          Create smarter posts.<br />
          <span className="gradient-text">Score higher engagement.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          mypostapp generates, analyses, and optimises your social media content with AI.
          Get engagement scores, risk detection, platform adaptation, and image optimisation — all in one platform.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/register" className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-2xl hover:from-violet-500 hover:to-indigo-500 transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-lg">
            Start for Free →
          </Link>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
          {[
            { icon: '✍️', title: 'AI Post Generation', desc: 'Generate platform-optimised posts with hook-first strategy and smart CTAs' },
            { icon: '📊', title: 'Engagement Scoring', desc: 'Deterministic scoring across 7 dimensions with improvement suggestions' },
            { icon: '🔄', title: 'Platform Adaptation', desc: 'Transform one post into 5 platform-specific versions instantly' },
            { icon: '🛡️', title: 'Risk Detection', desc: 'Flag spam phrases, engagement bait, and sensitive content before posting' },
            { icon: '🖼️', title: 'Image Optimisation', desc: 'Resize and compress images for every platform ratio automatically' },
            { icon: '📐', title: 'Structural Analysis', desc: 'Extract hooks, CTAs, emotional triggers, and readability metrics' },
          ].map((f) => (
            <div key={f.title} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 hover:border-violet-500/30 transition-colors group">
              <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{f.icon}</span>
              <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <p>mypostapp is not affiliated with Instagram, LinkedIn, X, Facebook, or TikTok. All previews are generic simulations.</p>
        <p className="mt-1">© {new Date().getFullYear()} mypostapp. All rights reserved.</p>
      </footer>
    </div>
  );
}
