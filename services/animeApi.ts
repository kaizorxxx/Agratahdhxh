
import { Anime, Episode } from '../types.ts';

// --- CONFIGURATION ---
const BASE_URL = 'https://api.sansekai.my.id/api/anime';

// --- HELPERS ---
const getSafePoster = (url: string | undefined) => {
  if (!url) return 'https://via.placeholder.com/300x450?text=No+Poster';
  return url;
};

// --- CORE FETCHER ---
const fetcher = async (endpoint: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) throw new Error(`Status ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`Fetch failed for ${endpoint}:`, error);
    return null;
  }
};

// --- API METHODS ---

// 1. Latest Anime (Untuk section Recent/Latest dengan pagination)
export const fetchLatest = async (page: number = 1): Promise<Anime[]> => {
  try {
    // Asumsi API support ?page=X, jika tidak support pagination native,
    // infinity scroll akan load data yang sama atau perlu logic client-side filter
    const data = await fetcher(`/latest?page=${page}`);
    
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.urlId || item.url, // urlId untuk detail
      title: item.title,
      poster: getSafePoster(item.img),
      score: item.score || 'N/A', // Score ditaruh di thumbnail atas
      status: item.status,
      episodes: [], // List episode ada di detail
      genres: item.genres || []
    }));
  } catch (e) {
    return [];
  }
};

// 2. Recommended Anime (Untuk section Populer)
export const fetchRecommended = async (): Promise<Anime[]> => {
  try {
    const data = await fetcher('/recommended');
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.urlId || item.url,
      title: item.title,
      poster: getSafePoster(item.img),
      score: item.score || 'Hot',
      status: 'Recommended',
      genres: item.genres || []
    }));
  } catch (e) {
    return [];
  }
};

// 3. Search Anime
export const searchAnime = async (query: string): Promise<Anime[]> => {
  try {
    const data = await fetcher(`/search?query=${encodeURIComponent(query)}`);
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.urlId || item.url,
      title: item.title,
      poster: getSafePoster(item.img),
      score: item.score,
      status: item.status,
      genres: item.genres || []
    }));
  } catch (e) {
    return [];
  }
};

// 4. Detail Anime
export const fetchAnimeDetail = async (urlId: string): Promise<Anime | null> => {
  try {
    const data = await fetcher(`/detail?urlId=${urlId}`);
    if (!data) throw new Error("No data");

    // Mapping Episodes dari 'chapter' array
    // Endpoint search/detail mengembalikan array chapter[] dengan property 'url'
    // Contoh url property: "al-150441-1135" -> ini yang dipakai buat getvideo
    const episodes: Episode[] = (data.chapter || []).map((ep: any, index: number) => ({
      id: ep.url, // Ini chapterUrlId
      anime_id: urlId,
      title: `Episode ${ep.chapter || index + 1}`,
      number: ep.chapter || index + 1,
      link: '' 
    }));

    return {
      id: urlId,
      title: data.title,
      poster: getSafePoster(data.img),
      description: data.sinopsis || 'No synopsis available.',
      score: data.score || 'N/A',
      genres: data.genres || [],
      status: data.status,
      studio: data.studio,
      release_date: data.rilis, // Tanggal Rilis
      total_episodes: data.total_episode,
      episodes: episodes
    };
  } catch (e) {
    console.error(e);
    return null;
  }
};

// 5. Movies List (Untuk Notifikasi Lonceng)
export const fetchMovies = async (): Promise<Anime[]> => {
  try {
    const data = await fetcher('/movie');
    if (!data || !Array.isArray(data)) return [];

    return data.map((item: any) => ({
      id: item.urlId || item.url,
      title: item.title,
      poster: getSafePoster(item.img),
      score: item.score,
      status: 'Movie',
      genres: []
    }));
  } catch (e) {
    return [];
  }
};

// 6. Get Video Stream
export const fetchEpisodeDetail = async (chapterUrlId: string) => {
  try {
    // Fetch video 720p
    // API: /anime/getvideo?chapterUrlId=...&reso=720p
    const data = await fetcher(`/getvideo?chapterUrlId=${chapterUrlId}&reso=720p`);
    
    // Response API ini biasanya mengembalikan object yang berisi link video
    // Struktur return harus kita sesuaikan. Misal data.url atau data.link
    // Jika API mengembalikan raw url string atau object
    
    const streamUrl = data?.url || data?.link || data?.video || '';
    
    if (!streamUrl) throw new Error("Stream not found");

    return {
      title: chapterUrlId, // Fallback title
      stream_url: streamUrl,
      isM3U8: streamUrl.includes('.m3u8'),
      serverList: [
        { serverName: 'Sansekai Server (720p)', quality: '720p', url: streamUrl }
      ]
    };

  } catch (e) {
    return { 
       title: 'Error', 
       stream_url: '', 
       serverList: [] 
    };
  }
};

// Wrapper aliases untuk kompatibilitas halaman lain
export const fetchTrending = fetchRecommended; 
export const fetchRecent = fetchLatest; 
export const fetchOngoing = fetchLatest; 
export const fetchCompleted = fetchRecommended; 
