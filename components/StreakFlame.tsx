
import React from 'react';
import { Flame, Sparkles } from 'lucide-react';

interface StreakFlameProps {
  streak: number;
  size?: number;
  className?: string;
}

export const StreakFlame: React.FC<StreakFlameProps> = ({ streak, size = 24, className = '' }) => {
  // 0 days
  if (streak <= 0) {
    return (
      <Flame 
        size={size} 
        className={`text-slate-300 dark:text-slate-600 ${className}`} 
      />
    );
  }

  // 1-3 days (Spark)
  if (streak < 3) {
    return (
      <div className={`relative ${className}`} title="Uchqun (Spark)">
        <Flame 
          size={size * 0.8} 
          className="text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]" 
          fill="currentColor" 
        />
      </div>
    );
  }

  // 3-7 days (Flame)
  if (streak < 7) {
    return (
      <div className={`relative ${className}`} title="Olov (Flame)">
        <Flame 
          size={size} 
          className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]" 
          fill="currentColor" 
        />
      </div>
    );
  }

  // 7-15 days (Blaze)
  if (streak < 15) {
    return (
      <div className={`relative ${className}`} title="Yong'in (Blaze)">
        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full scale-150 animate-pulse"></div>
        <Flame 
          size={size * 1.1} 
          className="text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)] relative z-10" 
          fill="currentColor" 
        />
      </div>
    );
  }

  // 15+ days (Legendary)
  return (
    <div className={`relative ${className}`} title="Afsonaviy (Legendary)">
      <div className="absolute inset-0 bg-blue-500/30 blur-xl rounded-full scale-150 animate-pulse-slow"></div>
      <div className="relative z-10">
         <Flame 
            size={size * 1.25} 
            className="text-blue-500 dark:text-cyan-400 drop-shadow-[0_0_20px_rgba(59,130,246,0.8)]" 
            fill="currentColor" 
         />
         <Sparkles 
           size={size * 0.5} 
           className="absolute -top-1 -right-1 text-white animate-spin-slow" 
           strokeWidth={3}
         />
      </div>
    </div>
  );
};
