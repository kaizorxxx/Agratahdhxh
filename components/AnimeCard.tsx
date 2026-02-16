
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types.ts';
import { getAnimeSlug } from '../services/animeApi.ts';

interface AnimeCardProps {
  anime: Anime;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const animeSlug = getAnimeSlug(anime.id);
  const targetLink = `/anime/${encodeURIComponent(animeSlug)}`;
  const FALLBACK_IMAGE = "https://via.placeholder.com/300x450/000000/333333?text=GENZURO";

  // Data formatting
  // Extract Year from date string (e.g., "2024-05-12" -> "2024")
  const getYear = (dateStr?: string) => {
    if (!dateStr) return '???';
    const match = dateStr.match(/\d{4}/);
    return match ? match[0] : dateStr.substring(0, 4);
  };

  const displayYear = getYear(anime.release_date);
  const displayScore = anime.score || 'N/A';
  const displayEpisodes = anime.total_episodes ? `${anime.total_episodes}` : '?';

  return (
    <div className="group space-y-3 w-full animate-fadeIn">
      {/* Card Image Container */}
      <Link to={targetLink} className="relative block aspect-[2/3] rounded-xl md:rounded-[20px] overflow-hidden bg-[#111] shadow-lg transition-all duration-300 transform group-hover:scale-[1.02] border border-white/5">
        
        {imageStatus === 'loading' && (
          <div className="absolute inset-0 z-10 overflow-hidden bg-[#1a1c22]">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>
        )}

        <img 
          src={imageStatus === 'error' ? FALLBACK_IMAGE : anime.poster} 
          alt={anime.title} 
          loading="lazy"
          onLoad={() => setImageStatus('loaded')}
          onError={() => setImageStatus('error')}
          className={`w-full h-full object-cover transition-opacity duration-500 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}`} 
        />
        
        {/* Status Badge (Top Right) */}
        <div className="absolute top-2 right-2 md:top-3 md:right-3 pointer-events-none z-20">
          <span className="bg-black/60 backdrop-blur-md text-white text-[9px] md:text-[10px] font-bold px-2 py-1 rounded-md border border-white/10 uppercase tracking-wider">
            {anime.type || 'TV'}
          </span>
        </div>

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center z-20">
           <div className="w-12 h-12 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg transform scale-50 group-hover:scale-100 transition-transform duration-300 shadow-red-600/40">
               <i className="fa-solid fa-play ml-1"></i>
           </div>
        </div>
      </Link>

      {/* Card Info */}
      <div className="space-y-1">
        <h3 className="font-bold text-sm text-white line-clamp-1 group-hover:text-red-600 transition-colors">
          {anime.title}
        </h3>
        
        {/* Metadata Row */}
        <div className="flex items-center text-[10px] md:text-[11px] font-medium text-gray-400 gap-3">
          {/* Rating */}
          <div className="flex items-center gap-1 text-white">
             <i className="fa-solid fa-star text-yellow-400 text-[9px]"></i>
             <span>{displayScore}</span>
          </div>

          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

          {/* Year */}
          <span>{displayYear}</span>

          <div className="w-1 h-1 bg-gray-600 rounded-full"></div>

          {/* Episodes */}
          <span>{displayEpisodes} Eps</span>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AnimeCard;
