
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types.ts';
import { getAnimeSlug } from '../services/animeApi.ts';

interface AnimeCardProps {
  anime: Anime;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  const animeSlug = getAnimeSlug(anime.id);
  
  // Point to Anime Detail (Cover) Page instead of direct watch
  const targetLink = `/anime/${encodeURIComponent(animeSlug)}`;

  const FALLBACK_IMAGE = "https://via.placeholder.com/300x450/000000/333333?text=GENZURO";

  // Data formatting
  const displayDate = anime.release_date || 'Unknown';
  const displayScore = anime.score || 'N/A';
  const displayEpisodes = anime.total_episodes;

  return (
    <div className="group space-y-4 w-full animate-fadeIn transition-transform duration-500">
      <Link to={targetLink} className="relative block aspect-[2/3] rounded-[24px] overflow-hidden bg-[#111] shadow-2xl transition-all duration-500 transform group-hover:scale-[1.03] group-hover:z-10 group-hover:shadow-[0_20px_40px_-15px_rgba(220,38,38,0.4)] border border-white/5">
        
        {imageStatus === 'loading' && (
          <div className="absolute inset-0 z-10 overflow-hidden bg-[#1a1c22]">
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-10 h-10 border-2 border-red-600/20 border-t-red-600 rounded-full animate-spin"></div>
            </div>
          </div>
        )}

        <img 
          src={imageStatus === 'error' ? FALLBACK_IMAGE : anime.poster} 
          alt={anime.title} 
          loading="lazy"
          onLoad={() => setImageStatus('loaded')}
          onError={() => setImageStatus('error')}
          className={`w-full h-full object-cover transition-all duration-700 ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'} group-hover:scale-110`} 
        />
        
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none z-20">
          {anime.status && (
            <span className="bg-red-600/90 backdrop-blur-md text-white text-[8px] font-black px-3 py-1 rounded-full shadow-xl uppercase tracking-widest border border-white/10">
              {anime.status}
            </span>
          )}
        </div>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 z-20">
           <div className="flex items-center space-x-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform group-hover:rotate-[360deg] transition-transform duration-700">
                 <i className="fa-solid fa-play text-[10px] ml-0.5"></i>
              </div>
              <div className="flex-1">
                  <p className="text-[10px] font-black uppercase text-red-600 mb-0.5">View Detail</p>
                  <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest">Genzuro Original</p>
              </div>
           </div>
        </div>
      </Link>

      <div className="px-1 space-y-1.5">
        <h3 className="font-black text-sm text-white line-clamp-1 group-hover:text-red-500 transition-colors uppercase italic tracking-tighter">
          {anime.title}
        </h3>
        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
          {/* Release Date */}
          <span className="truncate max-w-[80px]">{displayDate}</span>
          
          <div className="w-1 h-1 bg-white/10 rounded-full"></div>
          
          {/* Score */}
          <div className="flex items-center space-x-1.5 group-hover:text-yellow-500 transition-colors">
            <i className="fa-solid fa-star text-[7px]"></i>
            <span>{displayScore}</span>
          </div>

          {/* Episodes */}
          {displayEpisodes && (
             <>
                <div className="w-1 h-1 bg-white/10 rounded-full"></div>
                <span className="text-gray-400">{displayEpisodes} Eps</span>
             </>
          )}
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
