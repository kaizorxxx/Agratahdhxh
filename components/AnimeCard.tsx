
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Anime } from '../types.ts';
import { getAnimeSlug } from '../services/animeApi.ts';

interface AnimeCardProps {
  anime: Anime;
  priority?: boolean; // If true, eager load (optional usage)
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime }) => {
  const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  // Logic to determine if it's an episode (Latest Updates) or a Series
  const isLikelyEpisode = anime.id.includes('-episode-');
  const animeSlug = getAnimeSlug(anime.id);
  
  const targetLink = isLikelyEpisode 
    ? `/watch/${encodeURIComponent(animeSlug)}/${encodeURIComponent(anime.id)}`
    : `/anime/${encodeURIComponent(anime.id)}`;

  const handleImageLoad = () => setImageStatus('loaded');
  const handleImageError = () => setImageStatus('error');

  // Thematic Placeholder (Dark minimalist or specific asset)
  const FALLBACK_IMAGE = "https://via.placeholder.com/300x450/16191f/374151?text=ANIME-X";

  return (
    <Link to={targetLink} className="group block space-y-3 w-full">
      <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden bg-[#16191f] border border-white/5 shadow-lg transform-gpu">
        
        {/* Loading Skeleton / Blur Placeholder */}
        <div 
          className={`absolute inset-0 bg-gray-800 animate-pulse transition-opacity duration-500 ${
            imageStatus === 'loading' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`} 
        />

        {/* Actual Image */}
        <img 
          src={imageStatus === 'error' ? FALLBACK_IMAGE : anime.poster} 
          alt={anime.title} 
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ease-in-out ${
            imageStatus === 'loaded' ? 'opacity-100 blur-0' : 'opacity-0 blur-sm'
          }`} 
        />
        
        {/* Error State Overlay (Optional aesthetic touch on top of fallback) */}
        {imageStatus === 'error' && (
           <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-20">
              <i className="fa-solid fa-image text-gray-500 text-3xl mb-2"></i>
           </div>
        )}

        {/* Score Badge */}
        {anime.score && (
          <div className="absolute top-3 left-3 z-30 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-black text-yellow-500 flex items-center space-x-1 border border-white/10 pointer-events-none">
              <i className="fa-solid fa-star text-[7px]"></i>
              <span>{anime.score}</span>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute bottom-3 left-3 right-3 z-30 flex justify-between items-end">
            {anime.status && (
              <div className="bg-red-600 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter shadow-sm">
                {anime.status}
              </div>
            )}
            
            {anime.total_episodes && (
                <div className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[8px] text-white font-bold border border-white/10">
                  EP {anime.total_episodes}
                </div>
            )}
        </div>

        {/* Play Icon Overlay for Episodes */}
        {isLikelyEpisode && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none bg-black/20">
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300">
                <i className="fa-solid fa-play text-white ml-1"></i>
              </div>
          </div>
        )}

        {/* Hover Text Overlay (Discovery Style) */}
        {!isLikelyEpisode && (
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-20">
              <div className="w-full py-2 bg-white rounded-lg text-center text-[10px] font-black text-black uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform">
                Details
              </div>
           </div>
        )}
      </div>

      <h3 className="font-bold text-sm text-gray-200 line-clamp-2 group-hover:text-red-500 transition-colors uppercase tracking-tight leading-snug">
        {anime.title}
      </h3>
    </Link>
  );
};

export default AnimeCard;
