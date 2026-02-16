
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLatest, fetchRecommended } from '../services/animeApi.ts';
import { getHistory } from '../services/historyService.ts';
import { Anime, HistoryItem } from '../types.ts';
import AnimeCard from '../components/AnimeCard.tsx';

const HomePage: React.FC = () => {
  const [popular, setPopular] = useState<Anime[]>([]);
  const [recent, setRecent] = useState<Anime[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (isLoading || isFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, isFetchingMore, hasMore]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (recent.length === 0) setIsLoading(true);
      
      try {
        const [popData, recData] = await Promise.all([
          fetchRecommended(),
          fetchLatest(1)
        ]);
        
        if (isMounted) {
            setPopular(Array.isArray(popData) ? popData : []);
            setRecent(Array.isArray(recData) ? recData : []);
            setHistory(getHistory());
        }
      } catch (e) {
        if (isMounted) {
            setPopular([]);
            setRecent([]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadInitialData();

    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (page <= 1) return;

    const loadMore = async () => {
      setIsFetchingMore(true);
      try {
        const moreData = await fetchLatest(page);
        if (moreData && moreData.length > 0) {
          setRecent(prev => {
            const existingIds = new Set(prev.map(a => a.id));
            const uniqueNew = moreData.filter(a => !existingIds.has(a.id));
            return [...prev, ...uniqueNew];
          });
        } else {
          setHasMore(false);
        }
      } catch (e) {
        console.error("Failed to load more", e);
      } finally {
        setIsFetchingMore(false);
      }
    };

    loadMore();
  }, [page]);

  if (isLoading && recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[90vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const heroAnime = popular[0] || recent[0];

  return (
    <div className="pb-20 animate-fadeIn bg-black min-h-screen">
      
      {/* OTARIPLAY STYLE HERO SECTION */}
      {heroAnime && (
        <section className="relative h-[85vh] w-full overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img 
              src={heroAnime.poster} 
              alt={heroAnime.title}
              className="w-full h-full object-cover" 
            />
            {/* Heavy Dark Overlay for Text Readability (OtariPlay style) */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-transparent"></div>
          </div>

          {/* Hero Content - Left Aligned */}
          <div className="absolute top-1/2 -translate-y-1/2 left-8 md:left-16 max-w-2xl z-10 space-y-6">
            
            {/* Badge & Rating Row */}
            <div className="flex items-center gap-4">
                <span className="bg-red-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/30">
                    FEATURED
                </span>
                <span className="text-white text-xs font-bold flex items-center gap-1">
                    <i className="fa-solid fa-star text-yellow-400"></i> Rating {heroAnime.score || '8.5'}
                </span>
            </div>

            {/* Huge Title */}
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] tracking-tight line-clamp-3">
              {heroAnime.title}
            </h1>

            {/* Description */}
            <p className="text-gray-300 text-sm font-medium leading-relaxed max-w-xl line-clamp-3 md:line-clamp-4">
              {heroAnime.description || "Watch the latest episodes in high definition exclusively on GENZURO. Experience premium streaming with no interruptions."}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <Link 
                to={`/anime/${encodeURIComponent(heroAnime.id)}`} 
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-xl shadow-red-600/30"
              >
                <i className="fa-solid fa-play"></i>
                Watch Now
              </Link>
              <Link
                to={`/anime/${encodeURIComponent(heroAnime.id)}`} 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-8 py-3 rounded-lg font-bold text-sm transition-all"
              >
                View Details
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="px-6 md:px-12 space-y-16 -mt-10 relative z-20">
        
        {/* Keep Watching (History) */}
        {history.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <i className="fa-solid fa-clock-rotate-left text-red-600"></i> Continue Watching
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
               {history.map((item) => (
                  <Link to={`/watch/${encodeURIComponent(item.anime_id)}/${encodeURIComponent(item.ep_id)}`} key={item.id} className="min-w-[240px] snap-start group">
                     <div className="relative aspect-video rounded-lg overflow-hidden bg-[#16191f] border border-white/5">
                        <img src={item.anime_poster} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                           <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `${item.duration ? (item.timestamp/item.duration)*100 : 0}%` }}></div>
                        </div>
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <i className="fa-solid fa-play text-white text-2xl"></i>
                        </div>
                     </div>
                     <h4 className="mt-2 text-xs font-bold truncate text-gray-200 group-hover:text-red-500 transition-colors">{item.anime_title}</h4>
                     <p className="text-[10px] text-gray-500 font-medium">{item.ep_title}</p>
                  </Link>
               ))}
            </div>
          </section>
        )}

        {/* Latest Updates Grid */}
        <section>
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              Latest <span className="text-red-600">Update</span>
            </h2>
            <Link to="/discovery" className="text-[10px] font-bold text-gray-400 hover:text-white uppercase tracking-widest">
                View All <i className="fa-solid fa-arrow-right ml-1"></i>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {recent.map((anime, idx) => (
              <AnimeCard key={`${anime.id}-${idx}`} anime={anime} />
            ))}
          </div>

          <div ref={lastElementRef} className="h-20 flex items-center justify-center mt-12">
            {isFetchingMore ? (
               <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
