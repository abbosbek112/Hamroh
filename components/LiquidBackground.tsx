
import React from 'react';

export const LiquidBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 overflow-hidden bg-[#F8FAFC] dark:bg-[#020205] transition-colors duration-700"
      style={{
        zIndex: -1,
        isolation: 'isolate',
        pointerEvents: 'none'
      }}
    >

      {/* --- LIGHT MODE BLOBS (Soft & Pastel) --- */}
      <div className="dark:hidden">
        {/* Only show 1 blob on mobile, 3 on desktop */}
        <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[600px] sm:h-[600px] bg-indigo-300/20 sm:bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[40px] sm:blur-[80px] animate-float-slow"></div>
        <div className="hidden sm:block absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-sky-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-float-medium"></div>
        <div className="hidden sm:block absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-rose-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-float-fast"></div>
      </div>

      {/* --- DARK MODE NEBULA SYSTEM (Vibrant & Deep) --- */}
      <div className="hidden dark:block absolute inset-0">
        {/* 1. Deep Space Base Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#020205] via-[#0B0B15] to-[#020205]"></div>

        {/* 2. Starfield Texture (Static Noise - CSS-based, no external request) */}
        <div className="absolute inset-0 opacity-[0.04] mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}></div>

        {/* 3. Glowing Nebulas (Liquid Motion) */}
        {/* Purple/Pink Nebula - Top Left - Optimized for mobile */}
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] sm:w-[800px] sm:h-[800px] bg-violet-600/10 sm:bg-violet-600/20 rounded-full sm:mix-blend-screen filter blur-[60px] sm:blur-[100px] animate-pulse-slow"></div>

        {/* Cyan/Blue Nebula - Bottom Right - Optimized for mobile */}
        <div className="hidden sm:block absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-blue-600/15 rounded-full mix-blend-screen filter blur-[120px] animate-float-slow" style={{ animationDelay: '2s' }}></div>

        {/* Intense Core - Center - Optimized for mobile */}
        <div className="absolute top-[30%] left-[20%] sm:left-[40%] w-[250px] h-[250px] sm:w-[400px] sm:h-[400px] bg-indigo-500/5 sm:bg-indigo-500/10 rounded-full sm:mix-blend-screen filter blur-[50px] sm:blur-[80px] animate-blob"></div>

        {/* 4. Moving Stars / Particles - Only 1 on mobile */}
        <div className="absolute top-[10%] left-[20%] w-0.5 h-0.5 sm:w-1 sm:h-1 bg-white rounded-full shadow-[0_0_5px_white] sm:shadow-[0_0_10px_white] animate-float-fast opacity-50 sm:opacity-80"></div>
        <div className="hidden sm:block absolute top-[40%] right-[30%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_15px_cyan] animate-float-slow opacity-60" style={{ animationDelay: '1s' }}></div>
        <div className="hidden sm:block absolute bottom-[20%] left-[10%] w-1 h-1 bg-purple-300 rounded-full shadow-[0_0_10px_purple] animate-float-medium opacity-70" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  );
};
