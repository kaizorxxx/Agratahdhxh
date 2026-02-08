
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchOngoing, fetchCompleted, fetchMovies } from '../services/animeApi.ts';
import { Anime } from '../types.ts';

const DiscoveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'movies'>('ongoing');
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        let data: Anime[] = [];
        if (activeTab === 'ongoing') data = await fetchOngoing();
        else if (activeTab === 'completed') data = await fetchCompleted();
        else if (activeTab === 'movies') data = await fetchMovies();
        setAnimes(data || []);
      } catch (e) {
        console.error("Discovery loading error:", e);
        setAnimes([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [activeTab]);

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">Discovery</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Jelajahi ribuan judul anime terbaik</p>
        </div>
        
        <div className="flex bg-[#16191f] p-1.5 rounded-2xl border border-[#272a31]">
          {[
            { id: 'ongoing', label: 'Ongoing', icon: 'fa-play' },
            { id: 'completed', label: 'Tamat', icon: 'fa-check-double' },
            { id: 'movies', label: 'Movies', icon: 'fa-film' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-xs font-black uppercase transition-all ${
                activeTab === tab.id ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:text-white'
              }`}
            >
              <i className={`fa-solid ${tab.icon}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Memuat Katalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {animes && animes.length > 0 ? animes.map(anime => (
            <Link to={`/anime/${anime.id}`} key={anime.id} className="group block space-y-3">
              <div className="relative aspect-[3/4.5] rounded-[24px] overflow-hidden bg-[#16191f] border border-white/5 shadow-lg transform-gpu">
                <img 
                  src={anime.poster} 
                  alt={anime.title} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out" 
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x450?text=Poster+Error';
                  }}
                />
                
                {/* Stabilized Rating Badge - Left Aligned & No Transform Centering */}
                {anime.score && (
                  <div className="absolute top-3 left-3 z-20 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-lg text-[9px] font-black text-yellow-500 flex items-center space-x-1 border border-white/10 pointer-events-none">
                    <i className="fa-solid fa-star text-[7px]"></i>
                    <span>{anime.score}</span>
                  </div>
                )}
                
                {anime.status && (
                   <div className="absolute bottom-3 left-3 bg-red-600 px-2 py-0.5 rounded text-[8px] font-black text-white uppercase tracking-tighter z-10">
                      {anime.status}
                   </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 z-10">
                   <div className="w-full py-2 bg-white rounded-lg text-center text-[10px] font-black text-black uppercase tracking-widest">Tonton</div>
                </div>
              </div>
              <h3 className="font-bold text-xs line-clamp-2 group-hover:text-red-500 transition-colors uppercase tracking-tight">{anime.title}</h3>
            </Link>
          )) : (
            <div className="col-span-full py-20 text-center space-y-4">
               <i className="fa-solid fa-face-frown text-5xl text-gray-700"></i>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Tidak ada data ditemukan.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
