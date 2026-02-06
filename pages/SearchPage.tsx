
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { searchAnime } from '../services/animeApi.ts';
import { Anime } from '../types.ts';

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Anime[]>([]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      searchAnime(query).then(setResults);
    }
  };

  return (
    <div className="px-8 pb-12 space-y-12">
      <div className="max-w-2xl mx-auto py-10">
         <h1 className="text-4xl font-black mb-8 text-center">Find your next favorite <span className="text-red-600">Anime</span></h1>
         <form onSubmit={handleSearch} className="relative">
            <input 
              type="text" 
              value={query}
              // Fixed: replaced undefined 'setSearchQuery' with 'setQuery'
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Start typing title, genre or year..." 
              className="w-full bg-[#16191f] border border-[#272a31] rounded-2xl py-6 pl-14 pr-32 text-lg focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-600/10 transition-all shadow-2xl"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 text-xl"></i>
            <button 
              type="submit" 
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg"
            >
               Search
            </button>
         </form>
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {results.map(anime => (
            <Link to={`/anime/${anime.id}`} key={anime.id} className="group block space-y-3">
              <div className="relative aspect-[3/4.5] rounded-2xl overflow-hidden bg-[#16191f]">
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-yellow-500 flex items-center space-x-1">
                  <i className="fa-solid fa-star text-[8px]"></i>
                  <span>{anime.score}</span>
                </div>
              </div>
              <h3 className="font-bold text-xs line-clamp-2 group-hover:text-red-500 transition-colors">{anime.title}</h3>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
