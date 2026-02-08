
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail, fetchEpisodeDetail } from '../services/animeApi.ts';
import { saveProgress } from '../services/historyService.ts';
import { Anime } from '../types.ts';

declare global {
  interface Window {
    Hls: any;
  }
}

const WatchPage: React.FC = () => {
  const { animeId, epId } = useParams<{ animeId: string; epId: string }>();
  const cleanAnimeId = animeId ? decodeURIComponent(animeId) : '';
  const cleanEpId = epId ? decodeURIComponent(epId) : '';

  const [anime, setAnime] = useState<Anime | null>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!cleanAnimeId || !cleanEpId) return;
      setLoading(true);
      try {
        const [aData, eData] = await Promise.all([
          fetchAnimeDetail(cleanAnimeId),
          fetchEpisodeDetail(cleanEpId)
        ]);
        setAnime(aData);
        setEpisode(eData);
        setActiveServer(0); // Reset server on new episode
      } catch (err) {
        console.error("Failed to load watch data", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [cleanAnimeId, cleanEpId]);

  // Handle Player Logic
  useEffect(() => {
    if (loading || !episode || !episode.serverList || episode.serverList.length === 0) return;

    const currentServer = episode.serverList[activeServer];
    if (!currentServer) return;

    // Destroy HLS instance when switching or unmounting
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentServer.url;
    const isEmbed = currentServer.type === 'embed' || currentServer.type === 'iframe' || !streamUrl.match(/\.(mp4|m3u8)$/i);

    // If it's an embed, we rely on the iframe render, so we don't init HLS
    if (isEmbed) return;

    // Direct Video / HLS Logic
    const video = videoRef.current;
    if (!video) return;

    const isHlsSource = streamUrl.includes('.m3u8') || streamUrl.includes('hls');

    if (isHlsSource && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({
        enableWorker: true,
        lowLatencyMode: true
      });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) {
           hls.destroy();
        }
      });
    } else {
      video.src = streamUrl;
      video.play().catch(() => {});
    }

  }, [loading, episode, activeServer]);

  const handleSaveProgress = () => {
    if (!anime || !episode || !videoRef.current) return;
    saveProgress({
      anime_id: cleanAnimeId,
      anime_title: anime.title || '',
      anime_poster: anime.poster || '',
      ep_id: cleanEpId,
      ep_title: episode.title || `Episode`,
      timestamp: videoRef.current.currentTime,
      duration: videoRef.current.duration || 0
    });
  };

  if (loading) return <div className="flex flex-col items-center justify-center h-[70vh] animate-pulse"><div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div></div>;

  const currentServer = episode?.serverList?.[activeServer];
  const isEmbed = currentServer?.type === 'embed' || currentServer?.type === 'iframe' || !currentServer?.url?.match(/\.(mp4|m3u8)$/i);

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center space-x-4">
            <Link to={`/anime/${encodeURIComponent(cleanAnimeId)}`} className="w-12 h-12 bg-[#16191f] border border-[#272a31] rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
               <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex-1 min-w-0">
               <h1 className="text-xl font-black text-white line-clamp-1 uppercase italic">{anime?.title}</h1>
               <p className="text-[10px] text-red-500 font-bold uppercase tracking-[0.2em]">{episode?.title}</p>
            </div>
         </div>
         
         <div className="flex flex-wrap gap-2">
            {episode?.serverList?.map((s: any, i: number) => (
              <button 
                key={i} 
                onClick={() => setActiveServer(i)} 
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${activeServer === i ? 'bg-red-600 border-red-600 text-white' : 'bg-[#16191f] border-[#272a31] text-gray-400 hover:text-white'}`}
              >
                {s.serverName || `Server ${i+1}`}
              </button>
            ))}
         </div>
      </div>

      <div className="relative w-full aspect-video bg-black rounded-[40px] overflow-hidden border border-[#272a31] shadow-2xl group">
         {isEmbed ? (
           <iframe 
             src={currentServer?.url} 
             className="w-full h-full border-0" 
             allowFullScreen 
             scrolling="no" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
             title="Video Player"
           />
         ) : (
           <video 
             ref={videoRef} 
             className="w-full h-full" 
             controls 
             onPause={handleSaveProgress} 
             playsInline 
             poster={anime?.poster}
           />
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <div className="bg-[#16191f] p-8 rounded-[32px] border border-[#272a31]">
               <h3 className="font-black text-white mb-4 uppercase text-sm">Description</h3>
               <p className="text-sm text-gray-400 leading-relaxed">{anime?.description || 'No description available.'}</p>
            </div>
         </div>
         <div className="bg-[#16191f] p-6 rounded-[32px] border border-[#272a31] h-[450px] flex flex-col">
            <h3 className="font-black text-white mb-6 uppercase text-sm flex justify-between">
              <span>Next Episodes</span>
              <span className="text-red-600">{anime?.episodes?.length}</span>
            </h3>
            <div className="overflow-y-auto space-y-3 flex-1 custom-scrollbar pr-2">
               {anime?.episodes?.map(ep => (
                  <Link 
                    key={ep.id} 
                    to={`/watch/${encodeURIComponent(cleanAnimeId)}/${encodeURIComponent(ep.id)}`}
                    className={`flex items-center p-4 rounded-2xl border transition-all ${ep.id === cleanEpId ? 'bg-red-600 border-red-600 text-white' : 'bg-black/20 border-transparent text-gray-400 hover:bg-black/40'}`}
                  >
                     <span className="text-[10px] font-black uppercase truncate">{ep.title}</span>
                  </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default WatchPage;
