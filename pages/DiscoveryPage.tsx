
import React, { useEffect, useState } from 'react';
import { fetchOngoing, fetchCompleted, fetchMovies, searchAnime } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import AnimeCard from '../components/AnimeCard.tsx';

const DiscoveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'movies' | 'ecchi' | 'hentai'>('ongoing');
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(true);

  // Trigger verification listener
  const checkAdultVerification = () => {
    const isVerified = localStorage.getItem('genzuro_adult_verified');
    if (!isVerified) {
        window.dispatchEvent(new Event('trigger-18-check'));
        return false;
    }
    return true;
  };

  const handleTabChange = (tab: typeof activeTab) => {
    if (tab === 'ecchi' || tab === 'hentai') {
        const authorized = checkAdultVerification();
        if (!authorized) return; // Stop if not verified
    }
    setActiveTab(tab);
  };

  // Listen for verification success to retry
  useEffect(() => {
    const onVerified = () => {
        // Automatically switch to ecchi if that was the intent, or just stay on current
        // For simplicity, user can click again.
    };
    window.addEventListener('18-verified', onVerified);
    return () => window.removeEventListener('18-verified', onVerified);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setAnimes([]); // Clear prev data
      try {
        let data: Anime[] = [];
        if (activeTab === 'ongoing') data = await fetchOngoing();
        else if (activeTab === 'completed') data = await fetchCompleted();
        else if (activeTab === 'movies') data = await fetchMovies();
        else if (activeTab === 'ecchi') {
             // Mock search for Ecchi using search API
             data = await searchAnime('ecchi');
        } else if (activeTab === 'hentai') {
             // Mock search for Hentai using search API
             data = await searchAnime('hentai');
        }
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
    <div className="px-6 md:px-12 pb-12 pt-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white">Discovery</h1>
          <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Explore Entire Catalog</p>
        </div>
        
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
          {[
            { id: 'ongoing', label: 'Ongoing', icon: 'fa-play' },
            { id: 'completed', label: 'Completed', icon: 'fa-check-double' },
            { id: 'movies', label: 'Movies', icon: 'fa-film' },
            { id: 'ecchi', label: 'Ecchi (18+)', icon: 'fa-heart', danger: true },
            { id: 'hentai', label: 'Hentai (18+)', icon: 'fa-ban', danger: true }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-black uppercase transition-all border whitespace-nowrap ${
                activeTab === tab.id 
                ? (tab.danger ? 'bg-red-900 border-red-700 text-white' : 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30')
                : 'bg-[#111] border-[#333] text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              <i className={`fa-solid ${tab.icon} ${activeTab === tab.id ? '' : tab.danger ? 'text-red-500' : ''}`}></i>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-[40vh] space-y-4">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Loading Content...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
          {animes && animes.length > 0 ? animes.map((anime, idx) => (
            <AnimeCard key={`${anime.id}-${idx}`} anime={anime} />
          )) : (
            <div className="col-span-full py-20 text-center space-y-4">
               <i className="fa-solid fa-folder-open text-4xl text-gray-800"></i>
               <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No Data Found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
