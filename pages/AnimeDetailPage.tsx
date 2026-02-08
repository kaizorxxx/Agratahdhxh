
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail, getAnimeSlug } from '../services/animeApi.ts';
import { Anime } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

const AnimeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  // Decode ID dari URL
  const rawId = id ? decodeURIComponent(id) : '';
  // Bersihkan ID jika yang diklik adalah link episode
  const cleanId = getAnimeSlug(rawId);
  
  const [anime, setAnime] = useState<Anime | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (cleanId) {
      setLoading(true);
      fetchAnimeDetail(cleanId).then(data => {
        setAnime(data);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });

      const checkBookmark = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const { data } = await supabase
              .from('bookmarks')
              .select('*')
              .eq('user_id', user.id)
              .eq('anime_id', cleanId)
              .single();
            if (data) setIsBookmarked(true);
          }
        } catch (e) {}
      };
      checkBookmark();
    }
  }, [cleanId]);

  const handleToggleBookmark = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to save favorites.");
        return;
      }
      setSaving(true);
      if (isBookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', user.id).eq('anime_id', cleanId);
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
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!anime) return <div className="text-center py-20 uppercase font-black">Anime Not Found</div>;

  return (
    <div className="px-8 pb-12">
      <div className="relative h-[400px] -mx-8 overflow-hidden">
        <img src={anime.poster} alt="" className="w-full h-full object-cover blur-3xl opacity-20 scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f1115] to-transparent"></div>
      </div>

      <div className="relative -mt-60 flex flex-col md:flex-row gap-10">
        <div className="w-64 flex-shrink-0">
          <div className="rounded-3xl overflow-hidden shadow-2xl border border-white/10">
             <img src={anime.poster} alt="" className="w-full" />
          </div>
          <div className="mt-8 space-y-4">
             <button 
              onClick={handleToggleBookmark}
              disabled={saving}
              className={`w-full py-4 font-bold rounded-2xl flex items-center justify-center space-x-2 transition-all ${
                isBookmarked ? 'bg-green-600' : 'bg-red-600 hover:bg-red-700 shadow-xl shadow-red-600/20'
              }`}
             >
                <i className={`fa-solid ${isBookmarked ? 'fa-check' : 'fa-bookmark'}`}></i>
                <span>{isBookmarked ? 'Saved' : 'Add to List'}</span>
             </button>
             
             <div className="bg-[#16191f] p-6 rounded-2xl border border-[#272a31] space-y-4 text-xs">
                <div><p className="text-gray-500 uppercase font-black mb-1">Status</p><p className="font-bold">{anime.status || '-'}</p></div>
                <div><p className="text-gray-500 uppercase font-black mb-1">Studio</p><p className="font-bold text-red-500">{anime.studio || '-'}</p></div>
                <div><p className="text-gray-500 uppercase font-black mb-1">Release</p><p className="font-bold">{anime.release_date || '-'}</p></div>
                <div><p className="text-gray-500 uppercase font-black mb-1">Score</p><p className="font-bold text-yellow-500">★ {anime.score}</p></div>
             </div>
          </div>
        </div>

        <div className="flex-1 space-y-8">
           <div>
              <nav className="flex items-center space-x-2 text-[10px] text-gray-500 uppercase mb-4">
                <Link to="/" className="hover:text-white">Home</Link>
                <i className="fa-solid fa-chevron-right text-[8px]"></i>
                <span className="text-gray-300">{anime.title}</span>
              </nav>
              <h1 className="text-5xl font-black text-white leading-none uppercase italic mb-6">{anime.title}</h1>
              <div className="flex flex-wrap gap-2">
                 {anime.genres?.map(genre => (
                   <span key={genre} className="px-4 py-1.5 bg-[#16191f] border border-[#272a31] rounded-full text-[10px] font-black uppercase text-gray-400">
                     {genre}
                   </span>
                 ))}
              </div>
           </div>

           <div className="bg-[#16191f]/50 p-8 rounded-[32px] border border-[#272a31]">
              <h3 className="text-sm font-black mb-4 uppercase flex items-center space-x-2 text-red-600">
                 <i className="fa-solid fa-circle-info"></i>
                 <span>Synopsis</span>
              </h3>
              <p className="text-gray-400 leading-relaxed text-sm whitespace-pre-line">{anime.description}</p>
           </div>

           <div>
              <h3 className="text-xl font-black mb-6 uppercase flex items-center space-x-2">
                <i className="fa-solid fa-layer-group text-red-600"></i>
                <span>Episodes</span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {anime.episodes?.map(ep => (
                  <Link 
                    to={`/watch/${encodeURIComponent(cleanId)}/${encodeURIComponent(ep.id)}`} 
                    key={ep.id} 
                    className="flex items-center justify-between p-4 bg-[#16191f] border border-[#272a31] rounded-xl hover:border-red-600 transition-all group"
                  >
                    <span className="font-bold text-xs truncate group-hover:text-white">{ep.title}</span>
                    <i className="fa-solid fa-play text-[8px] opacity-0 group-hover:opacity-100 text-red-600 transition-all"></i>
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
