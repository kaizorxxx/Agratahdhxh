
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail, fetchEpisodeDetail } from '../services/animeApi.ts';
import { saveProgress } from '../services/historyService.ts';
import { Anime } from '../types.ts';

// Declare Hls global for TypeScript
declare global {
  interface Window {
    Hls: any;
  }
}

const WatchPage: React.FC = () => {
  const { animeId, epId } = useParams<{ animeId: string; epId: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null); // Store HLS instance

  useEffect(() => {
    const loadData = async () => {
      if (!animeId || !epId) return;
      setLoading(true);
      try {
        const [aData, eData] = await Promise.all([
          fetchAnimeDetail(animeId),
          fetchEpisodeDetail(epId)
        ]);
        setAnime(aData);
        setEpisode(eData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    // Cleanup HLS instance on unmount
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [animeId, epId]);

  // Handle Video Source Change (HLS Implementation)
  useEffect(() => {
    if (loading || !episode) return;

    const currentServer = episode?.serverList?.[activeServer];
    const streamUrl = currentServer?.url || episode?.stream_url;

    if (streamUrl && videoRef.current) {
      // Jika browser support native HLS (Safari)
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = streamUrl;
      } 
      // Jika browser perlu HLS.js (Chrome, Firefox, dll)
      else if (window.Hls && window.Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        
        const hls = new window.Hls();
        hlsRef.current = hls;
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(e => console.log("Auto-play blocked", e));
        });

        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
           console.warn("HLS Error:", data);
           if (data.fatal) {
             switch (data.type) {
               case window.Hls.ErrorTypes.NETWORK_ERROR:
                 hls.startLoad();
                 break;
               case window.Hls.ErrorTypes.MEDIA_ERROR:
                 hls.recoverMediaError();
                 break;
               default:
                 hls.destroy();
                 break;
             }
           }
        });
      }
    }
  }, [loading, episode, activeServer]);

  const handleSaveProgress = () => {
    if (!anime || !episode || !videoRef.current) return;
    saveProgress({
      anime_id: animeId || '',
      anime_title: anime.title || '',
      anime_poster: anime.poster || '',
      ep_id: epId || '',
      ep_title: `Episode ${episode.number || ''}`,
      timestamp: videoRef.current.currentTime,
      duration: videoRef.current.duration || 0
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Memuat Video...</p>
      </div>
    );
  }

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn">
      {/* Header Player */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center space-x-4">
            <Link to={`/anime/${animeId}`} className="w-12 h-12 bg-[#16191f] border border-[#272a31] rounded-2xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
               <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div>
               <h1 className="text-xl font-black text-white line-clamp-1">{anime?.title}</h1>
               <p className="text-xs text-red-500 font-bold uppercase tracking-widest">
                 {episode?.title || 'Streaming'}
               </p>
            </div>
         </div>
         {/* Server Selector */}
         <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
            {episode?.serverList?.map((s: any, i: number) => (
              <button 
                key={i}
                onClick={() => setActiveServer(i)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase whitespace-nowrap border ${
                  activeServer === i ? 'bg-red-600 border-red-600 text-white' : 'bg-[#16191f] border-[#272a31] text-gray-400'
                }`}
              >
                {s.quality || `Server ${i+1}`}
              </button>
            ))}
         </div>
      </div>

      {/* Video Player Container */}
      <div className="relative aspect-video bg-black rounded-[32px] overflow-hidden border border-[#272a31] shadow-2xl">
         <video 
           ref={videoRef}
           className="w-full h-full" 
           controls 
           poster={anime?.poster}
           onPause={handleSaveProgress}
         />
      </div>

      {/* Episode List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <div className="bg-[#16191f] p-6 rounded-[24px] border border-[#272a31]">
               <h3 className="font-bold text-white mb-2">Deskripsi</h3>
               <p className="text-sm text-gray-400 leading-relaxed">{anime?.description || 'Tidak ada deskripsi.'}</p>
            </div>
         </div>
         <div className="bg-[#16191f] p-6 rounded-[24px] border border-[#272a31] h-fit max-h-[500px] flex flex-col">
            <h3 className="font-bold text-white mb-4 flex justify-between items-center">
              <span>Episode</span>
              <span className="text-xs bg-red-600 px-2 py-1 rounded text-white">{anime?.episodes?.length || 0}</span>
            </h3>
            <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar flex-1">
               {anime?.episodes?.map(ep => (
                  <Link 
                    key={ep.id} 
                    to={`/watch/${animeId}/${ep.id}`}
                    className={`flex items-center p-3 rounded-xl border transition-all ${
                      ep.id === epId 
                        ? 'bg-red-600/10 border-red-600 text-red-500' 
                        : 'bg-black/20 border-transparent text-gray-400 hover:bg-black/40'
                    }`}
                  >
                     <span className="w-8 h-8 rounded-lg bg-black/30 flex items-center justify-center text-[10px] font-bold mr-3">
                       {ep.number}
                     </span>
                     <span className="text-xs font-bold truncate">Episode {ep.number}</span>
                  </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default WatchPage;
