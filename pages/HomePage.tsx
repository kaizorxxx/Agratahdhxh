
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchLatest, fetchRecommended } from '../services/animeApi.ts';
import { getHistory } from '../services/historyService.ts';
import { Anime, Banner, HistoryItem } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

const HomePage: React.FC = () => {
  const [popular, setPopular] = useState<Anime[]>([]); // Recommended
  const [recent, setRecent] = useState<Anime[]>([]); // Latest
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Infinity Scroll State
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const navigate = useNavigate();

  // Initial Load
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true);
      try {
        const [popData, recData] = await Promise.all([
          fetchRecommended(),
          fetchLatest(1)
        ]);
        setPopular(popData || []);
        setRecent(recData || []);
        
        const historyData = getHistory();
        setHistory(historyData);
      } catch (e) {
        console.error("Home loading error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadInitialData();
  }, []);

  // Infinity Scroll Handler
  const handleScroll = useCallback(async () => {
    const scrollContainer = document.getElementById('scrollable-content');
    if (!scrollContainer) return;

    const { scrollTop, clientHeight, scrollHeight } = scrollContainer;
    
    // Jika scroll sudah mendekati bawah (100px threshold)
    if (scrollHeight - scrollTop <= clientHeight + 100) {
      if (!isFetchingMore && hasMore) {
        setIsFetchingMore(true);
        const nextPage = page + 1;
        try {
          const moreData = await fetchLatest(nextPage);
          if (moreData.length > 0) {
            setRecent(prev => [...prev, ...moreData]);
            setPage(nextPage);
          } else {
            setHasMore(false);
          }
        } catch (e) {
          console.error("Failed to load more", e);
        } finally {
          setIsFetchingMore(false);
        }
      }
    }
  }, [page, hasMore, isFetchingMore]);

  useEffect(() => {
    const scrollContainer = document.getElementById('scrollable-content');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading && recent.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
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
            className="w-full bg-[#16191f] border border-[#272a31] rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-red-600 transition-all shadow-inner"
           />
           <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
        </form>
      </div>

      {/* Hero / Popular Section */}
      {popular && popular.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-tighter">
            Popular
            <span className="ml-3 px-2 py-0.5 bg-red-600 text-[10px] uppercase rounded-sm font-black tracking-tighter">Hot</span>
          </h2>
          <div className="relative h-[480px] rounded-[40px] overflow-hidden group shadow-2xl border border-white/5">
            <img 
              src={popular[0].poster} 
              alt={popular[0].title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000"
              onError={(e) => (e.target as HTMLImageElement).src = 'https://via.placeholder.com/1200x480?text=Banner+Error'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-transparent"></div>
            <div className="absolute bottom-12 left-12 max-w-2xl space-y-4">
              <h1 className="text-6xl font-black text-white tracking-tighter line-clamp-2 drop-shadow-2xl uppercase italic">{popular[0].title}</h1>
              <div className="flex items-center space-x-6">
                 <div className="flex items-center space-x-2 text-yellow-500 font-black">
                    <i className="fa-solid fa-star"></i>
                    <span>{popular[0].score || 'N/A'}</span>
                 </div>
                 <span className="text-gray-300 font-bold uppercase tracking-widest text-xs">Recommended</span>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <Link to={`/anime/${popular[0].id}`} className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-[20px] font-black transition-all flex items-center space-x-3 shadow-2xl shadow-red-600/40 group/btn">
                  <i className="fa-solid fa-play text-xl transition-transform group-hover/btn:scale-125"></i>
                  <span className="tracking-widest text-sm">WATCH NOW</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Continue Watching Section */}
      {history.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
             <h2 className="text-xl font-bold flex items-center space-x-2 uppercase tracking-tighter">
                <i className="fa-solid fa-clock-rotate-left text-red-600"></i>
                <span>Continue Watching</span>
             </h2>
          </div>
          <div className="flex space-x-6 overflow-x-auto pb-6 custom-scrollbar snap-x">
             {history.map((item) => {
                const progress = item.duration ? (item.timestamp / item.duration) * 100 : 0;
                return (
                  <Link to={`/watch/${item.anime_id}/${item.ep_id}`} key={item.id} className="min-w-[240px] snap-start group relative">
                     <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#16191f] border border-white/5 shadow-lg">
                        <img src={item.anime_poster} alt={item.anime_title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-transparent transition-colors flex items-center justify-center">
                           <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300 shadow-xl">
                              <i className="fa-solid fa-play ml-1"></i>
                           </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                           <div className="h-full bg-red-600" style={{ width: `${progress}%` }}></div>
                        </div>
                     </div>
                     <div className="mt-3">
                        <h4 className="text-xs font-black truncate uppercase tracking-tight">{item.anime_title}</h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-1">{item.ep_title}</p>
                     </div>
                  </Link>
                );
             })}
          </div>
        </section>
      )}

      {/* Main Content: Latest Updates (Infinite Scroll) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-2xl font-black tracking-tight uppercase italic">Latest Updates</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {recent.map((anime, idx) => (
              <Link to={`/anime/${anime.id}`} key={`${anime.id}-${idx}`} className="group block space-y-4">
                <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden bg-[#16191f] shadow-lg border border-white/5">
                  <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  
                  {/* Score di bagian atas thumbnail */}
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-2 py-1 rounded-lg text-[10px] font-black text-yellow-500 flex items-center space-x-1 border border-white/10 z-10">
                    <i className="fa-solid fa-star text-[8px]"></i>
                    <span>{anime.score || 'N/A'}</span>
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-2 group-hover:text-red-500 transition-colors uppercase tracking-tight">{anime.title}</h3>
                  <p className="text-[10px] text-gray-500 mt-1">{anime.status}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Loading Indicator for Infinite Scroll */}
          {isFetchingMore && (
             <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          )}
          
          {!hasMore && (
             <div className="text-center py-8 text-gray-500 text-xs font-bold uppercase tracking-widest">
                End of list
             </div>
          )}
        </div>

        {/* Sidebar Popular List */}
        <aside className="space-y-12 hidden lg:block">
           <section className="bg-[#16191f]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-md sticky top-8">
              <h2 className="text-lg font-black mb-8 flex items-center space-x-3 uppercase tracking-tighter">
                 <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <i className="fa-solid fa-bolt text-sm text-white"></i>
                 </div>
                 <span>Recommended</span>
              </h2>
              <div className="space-y-6">
                {popular.slice(1, 6).map((anime, idx) => (
                  <Link to={`/anime/${anime.id}`} key={idx} className="flex items-center space-x-4 group">
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800 border border-white/10 shadow-lg">
                      <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black line-clamp-2 group-hover:text-red-500 transition-colors uppercase tracking-tighter">{anime.title}</h4>
                      <div className="flex items-center space-x-2 mt-2">
                         <div className="flex items-center space-x-1 text-[9px] text-yellow-500 font-black">
                            <i className="fa-solid fa-star"></i>
                            <span>{anime.score}</span>
                         </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
           </section>
        </aside>
      </div>
    </div>
  );
};

export default HomePage;
