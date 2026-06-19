'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Target, Lightbulb, TrendingUp, Compass, Timer, FileUp, ScanLine, ArrowRight, Star } from 'lucide-react';
import Script from 'next/script';

export default function LandingPage() {
  const [inView, setInView] = useState({ 
    cards: false,
    bars: false
  });

  const cardsRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (entry.target.id === 'cards-section') setInView(prev => ({ ...prev, cards: true }));
          if (entry.target.id === 'bars-section') setInView(prev => ({ ...prev, bars: true }));
        }
      });
    }, { threshold: 0.2 });

    if (cardsRef.current) observer.observe(cardsRef.current);
    if (barsRef.current) observer.observe(barsRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ backgroundColor: '#F8FAFC', color: '#0F172A' }} className="min-h-screen font-sans selection:bg-[#3B5CFF] selection:text-white">
      <Script
        src="https://unpkg.com/@lottiefiles/dotlottie-wc@0.9.10/dist/dotlottie-wc.js"
        type="module"
        strategy="afterInteractive"
      />
      <GlobalStyles />
      
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b border-slate-200" style={{ backgroundColor: 'rgba(248,250,252,0.9)' }}>
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center h-12 w-auto">
             <img src="/logo.svg" alt="Prepzy Logo" className="h-full w-auto" />
          </Link>
          <div className="hidden md:flex items-center gap-8 font-medium text-sm text-slate-600">
            <Link href="#features" className="hover:text-slate-900 transition">Features</Link>
            <Link href="#mastery" className="hover:text-slate-900 transition">Mastery</Link>
            <Link href="#reviews" className="hover:text-slate-900 transition">Reviews</Link>
          </div>
          <Link href="/login" className="px-5 py-2.5 rounded-xl font-bold text-sm transform hover:-translate-y-1 transition duration-200" style={{ backgroundColor: '#3B5CFF', color: '#FFFFFF' }}>
            Explore
          </Link>
        </div>
      </nav>

      {/* SECTION 1 — HERO */}
      <header className="relative min-h-screen pt-32 pb-36 flex items-center overflow-hidden">
        {/* Background glow behind mascot */}
        <div className="absolute top-1/2 right-[10%] -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: '#3B5CFF', opacity: 0.12 }}></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10 w-full">
          {/* Left Column */}
          <div className="space-y-8 max-w-2xl">

            <h1 className="text-5xl lg:text-7xl font-bold leading-[1.1] text-slate-900">
              Crack JEE & UPSC with Your <span className="inline-flex items-baseline gap-3 whitespace-nowrap"><span className="bg-[#3B5CFF] text-white px-3 py-1 font-black inline-block">Personal</span> <span style={{ color: '#3B5CFF' }}>AI Tutor</span></span>
            </h1>
          </div>

          {/* Right Column: Mascot */}
          <div className="relative flex justify-center lg:justify-end">
            <MascotSVG />
          </div>
        </div>

      </header>

      {/* SECTION 2 — FEATURE CARDS */}
      <section id="features" className="py-24" style={{ backgroundColor: '#EEF3FF' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16" style={{ color: '#0F172A' }}>
            Everything You Need to Ace Your Exam
          </h2>

          <div id="cards-section" ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard inView={inView.cards} delay={0} icon={<Target className="w-10 h-10 text-[#3B5CFF]" />} title="Smart MCQ Engine" desc="Paste any chapter or upload your notes. Get 10 perfectly calibrated questions instantly, tagged by topic and difficulty." />
            <FeatureCard inView={inView.cards} delay={100} icon={<Lightbulb className="w-10 h-10 text-[#3B5CFF]" />} title="AI Explanation Engine" desc="Wrong answer? Get a step-by-step breakdown of the concept, the misconception you made, and a similar example." />
            <FeatureCard inView={inView.cards} delay={200} icon={<TrendingUp className="w-10 h-10 text-[#3B5CFF]" />} title="Elo Skill Scoring" desc="Each topic has a skill score from 600–2000. Answer correctly on hard questions to level up faster." />
            <FeatureCard inView={inView.cards} delay={300} icon={<Compass className="w-10 h-10 text-[#3B5CFF]" />} title="Weak Topic Tracker" desc="Visual heatmap of your performance. AI ranks topics by how much improvement will boost your overall score." />
            <FeatureCard inView={inView.cards} delay={400} icon={<Timer className="w-10 h-10 text-[#3B5CFF]" />} title="Exam Mode Simulation" desc="Full JEE (90 min, +4/-1) or UPSC (120 min, -1/3) timed simulator. Real exam interface. Real pressure." />
            <FeatureCard inView={inView.cards} delay={500} icon={<FileUp className="w-10 h-10 text-[#3B5CFF]" />} title="Upload Your Own Notes" desc="PDF, image, or handwritten scan — Claude reads it and generates questions from YOUR exact content." />
            <FeatureCard inView={inView.cards} delay={600} icon={<ScanLine className="w-10 h-10 text-[#3B5CFF]" />} title="Handwritten Answer Grader" desc="Photograph a written response. OpenCV cleans the page, Groq Vision reads it, and criterion-level partial marks explain exactly what earned credit." />
          </div>
        </div>
      </section>

      {/* SECTION 3 — ADAPTIVE DIFFICULTY VISUAL */}
      <section id="mastery" className="py-24 overflow-hidden" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Difficulty That Grows With You</h2>
            <p className="text-xl" style={{ color: 'rgba(15,23,42,0.7)' }}>Keep pushing your Elo rating up through automated difficulty scaling.</p>
          </div>

          <div id="bars-section" ref={barsRef} className="relative max-w-4xl mx-auto h-[400px]">
            {/* The 3 Columns */}
            <div className="absolute inset-0 flex justify-between items-end pb-24 z-10">
              {/* Beginner */}
              <div className="flex flex-col items-center w-1/3">
                <span className="text-3xl font-black mb-2" style={{ color: '#3B5CFF' }}>999</span>
                <div className="w-16 bg-slate-200 rounded-t-xl overflow-hidden relative" style={{ height: '120px' }}>
                  <div className={`absolute bottom-0 w-full from-[#1D35A8] to-[#3B5CFF] bg-gradient-to-t rounded-t-xl ${inView.bars ? 'fill-bar' : ''}`} style={{ '--target-height': '100%' } as React.CSSProperties}></div>
                </div>
              </div>
              
              {/* Intermediate */}
              <div className="flex flex-col items-center w-1/3">
                <span className="text-3xl font-black mb-2" style={{ color: '#3B5CFF' }}>1399</span>
                <div className="w-16 bg-slate-200 rounded-t-xl overflow-hidden relative" style={{ height: '220px' }}>
                  <div className={`absolute bottom-0 w-full from-[#1D35A8] to-[#3B5CFF] bg-gradient-to-t rounded-t-xl ${inView.bars ? 'fill-bar' : ''}`} style={{ '--target-height': '100%' } as React.CSSProperties}></div>
                </div>
              </div>

              {/* Expert */}
              <div className="flex flex-col items-center w-1/3">
                <span className="text-3xl font-black mb-2" style={{ color: '#3B5CFF' }}>1800+</span>
                <div className="w-16 bg-slate-200 rounded-t-xl overflow-hidden relative" style={{ height: '320px' }}>
                  <div className={`absolute bottom-0 w-full from-[#1D35A8] to-[#3B5CFF] bg-gradient-to-t rounded-t-xl border-t-[3px] border-[#3B5CFF] ${inView.bars ? 'fill-bar' : ''}`} style={{ '--target-height': '100%' } as React.CSSProperties}></div>
                </div>
              </div>
            </div>

            {/* Horizontal Road */}
            <div className="absolute bottom-0 left-0 right-0">
               {/* Dashed Line SVG */}
               <svg className="absolute bottom-[28px] left-0 w-full h-[4px] z-0">
                  <line x1="10%" y1="2" x2="90%" y2="2" stroke="url(#lineGrad)" strokeWidth="4" strokeDasharray="10" 
                        strokeDashoffset="100" className={inView.bars ? "animate-[dash_3s_linear_infinite]" : ""} />
                  <defs>
                    <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B5CFF" />
                      <stop offset="100%" stopColor="#3B5CFF" />
                    </linearGradient>
                  </defs>
               </svg>
               <div className="flex justify-between relative z-10 px-[10%]">
                 <div className="px-6 py-3 rounded-full text-sm font-bold border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#3B5CFF', color: '#0F172A' }}>Easy MCQs</div>
                 <div className="px-6 py-3 rounded-full text-sm font-bold border-2" style={{ backgroundColor: '#FFFFFF', borderColor: '#3B5CFF', color: '#0F172A' }}>Medium MCQs</div>
                 <div className="px-6 py-3 rounded-full text-sm font-bold border-2 shadow-[0_0_15px_rgba(59,92,255,0.25)]" style={{ backgroundColor: '#FFFFFF', borderColor: '#3B5CFF', color: '#0F172A' }}>Hard MCQs</div>
               </div>
            </div>
          </div>
        </div>
      </section>


      {/* SECTION 5 — SOCIAL PROOF */}
      <section id="reviews" className="py-24" style={{ backgroundColor: '#F8FAFC' }}>
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16 text-slate-900">Trusted by JEE & UPSC Aspirants</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <TestimonialCard name="Arjun S., JEE 2025" quote="Prepzy generated questions from my Thermodynamics notes that were harder than the actual paper. My rank improved by 4,000." />
            <TestimonialCard name="Priya M., UPSC Aspirant" quote="The weak topic tracker showed me I was spending time on History while Polity was killing my score. Game changer." />
            <TestimonialCard name="Rahul K., JEE Advanced Qualifier" quote="The AI explanations are better than my coaching institute's. It actually tells me WHY I'm wrong, not just what's right." />
          </div>
        </div>
      </section>

      {/* SECTION 6 — FINAL CTA BANNER */}
      <section className="py-24" style={{ backgroundImage: 'linear-gradient(to bottom, #3B5CFF, #2438C7)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <h2 className="text-5xl font-bold text-white">Your Rank Is One Session Away</h2>
          <p className="text-2xl text-white/70">Join 10,000+ students already using Prepzy</p>
          <div className="pt-6">
            <Link href="/login" className="inline-flex items-center gap-2 px-12 py-5 rounded-2xl text-xl font-bold hover:scale-105 transition-transform shadow-2xl" style={{ backgroundColor: '#3B5CFF', color: '#FFFFFF' }}>
              Start Free Today <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          <p className="text-white/50 text-sm mt-4">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* SECTION 7 — FOOTER */}
      <footer className="pt-20 pb-8" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center justify-center border-b border-slate-200 pb-12 mb-8 text-sm text-center">
          <div className="space-y-4 flex flex-col items-center">
            <div className="h-12 w-auto mb-4">
              <img src="/logo.svg" alt="Prepzy Logo" className="h-full w-auto" />
            </div>
            <p className="text-slate-500 max-w-xs">AI-powered learning platform designed exclusively for India's toughest competitive exams.</p>

          </div>

        </div>
        <div className="text-center text-slate-500 text-xs">
           © {new Date().getFullYear()} Prepzy. Built for India's 13M competitive exam aspirants.
        </div>
      </footer>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------ //
// Reusable Sub-Components
// ------------------------------------------------------------------------------------------------ //

function FeatureCard({ icon, title, desc, delay, inView }: { icon: React.ReactNode, title: string, desc: string, delay: number, inView: boolean }) {
  return (
    <div 
      className={`relative rounded-2xl p-6 transition-all duration-700 ease-out flex flex-col group overflow-hidden`}
      style={{ 
        backgroundColor: '#FFFFFF', 
        border: '1px solid rgba(59,92,255,0.2)',
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(40px)',
        transitionDelay: `${delay}ms`
      }}
    >
      {/* Hover effects handled mostly by traditional CSS via style/className */}
      <style jsx>{`
        div:hover {
          border-color: #3B5CFF;
          transform: translateY(-4px) !important;
          box-shadow: 0 0 30px rgba(59,92,255,0.15);
        }
      `}</style>

      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl pointer-events-none" style={{ background: 'linear-gradient(45deg, transparent, rgba(59,92,255,0.1), transparent)' }}></div>
      
      <div className="text-4xl mb-4 relative z-10">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-slate-900 relative z-10">{title}</h3>
      <p className="text-sm font-medium leading-relaxed relative z-10" style={{ color: 'rgba(15,23,42,0.72)' }}>{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, quote }: { name: string, quote: string }) {
  return (
    <div className="rounded-2xl p-6 flex flex-col" style={{ backgroundColor: '#FFFFFF', border: '1px solid rgba(59,92,255,0.25)' }}>
      <div className="mb-4 flex gap-1" style={{ color: '#3B5CFF' }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Star key={index} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="text-slate-600 italic mb-6 flex-1 leading-relaxed">"{quote}"</p>
      <div className="font-bold text-slate-900">{name}</div>
    </div>
  );
}

const MascotSVG = () => (
  <div className="relative w-full max-w-lg aspect-[4/3] lg:max-w-2xl flex items-center justify-center animate-float group z-0">
    <dotlottie-wc
      src="https://lottie.host/b63b029a-6842-424b-b100-b291608f00a0/RSWNmcQbB3.lottie"
      className="w-full h-full object-contain drop-shadow-2xl relative z-10"
      autoplay
      loop
    />


  </div>
);

// CSS inject component
const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{__html: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }

    @keyframes blink {
      0%, 90%, 100% { transform: scaleY(1); }
      95% { transform: scaleY(0.1); }
    }

    @keyframes glow-pulse {
      0%, 100% { opacity: 0.6; filter: blur(8px); }
      50% { opacity: 1; filter: blur(4px); }
    }

    @keyframes dash {
      to { stroke-dashoffset: 0; }
    }

    @keyframes bar-fill {
      from { height: 0%; }
      to { height: var(--target-height); }
    }

    @keyframes chip-float-1 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-15px) translateX(10px); }
    }

    @keyframes chip-float-2 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(12px) translateX(-10px); }
    }

    @keyframes chip-float-3 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-8px) translateX(-8px); }
    }

    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-blink { animation: blink 4s infinite; transform-origin: center; }
    .animate-glow { animation: glow-pulse 2s infinite; }
    
    .chip-1 { animation: chip-float-1 4s ease-in-out infinite; }
    .chip-2 { animation: chip-float-2 5s ease-in-out infinite; }
    .chip-3 { animation: chip-float-3 4.5s ease-in-out infinite; }
    
    .fill-bar {
      animation: bar-fill 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    /* Smooth Scroll */
    html {
      scroll-behavior: smooth;
    }
  `}} />
);
