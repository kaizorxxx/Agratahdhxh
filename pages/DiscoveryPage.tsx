import React, { useEffect, useState } from 'react';
import { fetchOngoing, fetchCompleted, fetchMovies, searchAnime } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import AnimeCard from '../components/AnimeCard.tsx';

const POPULAR_GENRES = [
  { id: 'Action', label: 'Action', icon: 'fa-shield-halved' },
  { id: 'Adventure', label: 'Adventure', icon: 'fa-compass' },
  { id: 'Comedy', label: 'Comedy', icon: 'fa-face-laugh-beam' },
  { id: 'Drama', label: 'Drama', icon: 'fa-masks-theater' },
  { id: 'Fantasy', label: 'Fantasy', icon: 'fa-wand-magic-sparkles' },
  { id: 'Romance', label: 'Romance', icon: 'fa-heart' },
  { id: 'Sci-Fi', label: 'Sci-Fi', icon: 'fa-rocket' },
  { id: 'Supernatural', label: 'Supernatural', icon: 'fa-ghost' },
  { id: 'Mystery', label: 'Mystery', icon: 'fa-magnifying-glass' },
  { id: 'Sports', label: 'Sports', icon: 'fa-volleyball' },
  { id: 'Slice of Life', label: 'Slice of Life', icon: 'fa-mug-hot' }
];

const DiscoveryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ongoing' | 'completed' | 'movies' | 'ecchi' | 'hentai' | 'genre'>('ongoing');
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  
  const [animes, setAnimes] = useState<Anime[]>([]);
  const [genreAnimes, setGenreAnimes] = useState<Anime[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [globalLoading, setGlobalLoading] = useState(false);

  // Trigger verification listener
  const checkAdultVerification = () => {
    const isVerified = localStorage.getItem('genzuro_adult_verified');
    if (!isVerified) {
        window.dispatchEvent(new Event('trigger-18-check'));
        return false;
    }
    return true;
  };

  const handleTabChange = (tab: Exclude<typeof activeTab, 'genre'>) => {
    if (tab === 'ecchi' || tab === 'hentai') {
        const authorized = checkAdultVerification();
        if (!authorized) return; // Stop if not verified
    }
    setActiveTab(tab);
    setSelectedGenre(null); // Reset local genre filter when moving back to category tabs
  };

  const handleGenreClick = (genreName: string) => {
    if (selectedGenre === genreName) {
      // Toggle off, back to unfiltered category
      setSelectedGenre(null);
      if (activeTab === 'genre') {
        setActiveTab('ongoing');
      }
    } else {
      setSelectedGenre(genreName);
    }
  };

  const enableGlobalGenreMode = () => {
    setActiveTab('genre');
  };

  // Listen for verification success
  useEffect(() => {
    const onVerified = () => {};
    window.addEventListener('18-verified', onVerified);
    return () => window.removeEventListener('18-verified', onVerified);
  }, []);

  // Fetch category-based list
  useEffect(() => {
    if (activeTab === 'genre') return;

    const loadData = async () => {
      setLoading(true);
      setAnimes([]); // Clear prev data
      try {
        let data: Anime[] = [];
        if (activeTab === 'ongoing') data = await fetchOngoing();
        else if (activeTab === 'completed') data = await fetchCompleted();
        else if (activeTab === 'movies') data = await fetchMovies();
        else if (activeTab === 'ecchi') {
             data = await searchAnime('ecchi');
        } else if (activeTab === 'hentai') {
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

  // Fetch global genre-specific search results
  useEffect(() => {
    if (activeTab !== 'genre' || !selectedGenre) return;

    const loadGlobalGenre = async () => {
      setGlobalLoading(true);
      setGenreAnimes([]);
      try {
        const data = await searchAnime(selectedGenre);
        setGenreAnimes(data || []);
      } catch (e) {
        console.error("Discovery global genre search error:", e);
        setGenreAnimes([]);
      } finally {
        setGlobalLoading(false);
      }
    };
    loadGlobalGenre();
  }, [activeTab, selectedGenre]);

  // Compute final elements to display
  const displayedAnimes = (() => {
    if (activeTab === 'genre') {
      return genreAnimes;
    }
    
    if (!selectedGenre) {
      return animes;
    }
    
    // Client-side sub-filtering
    return animes.filter((anime) => {
      if (!anime.genres || !Array.isArray(anime.genres)) return false;
      return anime.genres.some(
        (g) => g.toLowerCase().includes(selectedGenre.toLowerCase()) || 
               selectedGenre.toLowerCase().includes(g.toLowerCase())
      );
    });
  })();

  const isCurrentListFiltered = activeTab !== 'genre' && selectedGenre !== null;

  return (
    <div className="px-6 md:px-12 pb-12 pt-8 space-y-8 animate-fadeIn">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic text-white">Discovery</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Explore Entire Catalog</p>
          </div>
          {activeTab === 'genre' && selectedGenre && (
            <button 
              onClick={() => handleTabChange('ongoing')}
              className="self-start md:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-white/5 flex items-center gap-2"
            >
              <i className="fa-solid fa-arrow-left"></i> Kembali ke Kategori
            </button>
          )}
        </div>
        
        {/* Category Selection Tabs */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-wider">Kategori Utama</h3>
          <div className="flex flex-wrap gap-2 overflow-x-auto pb-2 hide-scrollbar">
            {[
              { id: 'ongoing', label: 'Ongoing', icon: 'fa-play' },
              { id: 'completed', label: 'Completed', icon: 'fa-check-double' },
              { id: 'movies', label: 'Movies', icon: 'fa-film' },
              { id: 'ecchi', label: 'Ecchi (18+)', icon: 'fa-heart', danger: true },
              { id: 'hentai', label: 'Hentai (18+)', icon: 'fa-ban', danger: true }
            ].map(tab => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as any)}
                  className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase transition-all border whitespace-nowrap cursor-pointer ${
                    isSelected 
                    ? (tab.danger ? 'bg-red-900 border-red-700 text-white shadow-lg shadow-red-900/30' : 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/30')
                    : 'bg-[#111] border-[#222] text-gray-400 hover:text-white hover:border-gray-500'
                  }`}
                >
                  <i className={`fa-solid ${tab.icon} ${isSelected ? '' : tab.danger ? 'text-red-500' : ''}`}></i>
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Genre Tags Filtering Bar */}
        <div className="space-y-3 bg-[#11141b]/90 border border-[#232731] rounded-3xl p-5 md:p-6">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-tags text-red-500 text-xs"></i>
            <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Pilih Genre</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
            <button
              onClick={() => {
                setSelectedGenre(null);
                if (activeTab === 'genre') {
                  setActiveTab('ongoing');
                }
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1.5 ${
                !selectedGenre
                ? 'bg-red-600 border-red-600 text-white'
                : 'bg-[#1a1d24] border-[#333b49] text-gray-400 hover:text-white hover:border-gray-500'
              }`}
            >
              Semua Genre
            </button>
            {POPULAR_GENRES.map(genre => {
              const isSelected = selectedGenre === genre.id;
              return (
                <button
                  key={genre.id}
                  onClick={() => handleGenreClick(genre.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border cursor-pointer flex items-center gap-2 group ${
                    isSelected
                    ? 'bg-red-600 border-red-600 text-white shadow-md shadow-red-600/20'
                    : 'bg-[#1a1d24] border-[#333b49] text-gray-300 hover:text-white hover:bg-neutral-800'
                  }`}
                >
                  <i className={`fa-solid ${genre.icon} text-[10px] ${isSelected ? 'text-white' : 'text-red-500 group-hover:scale-110 transition-transform'}`}></i>
                  <span>{genre.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Mode Information & Actions Banner */}
      {isCurrentListFiltered && (
        <div className="bg-red-950/20 border border-red-900/30 p-4 md:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-slideIn">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center border border-red-600/20">
              <i className="fa-solid fa-filter text-red-500 text-xs"></i>
            </div>
            <div>
              <p className="text-white text-xs font-black uppercase tracking-wider">
                Menyaring Berdasarkan: <span className="text-red-500">{selectedGenre}</span>
              </p>
              <p className="text-gray-400 text-[10px] uppercase font-bold mt-0.5">
                Mencari kecocokan di halaman aktif kategori &apos;{activeTab}&apos;
              </p>
            </div>
          </div>
          <button
            onClick={enableGlobalGenreMode}
            className="self-start sm:self-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 hover:scale-[1.02] cursor-pointer flex items-center gap-2"
          >
            <i className="fa-solid fa-earth-asia"></i> Cari Secara Global
          </button>
        </div>
      )}

      {/* Active Mode Heading Banner */}
      {activeTab === 'genre' && selectedGenre && (
        <div className="border-l-4 border-red-600 pl-4 py-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#ef4444] bg-[#ef4444]/10 px-2 py-0.5 rounded">Global Browser</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight italic mt-1">
            Menampilkan Semua Anime Bergenre &ldquo;{selectedGenre}&rdquo;
          </h2>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">Mencari di seluruh database server</p>
        </div>
      )}

      {/* Grid Display Area */}
      {loading || (activeTab === 'genre' && globalLoading) ? (
        <div className="flex flex-col items-center justify-center h-[45vh] space-y-4">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fa-solid fa-circle-notch text-xs text-gray-400 animate-pulse"></i>
            </div>
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 animate-pulse">Loading Content...</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-8">
            {displayedAnimes && displayedAnimes.length > 0 ? (
              displayedAnimes.map((anime, idx) => (
                <AnimeCard key={`${anime.id}-${activeTab}-${idx}`} anime={anime} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center space-y-5 bg-[#12141a]/40 border border-[#232731]/50 rounded-[32px]">
                 <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto border border-white/5">
                   <i className="fa-solid fa-ghost text-2xl text-gray-600"></i>
                 </div>
                 <div className="space-y-1">
                   <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Tidak Ada Anime Ditemukan</p>
                   <p className="text-gray-600 font-bold uppercase text-[10px] tracking-wider max-w-md mx-auto leading-relaxed">
                     Tidak ada anime yang cocok dengan kriteria filtering Anda saat ini di halaman tab ini.
                   </p>
                 </div>
                 {isCurrentListFiltered && (
                   <button
                     onClick={enableGlobalGenreMode}
                     className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-red-600/20 hover:scale-[1.02] cursor-pointer"
                   >
                     Coba Cari &ldquo;{selectedGenre}&rdquo; Secara Global
                   </button>
                 )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveryPage;
