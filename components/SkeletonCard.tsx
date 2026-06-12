
import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="space-y-3 w-full animate-pulse">
      <div className="relative aspect-[2/3] rounded-xl md:rounded-[20px] bg-white/5 overflow-hidden">
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 bg-white/5 rounded w-3/4"></div>
        <div className="h-3 bg-white/5 rounded w-1/2"></div>
      </div>
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default SkeletonCard;
