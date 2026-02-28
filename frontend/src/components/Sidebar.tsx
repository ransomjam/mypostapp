'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PencilIcon, PuzzlePieceIcon, CalendarIcon, SparklesIcon, ArrowPathIcon, ChartBarIcon, PhotoIcon, FolderIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    const navItems = [
        { href: '/dashboard', label: 'Create Post', icon: <PencilIcon className="w-5 h-5" /> },
        { href: '/dashboard/knowledge', label: 'Knowledge Base', icon: <PuzzlePieceIcon className="w-5 h-5" /> },
        { href: '/dashboard/plan', label: 'Content Plan', icon: <CalendarIcon className="w-5 h-5" /> },
        { href: '/dashboard/style', label: 'Style Samples', icon: <SparklesIcon className="w-5 h-5" /> },
        { href: '/dashboard/adapt', label: 'Adapt Post', icon: <ArrowPathIcon className="w-5 h-5" /> },
        { href: '/dashboard/analyse', label: 'Analyse', icon: <ChartBarIcon className="w-5 h-5" /> },
        { href: '/dashboard/images', label: 'Image Optimiser', icon: <PhotoIcon className="w-5 h-5" /> },
        { href: '/dashboard/history', label: 'History', icon: <FolderIcon className="w-5 h-5" /> },
    ];

    if (user?.role === 'ADMIN') {
        navItems.push({ href: '/admin/samples', label: 'Admin Pattern Scraping', icon: <ShieldCheckIcon className="w-5 h-5" /> });
    }


    return (
        <aside className="w-64 min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col">
            {/* Logo */}
            <div className="p-6 border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/25">
                        P
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">my<span className="text-violet-400">postapp</span></h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">Intelligence Platform</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                                ? 'bg-violet-500/15 text-violet-300 shadow-lg shadow-violet-500/5 border border-violet-500/20'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* User */}
            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-3 py-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{user?.email}</p>
                        <p className="text-[10px] text-slate-500 uppercase">{user?.planType} plan</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="mt-2 w-full px-4 py-2 text-xs text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}
