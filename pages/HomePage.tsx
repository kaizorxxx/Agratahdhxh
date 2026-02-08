
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLatest, fetchRecommended } from '../services/animeApi.ts';
import { getHistory } from '../services/historyService.ts';
import { Anime, HistoryItem } from '../types.ts';

const HomePage: React.FC = () => {
  const [popular, setPopular] = useState<Anime[]>([]);
  const [recent, setRecent] = useState<Anime[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // State Infinite Scroll
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const navigate = useNavigate();
  const observer = useRef<IntersectionObserver | null>(null);

  // Sensor element untuk Infinite Scroll
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

  // Load Initial Data
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
        console.error("Home loading error:", e);
        setPopular([]);
        setRecent([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // Fetch Next Page
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading && recent.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Menghubungkan ke Server...</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-12 animate-fadeIn">
      {/* Search Bar */}
      <div className="flex justify-end mb-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
           <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anime..." 
            className="w-full bg-[#16191f] border border-[#272a31] rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-red-600 transition-all shadow-inner text-white"
           />
           <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
        </form>
      </div>

      {/* Hero Section */}
      {popular && popular.length > 0 && (
        <section>
          <div className="relative h-[480px] rounded-[40px] overflow-hidden group shadow-2xl border border-white/5 transform-gpu">
            <img 
              src={popular[0].poster} 
              alt={popular[0].title}
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/728x400?text=Error+Loading+Image')}
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-transparent"></div>
            <div className="absolute bottom-12 left-12 max-w-2xl space-y-4">
              <h1 className="text-6xl font-black text-white tracking-tighter line-clamp-2 uppercase italic">{popular[0].title}</h1>
              <div className="flex items-center space-x-6">
                 {popular[0].score && (
                   <div className="flex items-center space-x-2 text-yellow-500 font-black">
                      <i className="fa-solid fa-star"></i>
                      <span>{popular[0].score}</span>
                   </div>
                 )}
                 <span className="text-gray-300 font-bold uppercase tracking-widest text-xs">Featured Anime</span>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <Link to={`/anime/${encodeURIComponent(popular[0].id)}`} className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-[20px] font-black transition-all flex items-center space-x-3 shadow-2xl shadow-red-600/40">
                  <i className="fa-solid fa-play text-xl"></i>
                  <span className="tracking-widest text-sm uppercase">Watch Now</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Continue Watching */}
      {history.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center space-x-2 uppercase tracking-tighter">
            <i className="fa-solid fa-clock-rotate-left text-red-600"></i>
            <span>Continue Watching</span>
          </h2>
          <div className="flex space-x-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
             {history.map((item) => (
                <Link to={`/watch/${encodeURIComponent(item.anime_id)}/${encodeURIComponent(item.ep_id)}`} key={item.id} className="min-w-[240px] snap-start group">
                   <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#16191f] border border-white/5 transform-gpu">
                      <img src={item.anime_poster} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80" alt="" />
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                         <div className="h-full bg-red-600" style={{ width: `${item.duration ? (item.timestamp/item.duration)*100 : 0}%` }}></div>
                      </div>
                   </div>
                   <h4 className="mt-3 text-xs font-black truncate uppercase">{item.anime_title}</h4>
                   <p className="text-[10px] text-gray-400 truncate mt-1">{item.ep_title}</p>
                </Link>
             ))}
          </div>
        </section>
      )}

      {/* Latest Updates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <h2 className="text-2xl font-black tracking-tight uppercase italic mb-8">Latest Updates</h2>
          
          {recent.length === 0 && !isLoading ? (
             <div className="text-center py-10 bg-[#16191f] rounded-3xl border border-red-900/30">
                <i className="fa-solid fa-triangle-exclamation text-3xl text-red-600 mb-4"></i>
                <p className="font-bold text-gray-400">Gagal memuat data.</p>
                <p className="text-xs text-gray-600 mt-2">Cek Console (F12) untuk detail error.</p>
             </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
              {recent.map((anime, idx) => (
                <Link to={`/anime/${encodeURIComponent(anime.id)}`} key={`${anime.id}-${idx}`} className="group block space-y-4">
                  <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden bg-[#16191f] shadow-lg border border-white/5 transform-gpu">
                    <img 
                      src={anime.poster} 
                      alt={anime.title} 
                      onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300x450?text=No+Image')}
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                      loading="lazy" 
                    />
                    
                    {/* Fixed Position Badge to prevent shaking during scroll/hover */}
                    {anime.score && (
                      <div className="absolute top-3 left-3 z-20 bg-red-600/90 backdrop-blur-sm px-2.5 py-1 rounded-full text-[10px] font-black text-white flex items-center space-x-1 shadow-lg pointer-events-none">
                          <i className="fa-solid fa-star text-[8px] text-yellow-300"></i>
                          <span>{anime.score}</span>
                      </div>
                    )}

                    <div className="absolute bottom-3 left-3 right-3 z-20 flex justify-between items-end">
                      <div className="bg-black/60 px-2 py-1 rounded text-[9px] text-gray-300 font-bold uppercase truncate max-w-[70%] backdrop-blur-sm">
                        {anime.status}
                      </div>
                      {anime.total_episodes && (
                         <div className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-[9px] text-white font-bold">
                            EP {anime.total_episodes}
                         </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-500 transition-colors uppercase">{anime.title}</h3>
                </Link>
              ))}
            </div>
          )}

          {/* Infinite Scroll Sensor */}
          <div ref={lastElementRef} className="h-20 flex items-center justify-center mt-10">
            {isFetchingMore && (
               <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            )}
            {!hasMore && recent.length > 0 && (
               <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">— No More Updates —</span>
            )}
          </div>
        </div>

        {/* Sidebar Recommended */}
        <aside className="hidden lg:block">
           <div className="bg-[#16191f]/40 p-8 rounded-[40px] border border-white/5 sticky top-8">
              <h2 className="text-lg font-black mb-8 flex items-center space-x-3 uppercase">
                 <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center">
                    <i className="fa-solid fa-fire text-sm text-white"></i>
                 </div>
                 <span>Hot Now</span>
              </h2>
              <div className="space-y-6">
                {popular.slice(1, 7).map((anime, idx) => (
                  <Link to={`/anime/${encodeURIComponent(anime.id)}`} key={`${anime.id}-${idx}`} className="flex items-center space-x-4 group">
                    <img src={anime.poster} className="w-16 h-20 rounded-xl object-cover border border-white/10" alt="" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black line-clamp-2 group-hover:text-red-500 transition-colors uppercase">{anime.title}</h4>
                      {anime.score && <span className="text-[10px] text-yellow-500 font-black mt-2 inline-block">★ {anime.score}</span>}
                    </div>
                  </Link>
                ))}
              </div>
           </div>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
