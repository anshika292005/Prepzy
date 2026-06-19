'use client';

import React, { useEffect, useState } from 'react';
import './globals.css';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Script from 'next/script';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
   const pathname = usePathname();
  const router = useRouter();
  
  const handleSignOut = async () => {
    await auth.signOut();
    router.push('/');
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const navItems = [
    { name: 'Home', href: '/home', icon: 'M3 9.5L12 4l9 5.5V19a1 1 0 01-1 1h-5v-4a2 2 0 00-2-2h-2a2 2 0 00-2 2v4H4a1 1 0 01-1-1V9.5z' },
    { name: 'Dashboard', href: '/dashboard', icon: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z' },
    { name: 'Practice', href: '/quiz', icon: 'M12 3L2 8l10 5 10-5-10-5z M2 12l10 5 10-5 M2 16l10 5 10-5' },
    { name: 'Answer Grader', href: '/answer-grader', icon: 'M9 11l2 2 4-4m5-2.5V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h7m4-1l4-4-4-4v3h-3v2h3v3z' },
    { name: 'Exam Mode', href: '/exam-mode', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'History', href: '/history', icon: 'M12 2v4m0 14v4M4.22 4.22l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m14 0h4M4.22 19.78l2.83-2.83m8.48-8.48l2.83-2.83' },
  ];

  const isPublicPage = pathname === '/' || pathname === '/login';

  return (
    <html lang="en">
      <body className="bg-[#f8fafc] text-slate-900">
        <Script 
          src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js" 
          type="module" 
          strategy="beforeInteractive"
        />
        {isPublicPage ? (
          <main className="min-h-screen">
            {children}
          </main>
        ) : (
          <div className="flex h-screen overflow-hidden">
            
            {/* Dynamic Sidebar */}
            <aside className={`bg-white border-r border-slate-200 transition-all duration-300 flex flex-col z-20 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
            <div className={`h-20 flex items-center border-b border-slate-100 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'px-6' : 'px-5'}`}>
              <Link href="/dashboard" className="flex items-center h-10 w-auto">
                <img 
                  src={isSidebarOpen ? "/logo.svg" : "/logo-icon.svg"} 
                  alt="Prepzy Logo" 
                  className={`h-full w-auto transition-all duration-300 ${isSidebarOpen ? 'max-w-none' : 'scale-110'}`} 
                />
              </Link>
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
                      ? 'bg-[#3B5CFF] text-white shadow-lg shadow-blue-100' 
                      : 'text-slate-500 hover:bg-blue-50 hover:text-[#3B5CFF]'
                    }`}
                  >
                    <svg className={`w-4.5 h-4.5 shrink-0 transition-all duration-200 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-[#3B5CFF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
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
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-[#3B5CFF] font-bold shrink-0">
                    {user.email?.[0].toUpperCase()}
                  </div>
                  <div className={`transition-all duration-200 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 w-0 h-0 overflow-hidden'}`}>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">{user.email}</p>
                    <button 
                      onClick={handleSignOut}
                      className="text-[10px] text-[#3B5CFF] font-black uppercase hover:underline"
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
            <main className="flex-1 overflow-y-auto p-4 pt-4 md:p-8 md:pt-8 lg:p-12 lg:pt-8 scroll-smooth">
               {children}
            </main>
          </div>
          </div>
        )}
      </body>
    </html>
  );
}
