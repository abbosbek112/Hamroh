import React from 'react';
import { ACHIEVEMENTS_LIST } from '../constants';
import { User } from '../types';

interface UserBadgeProps {
  user: User;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const UserBadge: React.FC<UserBadgeProps> = ({ user, size = 'md', className = '' }) => {
  if (!user.selectedBadgeId) return null;

  const badge = ACHIEVEMENTS_LIST.find(b => b.id === user.selectedBadgeId);
  if (!badge) return null;

  const sizeClasses = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  };

  // Responsive sparkle size and positioning based on badge size
  const sparkleSize = size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-2.5 h-2.5' : 'w-3 h-3';
  const sparkleOffset = size === 'sm' ? 18 : size === 'md' ? 22 : 28;
  const glowSize = size === 'sm' ? '180%' : size === 'md' ? '200%' : '220%';
  const glowOffset = size === 'sm' ? '-40%' : size === 'md' ? '-50%' : '-60%';

  return (
    <span 
      className={`inline-block relative ${sizeClasses[size]} ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px',
        isolation: 'isolate',
        overflow: 'visible',
        position: 'relative',
        zIndex: 100,
      }}
    >
      {/* 3D Badge Container - Fixed positioning to escape parent overflow */}
      <span 
        className="inline-block relative badge-container"
        style={{
          transformStyle: 'preserve-3d',
          pointerEvents: 'none',
          zIndex: 100,
          position: 'relative',
          display: 'inline-block',
          overflow: 'visible',
          clipPath: 'none',
        }}
      >
        {/* Animated glow rings behind badge - More visible */}
        <span 
          className="absolute blur-2xl opacity-60 badge-glow"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.7) 0%, rgba(168, 85, 247, 0.5) 40%, transparent 70%)',
            width: glowSize,
            height: glowSize,
            top: glowOffset,
            left: glowOffset,
            zIndex: 99,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
        <span 
          className="absolute blur-xl opacity-50 badge-glow-2"
          style={{
            background: 'radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, rgba(139, 92, 246, 0.4) 50%, transparent 70%)',
            width: `calc(${glowSize} * 0.9)`,
            height: `calc(${glowSize} * 0.9)`,
            top: `calc(${glowOffset} * 0.8)`,
            left: `calc(${glowOffset} * 0.8)`,
            zIndex: 99,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
        
        {/* Main badge icon with 3D transform - More visible */}
        <span 
          className="inline-block relative filter drop-shadow-2xl badge-float"
          style={{
            textShadow: '0 0 30px rgba(139, 92, 246, 0.8), 0 0 60px rgba(168, 85, 247, 0.5), 0 0 90px rgba(236, 72, 153, 0.3)',
            transformStyle: 'preserve-3d',
            zIndex: 102,
            position: 'relative',
            display: 'inline-block',
            pointerEvents: 'none',
          }}
        >
          <span 
            className="inline-block badge-rotate"
            style={{
              transformStyle: 'preserve-3d',
              display: 'inline-block',
            }}
          >
            {badge.icon}
          </span>
        </span>

        {/* Sparkle particles around badge - More visible and responsive */}
        <span
          className={`absolute ${sparkleSize} bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full badge-sparkle-0 opacity-80 shadow-lg`}
          style={{
            top: `-${sparkleOffset}px`,
            left: `-${sparkleOffset * 0.7}px`,
            boxShadow: '0 0 12px rgba(251, 191, 36, 1), 0 0 24px rgba(251, 191, 36, 0.7)',
            zIndex: 101,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
        <span
          className={`absolute ${sparkleSize} bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full badge-sparkle-1 opacity-80 shadow-lg`}
          style={{
            top: `${sparkleOffset}px`,
            left: `-${sparkleOffset * 1.3}px`,
            boxShadow: '0 0 12px rgba(251, 191, 36, 1), 0 0 24px rgba(251, 191, 36, 0.7)',
            zIndex: 101,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
        <span
          className={`absolute ${sparkleSize} bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full badge-sparkle-2 opacity-80 shadow-lg`}
          style={{
            top: `${sparkleOffset}px`,
            left: `${sparkleOffset * 0.7}px`,
            boxShadow: '0 0 12px rgba(251, 191, 36, 1), 0 0 24px rgba(251, 191, 36, 0.7)',
            zIndex: 101,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
        <span
          className={`absolute ${sparkleSize} bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 rounded-full badge-sparkle-3 opacity-80 shadow-lg`}
          style={{
            top: `-${sparkleOffset}px`,
            left: `${sparkleOffset * 1.3}px`,
            boxShadow: '0 0 12px rgba(251, 191, 36, 1), 0 0 24px rgba(251, 191, 36, 0.7)',
            zIndex: 101,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />

        {/* Rotating ring effect - More visible */}
        <span 
          className="absolute rounded-full border-2 border-violet-400/50 badge-ring opacity-50"
          style={{
            width: '170%',
            height: '170%',
            top: '-35%',
            left: '-35%',
            boxShadow: '0 0 25px rgba(139, 92, 246, 0.5), inset 0 0 25px rgba(168, 85, 247, 0.3)',
            zIndex: 100,
            pointerEvents: 'none',
            clipPath: 'none',
            overflow: 'visible',
          }}
        />
      </span>
    </span>
  );
};
