import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const cleanAnimeId = animeId ? decodeURIComponent(animeId) : '';
  const cleanEpId = epId ? decodeURIComponent(epId) : '';

  // Data State
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState(0);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch Data
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
        setActiveServer(0);
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

  // HLS & Video Source Handling
  useEffect(() => {
    if (loading || !episode || !episode.serverList || episode.serverList.length === 0) return;

    const currentServer = episode.serverList[activeServer];
    if (!currentServer) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const streamUrl = currentServer.url;
    const isEmbed = currentServer.type === 'embed' || currentServer.type === 'iframe' || !streamUrl.match(/\.(mp4|m3u8)$/i);

    if (isEmbed) return;

    const video = videoRef.current;
    if (!video) return;

    // Reset Player State
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setIsBuffering(true);

    const isHlsSource = streamUrl.includes('.m3u8') || streamUrl.includes('hls');

    if (isHlsSource && window.Hls && window.Hls.isSupported()) {
      const hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(streamUrl);
      hls.attachMedia(video);
      hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
        setIsBuffering(false);
        // Optional: Auto-play logic could go here
      });
      hls.on(window.Hls.Events.ERROR, (_: any, data: any) => {
        if (data.fatal) hls.destroy();
      });
    } else {
      video.src = streamUrl;
    }

  }, [loading, episode, activeServer]);

  // --- Player Logic ---

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration;
    setCurrentTime(curr);
    setDuration(dur);
    if (dur > 0) setProgress((curr / dur) * 100);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newTime = (parseFloat(e.target.value) / 100) * duration;
    videoRef.current.currentTime = newTime;
    setProgress(parseFloat(e.target.value));
  };

  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime += seconds;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    videoRef.current.volume = newVol;
    setIsMuted(newVol === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.volume = volume || 1;
      setIsMuted(false);
    } else {
      videoRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const changeSpeed = (speed: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = speed;
    setPlaybackSpeed(speed);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleVideoEnd = () => {
    setIsPlaying(false);
    setShowControls(true);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'arrowright':
          skipTime(10);
          break;
        case 'arrowleft':
          skipTime(-10);
          break;
        case 'f':
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, volume, isMuted]);

  // Save Progress
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

  // Next Episode Logic
  const getNextEpisode = () => {
    if (!anime?.episodes) return null;
    const currentIndex = anime.episodes.findIndex(ep => ep.id === cleanEpId);
    if (currentIndex >= 0 && currentIndex < anime.episodes.length - 1) {
      return anime.episodes[currentIndex + 1];
    }
    return null;
  };
  
  const nextEp = getNextEpisode();

  const handleNextEpisode = () => {
    if (nextEp) {
      navigate(`/watch/${encodeURIComponent(cleanAnimeId)}/${encodeURIComponent(nextEp.id)}`);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Check type of player (Embed vs Custom)
  const currentServer = episode?.serverList?.[activeServer];
  const isEmbed = currentServer?.type === 'embed' || currentServer?.type === 'iframe' || !currentServer?.url?.match(/\.(mp4|m3u8)$/i);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[70vh] animate-pulse space-y-4">
      <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Loading Player Stream...</p>
    </div>
  );

  return (
    <div className="px-4 md:px-8 pb-12 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
         <div className="flex items-center space-x-4">
            <Link to={`/anime/${encodeURIComponent(cleanAnimeId)}`} className="w-10 h-10 bg-[#16191f] border border-[#272a31] rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all hover:bg-red-600 hover:border-red-600">
               <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="flex-1 min-w-0">
               <h1 className="text-lg md:text-xl font-black text-white line-clamp-1 uppercase italic tracking-tight">{anime?.title}</h1>
               <div className="flex items-center gap-2">
                 <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider">
                    {episode?.title?.replace('Episode', 'EP')}
                 </span>
                 {nextEp && (
                    <button onClick={handleNextEpisode} className="text-[10px] text-gray-500 hover:text-red-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        Next <i className="fa-solid fa-forward-step"></i>
                    </button>
                 )}
               </div>
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

      {/* Video Player Container */}
      <div 
        ref={playerContainerRef}
        className="relative w-full aspect-video bg-black rounded-[24px] md:rounded-[40px] overflow-hidden border border-[#272a31] shadow-2xl group select-none"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
      >
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
           <>
             <video 
               ref={videoRef} 
               className="w-full h-full object-contain" 
               playsInline 
               poster={anime?.poster}
               onTimeUpdate={handleTimeUpdate}
               onWaiting={() => setIsBuffering(true)}
               onPlaying={() => setIsBuffering(false)}
               onEnded={handleVideoEnd}
               onPause={handleSaveProgress}
               onClick={handlePlayPause}
             />

             {/* Center Overlay (Play/Pause/Buffer) */}
             <div 
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
             >
                {isBuffering ? (
                   <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                   !isPlaying && (
                      <div className="w-20 h-20 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 hover:scale-110 transition-transform group/play">
                         <i className="fa-solid fa-play text-3xl text-white ml-2 group-hover/play:text-red-500 transition-colors"></i>
                      </div>
                   )
                )}
                
                {/* End Screen Next Button */}
                {!isPlaying && currentTime >= duration && duration > 0 && nextEp && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center space-y-4 animate-fadeIn z-20">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Up Next</p>
                        <h3 className="text-2xl font-black italic text-white">{nextEp.title}</h3>
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleNextEpisode(); }}
                            className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-black uppercase text-xs tracking-widest shadow-[0_0_20px_rgba(220,38,38,0.5)] transition-all transform hover:scale-105"
                        >
                            <i className="fa-solid fa-play mr-2"></i> Play Next Episode
                        </button>
                        <button 
                            onClick={(e) => { e.stopPropagation(); videoRef.current?.play(); }}
                            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest"
                        >
                            Replay Video
                        </button>
                    </div>
                )}
             </div>

             {/* Custom Controls Bar */}
             <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent px-6 pb-6 pt-20 transition-opacity duration-300 z-20 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Progress Bar */}
                <div className="group/progress relative h-1.5 bg-white/20 rounded-full cursor-pointer mb-4">
                   <div 
                     className="absolute top-0 left-0 h-full bg-red-600 rounded-full relative" 
                     style={{ width: `${progress}%` }}
                   >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full scale-0 group-hover/progress:scale-100 transition-transform shadow-lg"></div>
                   </div>
                   <input 
                     type="range" 
                     min="0" 
                     max="100" 
                     step="0.1"
                     value={progress} 
                     onChange={handleSeek}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   />
                </div>

                <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-6">
                      {/* Play/Pause */}
                      <button onClick={handlePlayPause} className="text-white hover:text-red-500 transition-colors">
                         <i className={`fa-solid ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl w-6`}></i>
                      </button>

                      {/* Next Episode (Quick) */}
                      {nextEp && (
                         <button onClick={handleNextEpisode} className="text-gray-400 hover:text-white transition-colors" title="Next Episode">
                            <i className="fa-solid fa-forward-step text-lg"></i>
                         </button>
                      )}

                      {/* Volume */}
                      <div className="flex items-center space-x-3 group/vol">
                         <button onClick={toggleMute} className="text-white hover:text-gray-300 w-6">
                            <i className={`fa-solid ${isMuted || volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}`}></i>
                         </button>
                         <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300">
                             <input 
                                type="range" 
                                min="0" 
                                max="1" 
                                step="0.1" 
                                value={isMuted ? 0 : volume}
                                onChange={handleVolumeChange}
                                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-red-600"
                             />
                         </div>
                      </div>

                      {/* Time */}
                      <div className="text-xs font-mono font-bold text-gray-400">
                         <span className="text-white">{formatTime(currentTime)}</span> / {formatTime(duration)}
                      </div>
                   </div>

                   <div className="flex items-center space-x-6">
                      {/* Speed Selector */}
                      <div className="relative">
                         <button 
                            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                            className="text-xs font-black uppercase text-white hover:text-red-500 transition-colors w-10"
                         >
                            {playbackSpeed}x
                         </button>
                         {showSpeedMenu && (
                            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 bg-[#16191f] border border-[#272a31] rounded-xl overflow-hidden shadow-2xl min-w-[80px]">
                               {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(s => (
                                  <button 
                                    key={s}
                                    onClick={() => changeSpeed(s)}
                                    className={`block w-full px-4 py-2 text-[10px] font-bold hover:bg-white/10 ${playbackSpeed === s ? 'text-red-500' : 'text-gray-400'}`}
                                  >
                                    {s}x
                                  </button>
                               ))}
                            </div>
                         )}
                      </div>

                      {/* Fullscreen */}
                      <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
                         <i className={`fa-solid ${isFullscreen ? 'fa-compress' : 'fa-expand'} text-lg`}></i>
                      </button>
                   </div>
                </div>
             </div>
           </>
         )}
      </div>

      {/* Description & List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3">
            <div className="bg-[#16191f] p-8 rounded-[32px] border border-[#272a31]">
               <h3 className="font-black text-white mb-4 uppercase text-sm flex items-center gap-2">
                 <i className="fa-solid fa-circle-info text-red-600"></i> Description
               </h3>
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
                     {ep.id === cleanEpId && <i className="fa-solid fa-chart-simple text-xs ml-auto animate-pulse"></i>}
                  </Link>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default WatchPage;