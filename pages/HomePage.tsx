
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
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [popData, recData] = await Promise.all([
          fetchRecommended(),
          fetchLatest(1)
        ]);
        setPopular(Array.isArray(popData) ? popData : []);
        setRecent(Array.isArray(recData) ? recData : []);
        setHistory(getHistory());
      } catch (e) {
        setPopular([]);
        setRecent([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
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
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Entering Genzuro World...</p>
      </div>
    );
  }

  const heroAnime = popular[0] || recent[0];

  return (
    <div className="pb-20 animate-fadeIn bg-black min-h-screen">
      
      {/* Cinematic Hero Section (Netflix Style) */}
      {heroAnime && (
        <section className="relative h-[90vh] w-full overflow-hidden">
          {/* Backdrop Image */}
          <div className="absolute inset-0">
            <img 
              src={heroAnime.poster} 
              alt={heroAnime.title}
              className="w-full h-full object-cover scale-105" 
            />
            {/* Dark Vignette Overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"></div>
          </div>

          {/* Hero Content Overlay */}
          <div className="absolute bottom-32 left-8 md:left-16 max-w-2xl z-10 space-y-6">
            <div className="flex flex-col space-y-3">
              <p className="text-white/70 text-[10px] md:text-xs font-black uppercase tracking-[0.2em]">
                SEASON 1 • 12 EPISODES
              </p>
              
              <div className="flex items-center space-x-4 text-xs font-bold">
                 <div className="flex items-center space-x-1 text-yellow-500">
                    <i className="fa-solid fa-star text-[10px]"></i>
                    <span>9.4</span>
                 </div>
                 <span className="text-gray-400">2024</span>
                 <span className="text-gray-400">Exciting Story</span>
                 <span className="text-gray-400">1 Season</span>
              </div>
            </div>

            <h1 className="text-5xl md:text-8xl font-[900] text-white tracking-tighter uppercase italic leading-none drop-shadow-2xl">
              {heroAnime.title}
            </h1>

            <p className="text-gray-300 text-sm md:text-base font-medium leading-relaxed max-w-xl opacity-90">
              {heroAnime.description || "A thrilling journey through mystery and action. Discover the truth behind the chaos in this premium GENZURO original series."}
            </p>

            <div className="flex items-center space-x-4 pt-6">
              <Link 
                to={`/anime/${encodeURIComponent(heroAnime.id)}`} 
                className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-lg font-black transition-all flex items-center space-x-3 shadow-2xl shadow-red-600/30 group"
              >
                <i className="fa-solid fa-play text-lg group-hover:scale-110 transition-transform"></i>
                <span className="tracking-widest text-xs uppercase">Watch</span>
              </Link>
              <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-lg font-black transition-all flex items-center space-x-3 group">
                <i className="fa-solid fa-plus text-lg group-hover:rotate-90 transition-transform"></i>
                <span className="tracking-widest text-xs uppercase">Add List</span>
              </button>
            </div>
          </div>

          {/* Slider Indicators (Visual Only) */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex space-x-3">
            <div className="w-8 h-1 bg-white/50 rounded-full"></div>
            <div className="w-8 h-1 bg-white rounded-full"></div>
            <div className="w-8 h-1 bg-white/50 rounded-full"></div>
          </div>
        </section>
      )}

      <div className="px-8 space-y-16 mt-10">
        {/* Continue Watching */}
        {history.length > 0 && (
          <section>
            <h2 className="text-xl font-black mb-6 flex items-center space-x-3 uppercase tracking-tighter italic">
              <i className="fa-solid fa-history text-red-600"></i>
              <span>Keep Watching</span>
            </h2>
            <div className="flex space-x-6 overflow-x-auto pb-6 hide-scrollbar snap-x">
               {history.map((item) => (
                  <Link to={`/watch/${encodeURIComponent(item.anime_id)}/${encodeURIComponent(item.ep_id)}`} key={item.id} className="min-w-[280px] snap-start group">
                     <div className="relative aspect-video rounded-xl overflow-hidden bg-[#16191f] border border-white/5 shadow-xl">
                        <img src={item.anime_poster} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" alt="" />
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                           <div className="h-full bg-red-600 shadow-[0_0_10px_rgba(220,38,38,0.8)]" style={{ width: `${item.duration ? (item.timestamp/item.duration)*100 : 0}%` }}></div>
                        </div>
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <i className="fa-solid fa-play text-white text-3xl"></i>
                        </div>
                     </div>
                     <h4 className="mt-3 text-sm font-black truncate uppercase text-white/90">{item.anime_title}</h4>
                     <p className="text-[10px] text-gray-500 truncate mt-1 font-bold uppercase tracking-widest">{item.ep_title}</p>
                  </Link>
               ))}
            </div>
          </section>
        )}

        {/* Latest Updates / Trends Now */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black tracking-tight uppercase italic flex items-center space-x-3">
              <i className="fa-solid fa-chart-line text-red-600"></i>
              <span>Trends Now</span>
            </h2>
            <div className="h-[2px] flex-1 bg-white/5 mx-6 hidden md:block"></div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {recent.map((anime, idx) => (
              <AnimeCard key={`${anime.id}-${idx}`} anime={anime} />
            ))}
          </div>

          {/* Infinite Scroll Sensor */}
          <div ref={lastElementRef} className="h-20 flex items-center justify-center mt-12">
            {isFetchingMore ? (
               <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
               <div className="h-[1px] w-full bg-white/5"></div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
