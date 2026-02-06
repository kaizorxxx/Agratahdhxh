
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchAnimeDetail, fetchEpisodeDetail } from '../services/animeApi.ts';
import { Anime } from '../types.ts';

const WatchPage: React.FC = () => {
  const { animeId, epId } = useParams<{ animeId: string; epId: string }>();
  const [anime, setAnime] = useState<Anime | null>(null);
  const [episode, setEpisode] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeServer, setActiveServer] = useState(0);

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
  }, [animeId, epId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Menghubungkan ke Server Samehadaku...</p>
      </div>
    );
  }

  const streamUrl = episode?.stream_url || '';
  const isEmbed = streamUrl.includes('embed') || streamUrl.includes('googlevideo') || streamUrl.includes('content');

  return (
    <div className="px-8 pb-12 space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center space-x-4">
            <Link to={`/anime/${animeId}`} className="w-12 h-12 bg-[#16191f] border border-[#272a31] rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:border-red-600 transition-all shadow-lg">
               <i className="fa-solid fa-arrow-left"></i>
            </Link>
            <div className="min-w-0">
               <h1 className="text-2xl font-black truncate text-white uppercase tracking-tight">{anime?.title}</h1>
               <p className="text-xs text-red-500 font-bold uppercase tracking-widest">{episode?.title || 'Streaming'}</p>
            </div>
         </div>
         <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0">
            {episode?.serverList?.map((s: any, i: number) => (
              <button 
                key={i}
                onClick={() => setActiveServer(i)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all whitespace-nowrap border ${
                  activeServer === i ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#16191f] border-[#272a31] text-gray-500 hover:text-white'
                }`}
              >
                {s.serverName || `Server ${i+1}`} ({s.quality})
              </button>
            ))}
         </div>
      </div>

      <div className="relative aspect-video bg-black rounded-[40px] overflow-hidden border border-[#272a31] shadow-[0_0_50px_rgba(0,0,0,0.5)] group">
        {streamUrl ? (
          isEmbed ? (
            <iframe 
              src={streamUrl} 
              className="w-full h-full" 
              allowFullScreen 
              frameBorder="0"
              allow="autoplay; encrypted-media"
            ></iframe>
          ) : (
            <video 
              src={streamUrl} 
              className="w-full h-full" 
              controls 
              autoPlay
              poster={anime?.poster}
            />
          )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-[#16191f]">
             <i className="fa-solid fa-circle-exclamation text-5xl text-red-600 opacity-20"></i>
             <p className="text-gray-500 font-bold">Link Video tidak ditemukan di server ini.</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 rounded-xl text-xs font-bold uppercase">Coba Lagi</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         <div className="lg:col-span-3 space-y-6">
            <div className="bg-[#16191f] p-8 rounded-[32px] border border-[#272a31] flex flex-col md:flex-row items-center justify-between gap-6">
               <div className="flex items-center space-x-6">
                  <div className="w-16 h-16 bg-red-600/10 text-red-500 rounded-3xl flex items-center justify-center text-3xl shadow-inner">
                     <i className="fa-solid fa-play"></i>
                  </div>
                  <div>
                     <h4 className="font-black text-white uppercase tracking-tight">Kualitas Terbaik</h4>
                     <p className="text-xs text-gray-500 font-medium">Resolusi otomatis menyesuaikan koneksi Anda</p>
                  </div>
               </div>
               <div className="flex space-x-3 w-full md:w-auto">
                  <button className="flex-1 md:flex-none px-8 py-4 bg-[#272a31] hover:bg-gray-700 text-white rounded-2xl font-black transition-all text-xs uppercase tracking-widest">Download</button>
                  <button className="flex-1 md:flex-none px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all text-xs uppercase tracking-widest shadow-xl shadow-red-600/30">Lapor Error</button>
               </div>
            </div>
         </div>

         <aside className="space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="font-black text-white uppercase tracking-tighter text-lg">Playlist</h3>
               <span className="text-[10px] font-bold text-gray-500 uppercase bg-[#16191f] px-2 py-1 rounded-md">{anime?.episodes?.length} EP</span>
            </div>
            <div className="max-h-[600px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
               {anime?.episodes?.map(ep => (
                  <Link 
                    key={ep.id} 
                    to={`/watch/${animeId}/${ep.id}`}
                    className={`flex items-center p-4 rounded-2xl border transition-all group ${
                      ep.id === epId 
                        ? 'bg-red-600/10 border-red-600 text-red-500 shadow-lg shadow-red-600/5' 
                        : 'bg-[#16191f] border-[#272a31] text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 text-[10px] font-black transition-colors ${ep.id === epId ? 'bg-red-600 text-white' : 'bg-gray-800 group-hover:bg-gray-700'}`}>
                        {ep.number}
                     </div>
                     <span className="text-xs font-bold truncate tracking-tight">{ep.title}</span>
                  </Link>
               ))}
            </div>
         </aside>
      </div>
    </div>
  );
};

export default WatchPage;
