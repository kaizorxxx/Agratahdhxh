
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchAnimeDetail(id).then(data => {
        setAnime(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });

      // Check if already bookmarked
      const checkBookmark = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('bookmarks')
              .select('*')
              .eq('user_id', user.id)
              .eq('anime_id', id)
              .single();
            if (data) setIsBookmarked(true);
          }
        } catch (e) {
          console.warn("Supabase check error:", e);
        }
      };
      checkBookmark();
    }
  }, [id]);

  const handleToggleBookmark = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to save favorites.");
        return;
      }

      setSaving(true);
      if (isBookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('anime_id', id);
        setIsBookmarked(false);
      } else if (anime) {
        await supabase.from('bookmarks').insert({
          user_id: user.id,
          anime_id: anime.id,
          anime_title: anime.title,
          anime_poster: anime.poster
        });
        setIsBookmarked(true);
      }
    } catch (e) {
      console.error("Bookmark operation failed:", e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!anime) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[50vh] space-y-4">
        <i className="fa-solid fa-triangle-exclamation text-4xl text-yellow-500"></i>
        <h2 className="text-xl font-bold">Anime Not Found</h2>
        <p className="text-gray-500">The requested content could not be loaded.</p>
        <Link to="/" className="px-6 py-2 bg-red-600 rounded-lg font-bold">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12">
      {/* Background Banner */}
      <div className="relative h-[400px] -mx-8 overflow-hidden">
        <img src={anime.poster} alt="" className="w-full h-full object-cover blur-2xl opacity-30 scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] to-transparent"></div>
      </div>

      <div className="relative -mt-60 flex flex-col md:flex-row gap-10">
        <div className="w-64 flex-shrink-0">
          <div className="rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10">
             <img src={anime.poster} alt={anime.title} className="w-full" />
          </div>
          <div className="mt-8 space-y-4">
             <button 
              onClick={handleToggleBookmark}
              disabled={saving}
              className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg ${
                isBookmarked 
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-green-600/20' 
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
              }`}
             >
                <i className={`fa-solid ${isBookmarked ? 'fa-check' : 'fa-bookmark'}`}></i>
                <span>{isBookmarked ? 'Saved to Favorites' : 'Save to Favorites'}</span>
             </button>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#16191f] p-4 rounded-2xl text-center border border-[#272a31]">
                   <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Score</p>
                   <p className="text-xl font-black text-yellow-500">{anime.score || '?'}</p>
                </div>
                <div className="bg-[#16191f] p-4 rounded-2xl text-center border border-[#272a31]">
                   <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Status</p>
                   <p className="text-sm font-bold text-white uppercase">{anime.status || 'N/A'}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="flex-1 space-y-8">
           <div>
              <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
                <Link to="/" className="hover:text-white">Home</Link>
                <i className="fa-solid fa-chevron-right text-[8px]"></i>
                <span className="text-gray-300">{anime.title}</span>
              </nav>
              <h1 className="text-5xl font-black text-white leading-tight mb-4">{anime.title}</h1>
              <div className="flex flex-wrap gap-2">
                 {anime.genres?.map(genre => (
                   <span key={genre} className="px-4 py-1.5 bg-[#16191f] border border-[#272a31] rounded-full text-[11px] font-bold text-gray-400 hover:text-white hover:border-red-600 transition-colors cursor-default">
                     {genre}
                   </span>
                 ))}
              </div>
           </div>

           <div className="max-w-2xl bg-[#16191f]/50 p-6 rounded-3xl border border-[#272a31]">
              <h3 className="text-lg font-bold mb-4 flex items-center space-x-2">
                 <i className="fa-solid fa-circle-info text-red-600"></i>
                 <span>Synopsis</span>
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                 {anime.description || 'No detailed description found.'}
              </p>
           </div>

           <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Episodes</h3>
                <span className="text-sm text-gray-500 font-medium">{anime.episodes?.length || 0} episodes</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {anime.episodes?.map(ep => (
                  <Link 
                    to={`/watch/${anime.id}/${ep.id}`} 
                    key={ep.id} 
                    className="flex items-center justify-between p-5 bg-[#16191f] border border-[#272a31] rounded-2xl hover:border-red-600 hover:bg-gray-800 transition-all group"
                  >
                    <div className="flex items-center space-x-4">
                       <div className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center text-gray-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                          <i className="fa-solid fa-play ml-1"></i>
                       </div>
                       <span className="font-bold text-sm text-gray-300 group-hover:text-white">{ep.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">HD</span>
                  </Link>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AnimeDetailPage;
