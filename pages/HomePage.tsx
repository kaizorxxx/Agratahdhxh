
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTrending, fetchRecent, getSafePoster } from '../services/animeApi';
import { Anime, Banner } from '../types';
import { supabase } from '../supabaseClient';

const HomePage: React.FC = () => {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [recent, setRecent] = useState<Anime[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [trendingData, recentData] = await Promise.all([
        fetchTrending(),
        fetchRecent()
      ]);
      setTrending(trendingData);
      setRecent(recentData);
      setIsLoading(false);
    };
    
    loadData();
    
    const getBanners = async () => {
      try {
        const { data } = await supabase.from('banners').select('*').eq('is_active', true);
        if (data && data.length > 0) setBanners(data);
      } catch (e) {}
    };
    getBanners();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  if (isLoading && trending.length === 0) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-12 animate-fadeIn">
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

      {trending.length > 0 && (
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center uppercase tracking-tighter">
            Featured
            <span className="ml-3 px-2 py-0.5 bg-red-600 text-[10px] uppercase rounded-sm font-black tracking-tighter">Hot</span>
          </h2>
          <div className="relative h-[480px] rounded-[40px] overflow-hidden group shadow-2xl border border-white/5">
            <img src={trending[0].poster} alt={trending[0].title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-[#0f1115]/40 to-transparent"></div>
            <div className="absolute bottom-12 left-12 max-w-2xl space-y-4">
              <h1 className="text-6xl font-black text-white tracking-tighter line-clamp-2 drop-shadow-2xl uppercase italic">{trending[0].title}</h1>
              <div className="flex items-center space-x-6">
                 <div className="flex items-center space-x-2 text-yellow-500 font-black">
                    <i className="fa-solid fa-star"></i>
                    <span>{trending[0].score}</span>
                 </div>
                 <span className="text-gray-300 font-bold uppercase tracking-widest text-xs">{trending[0].genres?.join(' • ')}</span>
              </div>
              <div className="flex items-center space-x-4 pt-6">
                <Link to={`/anime/${trending[0].id}`} className="bg-red-600 hover:bg-red-700 text-white px-12 py-5 rounded-[20px] font-black transition-all flex items-center space-x-3 shadow-2xl shadow-red-600/40 group/btn">
                  <i className="fa-solid fa-play text-xl transition-transform group-hover/btn:scale-125"></i>
                  <span className="tracking-widest text-sm">WATCH NOW</span>
                </Link>
                <button className="bg-white/10 hover:bg-white/20 text-white w-16 h-16 rounded-[20px] flex items-center justify-center transition-all backdrop-blur-xl border border-white/10">
                  <i className="fa-solid fa-plus text-lg"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-2xl font-black tracking-tight uppercase italic">Baru Rilis</h2>
             <Link to="/discovery" className="text-[10px] text-gray-500 hover:text-red-500 font-black transition-colors uppercase tracking-widest">Lihat Semua</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {recent.map(anime => (
              <Link to={`/anime/${anime.id}`} key={anime.id} className="group block space-y-4">
                <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden bg-[#16191f] shadow-lg border border-white/5">
                  <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700" loading="lazy" />
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl px-2 py-1 rounded-lg text-[10px] font-black text-yellow-500 flex items-center space-x-1 border border-white/10">
                    <i className="fa-solid fa-star text-[8px]"></i>
                    <span>{anime.score}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <div className="w-full py-3 bg-red-600 rounded-xl text-center text-[10px] font-black text-white uppercase tracking-widest">Detail</div>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-red-500 transition-colors uppercase tracking-tight">{anime.title}</h3>
                  <p className="text-[10px] text-gray-500 truncate font-black uppercase tracking-widest mt-1 opacity-60">{anime.genres?.slice(0, 1).join(' / ')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <aside className="space-y-12">
           <section className="bg-[#16191f]/40 p-8 rounded-[40px] border border-white/5 backdrop-blur-md">
              <h2 className="text-lg font-black mb-8 flex items-center space-x-3 uppercase tracking-tighter">
                 <div className="w-10 h-10 bg-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20">
                    <i className="fa-solid fa-bolt text-sm text-white"></i>
                 </div>
                 <span>Populer</span>
              </h2>
              <div className="space-y-8">
                {trending.slice(1, 6).map((anime, idx) => (
                  <Link to={`/anime/${anime.id}`} key={idx} className="flex items-center space-x-5 group">
                    <div className="relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-800 border border-white/10 shadow-xl">
                      <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-black truncate group-hover:text-red-500 transition-colors uppercase tracking-tighter">{anime.title}</h4>
                      <div className="flex items-center space-x-2 mt-3">
                         <div className="flex items-center space-x-1 text-[9px] text-yellow-500 font-black">
                            <i className="fa-solid fa-star"></i>
                            <span>{anime.score}</span>
                         </div>
                         <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{anime.genres?.[0]}</span>
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
