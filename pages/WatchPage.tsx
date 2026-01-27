
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail } from '../services/animeApi';
import { Anime, Episode } from '../types';
import { supabase } from '../supabaseClient';

const WatchPage: React.FC = () => {
  const { animeId, epId } = useParams<{ animeId: string; epId: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedTime = useRef<number>(0);

  useEffect(() => {
    const loadData = async () => {
      if (!animeId) return;
      setLoading(true);
      try {
        const data = await fetchAnimeDetail(animeId);
        if (data) {
          setAnime(data);
          const targetEp = data.episodes?.find(e => e.id === epId) || data.episodes?.[0];
          setEpisode(targetEp || null);
        }
      } catch (err) {
        console.error("Load detail error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [animeId, epId]);

  useEffect(() => {
    const resumeProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && videoRef.current) {
          const { data } = await supabase
            .from('history')
            .select('timestamp')
            .eq('user_id', user.id)
            .eq('anime_id', animeId)
            .eq('ep_id', epId)
            .single();
          
          if (data?.timestamp && videoRef.current) {
            videoRef.current.currentTime = data.timestamp;
          }
        }
      } catch (e) {
        console.debug("No previous progress found");
      }
    };
    if (episode) resumeProgress();
  }, [episode, animeId, epId]);

  const saveProgress = async () => {
    if (!videoRef.current || !anime || !episode) return;
    const currentTime = videoRef.current.currentTime;
    if (Math.abs(currentTime - lastSavedTime.current) < 5) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      lastSavedTime.current = currentTime;
      
      await supabase.from('history').upsert({
        user_id: user.id,
        anime_id: anime.id,
        anime_title: anime.title,
        anime_poster: anime.poster,
        ep_id: episode.id,
        ep_title: episode.title,
        timestamp: Math.floor(currentTime),
        duration: Math.floor(videoRef.current.duration || 0),
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,anime_id,ep_id' });
    } catch (e) {
      console.error("History sync error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!anime || !episode) {
    return (
      <div className="p-12 text-center space-y-4">
        <i className="fa-solid fa-circle-exclamation text-4xl text-red-500"></i>
        <h2 className="text-xl font-bold">Episode Gagal Dimuat</h2>
        <Link to="/" className="inline-block px-6 py-2 bg-red-600 rounded-lg">Kembali ke Home</Link>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-8">
      <div className="flex items-center space-x-4">
         <Link to={`/anime/${animeId}`} className="w-10 h-10 bg-[#16191f] border border-[#272a31] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-colors">
            <i className="fa-solid fa-chevron-left"></i>
         </Link>
         <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{anime.title}</h1>
            <p className="text-sm text-gray-500">Sedang menonton: {episode.title}</p>
         </div>
      </div>

      <div className="relative aspect-video bg-black rounded-3xl overflow-hidden border border-[#272a31] shadow-2xl group">
        <video 
          key={episode.id}
          ref={videoRef}
          src={episode.link} 
          controls 
          onTimeUpdate={saveProgress}
          onPause={saveProgress}
          className="w-full h-full"
          poster={anime.poster}
        />
        <div className="absolute top-4 right-4 bg-red-600/90 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
           SINKRONISASI AKTIF
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#16191f] p-8 rounded-3xl border border-[#272a31] flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center space-x-6">
                  <div className="w-14 h-14 bg-red-600/10 text-red-500 rounded-2xl flex items-center justify-center text-2xl">
                     <i className="fa-solid fa-cloud-arrow-up"></i>
                  </div>
                  <div>
                     <h4 className="font-bold">Progress Tersimpan Otomatis</h4>
                     <p className="text-sm text-gray-500">Anda bisa melanjutkan menonton di perangkat apa saja.</p>
                  </div>
               </div>
               <div className="flex space-x-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-6 py-3 bg-[#272a31] hover:bg-gray-700 text-white rounded-xl font-bold transition-all text-sm">Download</button>
                  <Link 
                    to={anime.episodes && anime.episodes.findIndex(e => e.id === epId) < anime.episodes.length - 1 
                      ? `/watch/${animeId}/${anime.episodes[anime.episodes.findIndex(e => e.id === epId) + 1].id}` 
                      : '#'}
                    className="flex-1 md:flex-none px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all text-sm text-center shadow-lg shadow-red-600/20"
                  >
                    Episode Selanjutnya
                  </Link>
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="font-bold text-lg">Daftar Episode</h3>
               <span className="text-[10px] text-gray-500 font-bold uppercase">{anime.episodes?.length || 0} EP</span>
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {anime.episodes?.map(ep => (
                  <Link 
                    key={ep.id} 
                    to={`/watch/${animeId}/${ep.id}`}
                    className={`flex items-center p-4 rounded-xl border transition-all ${
                      ep.id === epId 
                        ? 'bg-red-600/10 border-red-600 text-red-500' 
                        : 'bg-[#16191f] border-[#272a31] text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                     <span className="w-8 font-black text-xs">{ep.number}</span>
                     <span className="text-xs font-bold truncate">{ep.title}</span>
                  </Link>
               ))}
            </div>
         </aside>
      </div>
    </div>
  );
};

export default WatchPage;
