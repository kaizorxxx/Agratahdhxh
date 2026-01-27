
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTrending, fetchRecent } from '../services/animeApi';
import { Anime, Banner } from '../types';
import { supabase } from '../supabaseClient';

const HomePage: React.FC = () => {
  const [trending, setTrending] = useState<Anime[]>([]);
  const [recent, setRecent] = useState<Anime[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Fetch Anime Data
    fetchTrending().then(data => setTrending(data || []));
    fetchRecent().then(data => setRecent(data || []));
    
    // 2. Fetch Active Banners from Supabase with safety
    const getBanners = async () => {
      try {
        const { data, error } = await supabase.from('banners').select('*').eq('is_active', true);
        if (data && !error) setBanners(data);
      } catch (e) {
        console.debug("Supabase Banners not available");
      }
    };
    getBanners();

    // 3. Fetch Watch History from Supabase with safety
    const getHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from('history')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(3);
          if (data && !error) setHistory(data);
        }
      } catch (e) {
        console.debug("Supabase History not available");
      }
    };
    getHistory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="px-8 pb-12 space-y-12">
      <div className="flex justify-end mb-4">
        <form onSubmit={handleSearch} className="relative w-full max-w-md">
           <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anime..." 
            className="w-full bg-[#16191f] border border-[#272a31] rounded-full py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 transition-all"
           />
           <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-gray-500"></i>
        </form>
      </div>

      <section>
        <h2 className="text-xl font-bold mb-6 flex items-center">
          Featured
          <span className="ml-3 px-2 py-0.5 bg-red-600 text-[10px] uppercase rounded-sm">Premium</span>
        </h2>
        {banners.length > 0 ? (
          <div className="relative h-[450px] rounded-3xl overflow-hidden group">
            <img src={banners[0].image_url} alt="Featured" className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-90"></div>
            <div className="absolute bottom-10 left-10 max-w-lg space-y-4">
              <h1 className="text-5xl font-extrabold text-white tracking-tight">Stream Unlimited</h1>
              <p className="text-gray-400 text-sm italic">Access thousands of episodes in high definition.</p>
              <div className="flex items-center space-x-4 pt-4">
                <a href={banners[0].link} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 shadow-lg shadow-red-600/20">
                  <i className="fa-solid fa-rocket"></i>
                  <span>Explore Now</span>
                </a>
              </div>
            </div>
          </div>
        ) : trending[0] ? (
          <div className="relative h-[450px] rounded-3xl overflow-hidden group">
            <img src={trending[0].poster} alt={trending[0].title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] via-transparent to-transparent opacity-90"></div>
            <div className="absolute bottom-10 left-10 max-w-lg space-y-4">
              <h1 className="text-5xl font-extrabold text-white tracking-tight">{trending[0].title}</h1>
              <p className="text-gray-400 text-sm">{trending[0].genres?.join(', ')}</p>
              <div className="flex items-center space-x-4 pt-4">
                <Link to={`/anime/${trending[0].id}`} className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center space-x-2 shadow-lg shadow-red-600/20">
                  <i className="fa-solid fa-play"></i>
                  <span>Watch Now</span>
                </Link>
                <button className="bg-gray-800/80 hover:bg-gray-700 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all backdrop-blur-md">
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[450px] bg-[#16191f] rounded-3xl animate-pulse"></div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <div className="flex justify-between items-end mb-6">
            <h2 className="text-xl font-bold">Continue Watching</h2>
            <Link to="/collection" className="text-sm text-gray-500 hover:text-red-500 transition-colors">See all</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {history.map(item => (
              <div key={item.id} className="group relative bg-[#16191f] rounded-2xl overflow-hidden border border-[#272a31] hover:border-red-600/50 transition-all">
                <div className="relative h-48">
                  <img src={item.anime_poster} alt={item.anime_title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white uppercase">{item.ep_title}</div>
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                     <Link to={`/watch/${item.anime_id}/${item.ep_id}`} className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white text-xl">
                        <i className="fa-solid fa-play ml-1"></i>
                     </Link>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <h3 className="font-bold text-sm truncate">{item.anime_title}</h3>
                  <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                     <div className="bg-red-600 h-full" style={{ width: `${(item.timestamp / item.duration) * 100 || 0}%` }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <div className="lg:col-span-3">
          <div className="flex justify-between items-end mb-8">
             <h2 className="text-xl font-bold">Recently Updated</h2>
             <Link to="/discovery" className="text-sm text-gray-500 hover:text-red-500 transition-colors">See all</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
            {recent.length > 0 ? recent.map(anime => (
              <Link to={`/anime/${anime.id}`} key={anime.id} className="group block space-y-3">
                <div className="relative aspect-[3/4.5] rounded-2xl overflow-hidden bg-[#16191f]">
                  <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-yellow-500 flex items-center space-x-1">
                    <i className="fa-solid fa-star text-[8px]"></i>
                    <span>{anime.score || '0.0'}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                </div>
                <div>
                  <h3 className="font-bold text-sm line-clamp-1 group-hover:text-red-500 transition-colors">{anime.title}</h3>
                  <p className="text-[10px] text-gray-500 truncate">{anime.genres?.slice(0, 2).join(', ')}</p>
                </div>
              </Link>
            )) : Array.from({length: 8}).map((_, i) => (
              <div key={i} className="aspect-[3/4.5] bg-[#16191f] rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>

        <aside className="space-y-12">
           <section>
              <h2 className="text-lg font-bold mb-6 flex items-center space-x-2">
                 <i className="fa-solid fa-chart-line text-red-600"></i>
                 <span>Popular Right Now</span>
              </h2>
              <div className="space-y-6">
                {trending.slice(0, 5).map((anime, idx) => (
                  <Link to={`/anime/${anime.id}`} key={idx} className="flex items-center space-x-4 group">
                    <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-800">
                      <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate group-hover:text-red-500 transition-colors">{anime.title}</h4>
                      <div className="flex items-center space-x-2">
                         <span className="text-[10px] text-gray-500">{anime.genres?.[0]}</span>
                         <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                         <div className="flex items-center space-x-1 text-[10px] text-yellow-500">
                            <i className="fa-solid fa-star"></i>
                            <span>{anime.score || '0.0'}</span>
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
