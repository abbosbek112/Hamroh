
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
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-float-slow"></div>
        <div className="absolute top-[10%] right-[-10%] w-[500px] h-[500px] bg-sky-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-float-medium"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-rose-300/30 rounded-full mix-blend-multiply filter blur-[80px] animate-float-fast"></div>
      </div>

      {/* --- DARK MODE NEBULA SYSTEM (Vibrant & Deep) --- */}
      <div className="hidden dark:block absolute inset-0">
         {/* 1. Deep Space Base Gradient */}
         <div className="absolute inset-0 bg-gradient-to-b from-[#020205] via-[#0B0B15] to-[#020205]"></div>

         {/* 2. Starfield Texture (Static Noise + Sparkles) */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay"></div>
         
         {/* 3. Glowing Nebulas (Liquid Motion) */}
         {/* Purple/Pink Nebula - Top Left */}
         <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-violet-600/20 rounded-full mix-blend-screen filter blur-[100px] animate-pulse-slow"></div>
         
         {/* Cyan/Blue Nebula - Bottom Right */}
         <div className="absolute bottom-[-20%] right-[-10%] w-[900px] h-[900px] bg-blue-600/15 rounded-full mix-blend-screen filter blur-[120px] animate-float-slow" style={{ animationDelay: '2s' }}></div>
         
         {/* Intense Core - Center (Follows mouse slightly via CSS var if added, otherwise distinct animation) */}
         <div className="absolute top-[30%] left-[40%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full mix-blend-screen filter blur-[80px] animate-blob"></div>

         {/* 4. Moving Stars / Particles */}
         <div className="absolute top-[10%] left-[20%] w-1 h-1 bg-white rounded-full shadow-[0_0_10px_white] animate-float-fast opacity-80"></div>
         <div className="absolute top-[40%] right-[30%] w-1.5 h-1.5 bg-blue-300 rounded-full shadow-[0_0_15px_cyan] animate-float-slow opacity-60" style={{ animationDelay: '1s' }}></div>
         <div className="absolute bottom-[20%] left-[10%] w-1 h-1 bg-purple-300 rounded-full shadow-[0_0_10px_purple] animate-float-medium opacity-70" style={{ animationDelay: '3s' }}></div>
      </div>
    </div>
  );
};
