
import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { searchAnime, getAnimeSlug } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import AnimeCard from '../components/AnimeCard.tsx';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const navigate = useNavigate();
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // New features state
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Anime[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Load Recent Searches
  useEffect(() => {
    const saved = localStorage.getItem('anime_x_recent_searches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Sync state with URL
  useEffect(() => {
    if (queryParam !== query) {
      setQuery(queryParam);
    }
  }, [queryParam]);

  // Main Search (Debounced URL update)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query !== queryParam) {
        if (query.trim()) {
           setSearchParams({ q: query }, { replace: true });
           addToRecent(query);
        } else if (queryParam) {
           setSearchParams({}, { replace: true });
        }
      }
    }, 800); // Increased debounce for main search to allow typing
    return () => clearTimeout(timeoutId);
  }, [query, queryParam, setSearchParams]);

  // Perform Main Search
  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    } else {
      setResults([]);
      setHasSearched(false);
    }
  }, [queryParam]);

  // Live Suggestions Fetch
  useEffect(() => {
    if (query.trim().length > 2 && isFocused) {
      const fetchSuggestions = async () => {
        setSuggestionsLoading(true);
        try {
          const data = await searchAnime(query.trim(), 1);
          setSuggestions(data.slice(0, 5)); // Limit to 5 suggestions
        } catch (e) {
          setSuggestions([]);
        } finally {
          setSuggestionsLoading(false);
        }
      };
      
      const debounce = setTimeout(fetchSuggestions, 300);
      return () => clearTimeout(debounce);
    } else {
      setSuggestions([]);
    }
  }, [query, isFocused]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchTerm: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchAnime(searchTerm);
      setResults(data);
    } catch (e) {
      console.error(e);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const addToRecent = (term: string) => {
    if (!term.trim()) return;
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 8); // Keep last 8
      localStorage.setItem('anime_x_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(t => t !== term);
      localStorage.setItem('anime_x_recent_searches', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setRecentSearches([]);
    localStorage.removeItem('anime_x_recent_searches');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsFocused(false);
    if (query.trim() && query !== queryParam) {
      setSearchParams({ q: query });
      addToRecent(query);
    }
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    setSearchParams({ q: term });
    setIsFocused(false);
    addToRecent(term);
  };

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn min-h-screen">
      <div className="max-w-3xl mx-auto pt-10 pb-6">
         <div className="text-center mb-8">
            <h1 className="text-3xl font-black mb-2 text-white uppercase tracking-tighter">
                Cari Anime <span className="text-red-600">Favoritmu</span>
            </h1>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">
                Explore Unlimited Collection
            </p>
         </div>

         <div className="relative group z-50" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                    <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-gray-500"></i>
                    <input 
                      type="text" 
                      value={query}
                      onFocus={() => setIsFocused(true)}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ketik judul anime (e.g., One Piece)..." 
                      className={`w-full bg-[#16191f] border rounded-2xl py-5 pl-14 pr-32 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all shadow-xl ${isFocused ? 'border-red-600 rounded-b-none' : 'border-[#272a31]'}`}
                    />
                    {query && (
                        <button 
                            type="button"
                            onClick={() => { setQuery(''); setIsFocused(true); }}
                            className="absolute right-24 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-2"
                        >
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    )}
                    <button 
                      type="submit" 
                      className="absolute right-2 top-2 bottom-2 bg-red-600 hover:bg-red-700 text-white px-8 rounded-xl font-bold transition-all uppercase text-xs tracking-widest"
                    >
                       Cari
                    </button>
                </div>
            </form>

            {/* Dropdown Suggestions & History */}
            {isFocused && (
                <div className="absolute top-full left-0 right-0 bg-[#16191f] border border-t-0 border-[#272a31] rounded-b-2xl shadow-2xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
                    
                    {/* Live Suggestions */}
                    {query.length > 2 && (
                        <div className="border-b border-white/5 pb-2">
                             <div className="px-6 py-3 flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                    {suggestionsLoading ? 'Mencari...' : 'Saran Pencarian'}
                                </span>
                             </div>
                             
                             {suggestions.map((anime) => (
                                 <Link 
                                    key={anime.id}
                                    to={`/anime/${getAnimeSlug(anime.id)}`}
                                    onClick={() => { addToRecent(query); setIsFocused(false); }}
                                    className="flex items-center space-x-4 px-6 py-3 hover:bg-white/5 transition-colors group"
                                 >
                                    <img src={anime.poster} className="w-10 h-14 object-cover rounded-md border border-white/10 group-hover:border-red-600 transition-colors" alt="" />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-white group-hover:text-red-500 truncate transition-colors">{anime.title}</h4>
                                        <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1">
                                            <span className="uppercase">{anime.status || 'Anime'}</span>
                                            {anime.score && <span className="text-yellow-500">★ {anime.score}</span>}
                                        </div>
                                    </div>
                                    <i className="fa-solid fa-chevron-right text-xs text-gray-600 group-hover:text-white"></i>
                                 </Link>
                             ))}
                             
                             {!suggestionsLoading && suggestions.length === 0 && (
                                <div className="px-6 py-4 text-center text-xs text-gray-500 italic">
                                    Tidak ada saran yang cocok.
                                </div>
                             )}
                        </div>
                    )}

                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                        <div className="p-6 bg-black/20">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-black uppercase text-gray-400 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left"></i>
                                    Riwayat Pencarian
                                </h3>
                                <button onClick={clearHistory} className="text-[10px] text-red-500 hover:text-red-400 font-bold uppercase underline">
                                    Hapus Semua
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentSearches.map((term, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => handleRecentClick(term)}
                                        className="group flex items-center space-x-2 bg-[#272a31] hover:bg-red-600 border border-transparent hover:border-red-500 rounded-full pl-4 pr-2 py-1.5 cursor-pointer transition-all"
                                    >
                                        <span className="text-xs font-bold text-gray-300 group-hover:text-white max-w-[150px] truncate">{term}</span>
                                        <button 
                                            onClick={(e) => removeRecent(term, e)}
                                            className="w-5 h-5 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors"
                                        >
                                            <i className="fa-solid fa-xmark text-[8px]"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
         </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-6">
           <div className="relative">
             <div className="w-20 h-20 border-4 border-red-600/30 border-t-red-600 rounded-full animate-spin"></div>
             <div className="absolute inset-0 flex items-center justify-center">
                <i className="fa-solid fa-magnifying-glass text-red-600 text-xl animate-pulse"></i>
             </div>
           </div>
           <p className="text-gray-400 text-xs font-black uppercase tracking-[0.3em] animate-pulse">Mencari Data Anime...</p>
        </div>
      ) : (
        <>
          {hasSearched && results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 bg-[#16191f]/50 rounded-[40px] border border-dashed border-[#272a31] m-4">
               <div className="text-7xl mb-2 text-gray-700 animate-bounce cursor-default select-none">
                  (O_O;)
               </div>
               <div className="space-y-2">
                 <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                   Oops! Tidak Ada Hasil
                 </h3>
                 <p className="text-gray-500 font-bold text-xs uppercase tracking-widest max-w-md mx-auto leading-relaxed">
                   Maaf, kami tidak dapat menemukan anime dengan kata kunci <span className="text-red-500">"{queryParam}"</span>.
                   <br/>Coba gunakan judul bahasa Inggris atau Jepang.
                 </p>
               </div>
               <div className="flex gap-4">
                  <button onClick={() => { setQuery(''); setSearchParams({}); }} className="px-6 py-2.5 rounded-xl border border-[#272a31] text-gray-400 hover:text-white hover:border-white font-bold text-xs uppercase tracking-wider transition-all">
                    Reset
                  </button>
                  <Link to="/discovery" className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black uppercase text-xs tracking-wider transition-all shadow-lg shadow-red-600/20">
                    Browse Catalog
                  </Link>
               </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((anime, idx) => (
                <AnimeCard key={`${anime.id}-${idx}`} anime={anime} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;
