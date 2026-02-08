
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchAnime } from '../services/animeApi.ts';
import { Anime } from '../types.ts';

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(queryParam);
  const [results, setResults] = useState<Anime[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
      setQuery(queryParam);
    }
  }, [queryParam]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query }); // Update URL
    }
  };

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn">
      <div className="max-w-3xl mx-auto pt-10 pb-6 text-center">
         <h1 className="text-3xl font-black mb-6 text-white uppercase tracking-tighter">
            Cari Anime <span className="text-red-600">Favoritmu</span>
         </h1>
         <form onSubmit={handleSearch} className="relative group">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ketik judul anime..." 
              className="w-full bg-[#16191f] border border-[#272a31] rounded-2xl py-5 pl-6 pr-32 text-white placeholder-gray-600 focus:outline-none focus:border-red-600 transition-all shadow-xl"
            />
            <button 
              type="submit" 
              className="absolute right-2 top-2 bottom-2 bg-red-600 hover:bg-red-700 text-white px-8 rounded-xl font-bold transition-all uppercase text-xs tracking-widest"
            >
               Cari
            </button>
         </form>
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
              {results.map(anime => (
                <Link to={`/anime/${anime.id}`} key={anime.id} className="group block space-y-3">
                  <div className="relative aspect-[3/4.5] rounded-2xl overflow-hidden bg-[#16191f] border border-white/5 shadow-lg">
                    <img 
                      src={anime.poster} 
                      alt={anime.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-white line-clamp-2 group-hover:text-red-500 transition-colors uppercase tracking-tight">{anime.title}</h3>
                    <p className="text-[10px] text-gray-500 mt-1">{anime.score}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SearchPage;
