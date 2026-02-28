'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PencilIcon, PuzzlePieceIcon, CalendarIcon, SparklesIcon, ArrowPathIcon, ChartBarIcon, PhotoIcon, FolderIcon, ShieldCheckIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Sidebar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    // Close sidebar on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, []);

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

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
        <>
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-slate-900/95 backdrop-blur-lg border-b border-slate-800">
                <Link href="/dashboard" className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-500/25">
                        P
                    </div>
                    <span className="text-lg font-bold text-white tracking-tight">my<span className="text-violet-400">postapp</span></span>
                </Link>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <XMarkIcon className="w-5 h-5" /> : <Bars3Icon className="w-5 h-5" />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-40 h-screen
                w-72 lg:w-64 min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 flex flex-col
                transform transition-transform duration-300 ease-in-out
                ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
            `}>
                {/* Logo - hidden on mobile (shown in mobile header instead) */}
                <div className="p-6 border-b border-slate-800 hidden lg:block">
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

                {/* Spacer for mobile header */}
                <div className="h-14 lg:hidden" />

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
        </>
    );
}
