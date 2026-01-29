
import { Anime, Episode } from '../types';

const API_BASE = 'https://www.sankavollerei.com/anime/samehadaku';

const proxies = [
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

// Helper untuk memastikan Thumbnail selalu muncul
export const getSafePoster = (url: string | undefined) => {
  if (!url) return 'https://via.placeholder.com/300x450?text=No+Poster';
  if (url.includes('placeholder')) return url;
  return url;
};

const fetcher = async (endpoint: string) => {
  const fullUrl = `${API_BASE}${endpoint}`;
  for (const getProxiedUrl of proxies) {
    try {
      const response = await fetch(getProxiedUrl(fullUrl), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!response.ok) continue;
      const text = await response.text();
      const data = JSON.parse(text);
      
      if (data && (data.status === 'success' || data.data)) {
        return data.data || data;
      }
    } catch (error) {
      continue;
    }
  }
  return null;
};

const mapAnimeList = (list: any[]): Anime[] => {
  if (!Array.isArray(list)) return [];
  return list.map((item: any) => ({
    id: item.animeId || item.slug || item.id,
    title: item.title,
    poster: getSafePoster(item.poster || item.thumb),
    genres: item.genres || ['Anime'],
    score: item.score || '8.0',
    status: item.status || 'N/A'
  }));
};

export const fetchTrending = async (): Promise<Anime[]> => {
  const data = await fetcher('/home');
  return mapAnimeList(data?.recent?.anime || data?.popular || []);
};

export const fetchRecent = async (): Promise<Anime[]> => {
  const data = await fetcher('/recent');
  return mapAnimeList(data?.anime || data || []);
};

export const fetchOngoing = async (): Promise<Anime[]> => {
  const data = await fetcher('/ongoing');
  return mapAnimeList(data?.anime || data || []);
};

export const fetchCompleted = async (): Promise<Anime[]> => {
  const data = await fetcher('/completed');
  return mapAnimeList(data?.anime || data || []);
};

export const fetchMovies = async (): Promise<Anime[]> => {
  const data = await fetcher('/movies');
  return mapAnimeList(data?.anime || data || []);
};

export const fetchAnimeDetail = async (id: string): Promise<Anime | null> => {
  const data = await fetcher(`/anime/${id}`);
  if (!data) return null;

  return {
    id: data.animeId || id,
    title: data.title,
    poster: getSafePoster(data.poster || data.thumb),
    description: data.synopsis || data.description,
    score: data.score,
    genres: data.genres || [],
    status: data.status,
    episodes: (data.episodeList || []).map((ep: any) => ({
      id: ep.episodeId || ep.slug,
      anime_id: id,
      title: ep.title,
      number: parseInt(ep.title.replace(/[^0-9]/g, '')) || 0
    }))
  };
};

export const fetchEpisodeDetail = async (epId: string) => {
  const data = await fetcher(`/episode/${epId}`);
  if (!data) return null;

  if (data.serverList && data.serverList.length > 0) {
    const firstServer = data.serverList[0];
    const serverId = firstServer.serverId;
    const serverResponse = await fetcher(`/server/${serverId}`);
    return {
      title: data.title,
      stream_url: serverResponse?.url || serverResponse?.link || firstServer.url,
      serverList: data.serverList
    };
  }
  return data;
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  const data = await fetcher(`/search?q=${encodeURIComponent(query)}`);
  return mapAnimeList(data?.anime || data || []);
};
