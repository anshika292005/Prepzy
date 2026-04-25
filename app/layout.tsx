'use client';

import React, { useEffect, useState } from 'react';
import './globals.css';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Home', href: '/home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { name: 'Dashboard', href: '/dashboard', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { name: 'Practice', href: '/quiz', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { name: 'Exam Mode', href: '/exam-mode', icon: 'M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 8v4l3 3' },
    { name: 'History', href: '/history', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  ];

  const isPublicPage = pathname === '/' || pathname === '/login';

  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900">
        {isPublicPage ? (
          <main className="min-h-screen">
            {children}
          </main>
        ) : (
          <div className="flex h-screen overflow-hidden">
            
            {/* Dynamic Sidebar */}
            <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className="h-20 flex items-center px-6 border-b border-slate-100">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-100 shrink-0">E</div>
              <span className={`ml-4 font-black text-xl text-indigo-900 transition-opacity duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>
                ExamCopilot
              </span>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                      isActive 
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                      : 'text-slate-500 hover:bg-indigo-50 hover:text-indigo-600'
                    }`}
                  >
                    <svg className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                    <span className={`font-bold text-sm transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100">
              {user ? (
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className={`transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.email}</p>
                    <button 
                      onClick={() => auth.signOut()}
                      className="text-[10px] text-indigo-600 font-black uppercase hover:underline"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login" className="w-full py-3 flex items-center justify-center bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-black transition shadow-sm">
                  {isSidebarOpen ? 'Member Sign In' : 'ID'}
                </Link>
              )}
            </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 overflow-hidden relative">
            <header className="h-20 bg-white/50 backdrop-blur-md border-b border-white px-8 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-400">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 scroll-smooth">
               {children}
            </main>
          </div>
          </div>
        )}
      </body>
    </html>
  );
}
