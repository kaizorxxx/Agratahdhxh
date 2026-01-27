
import { Anime, Episode } from '../types';

const BASE_URL = 'https://www.sankavollerei.com/api';

const fetcher = async (endpoint: string) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) return null;
    const json = await response.json();
    return json;
  } catch (error) {
    return null;
  }
};

const getMockAnimes = (count: number = 10): Anime[] => {
  return Array.from({ length: count }).map((_, i) => ({
    id: `mock-${i}`,
    title: `Anime Demo ${i + 1}`,
    poster: `https://picsum.photos/seed/anime${i + 50}/400/600`,
    score: (Math.random() * 1.5 + 3.5).toFixed(1),
    genres: ['Action', 'Fantasy'],
    status: 'Ongoing'
  }));
};

export const fetchTrending = async (): Promise<Anime[]> => {
  const data = await fetcher('/trending');
  const list = data?.data || data || [];
  if (!Array.isArray(list) || list.length === 0) return getMockAnimes(4);

  return list.map((item: any) => ({
    id: item.id || item.slug || String(Math.random()),
    title: item.title || 'Untitled',
    poster: item.poster || item.thumb || 'https://via.placeholder.com/400x600',
    genres: Array.isArray(item.genres) ? item.genres : [],
    score: item.score || item.rating || '0.0',
  }));
};

export const fetchRecent = async (): Promise<Anime[]> => {
  const data = await fetcher('/recent');
  const list = data?.data || data || [];
  if (!Array.isArray(list) || list.length === 0) return getMockAnimes(12);

  return list.map((item: any) => ({
    id: item.id || item.slug || String(Math.random()),
    title: item.title || 'Untitled',
    poster: item.poster || item.thumb || 'https://via.placeholder.com/400x600',
    score: item.score || item.rating || '0.0',
    genres: Array.isArray(item.genres) ? item.genres : [],
  }));
};

export const searchAnime = async (query: string): Promise<Anime[]> => {
  if (!query) return [];
  const data = await fetcher(`/search/${encodeURIComponent(query)}`);
  const list = data?.data || data || [];
  if (!Array.isArray(list) || list.length === 0) return [];

  return list.map((item: any) => ({
    id: item.id || item.slug || String(Math.random()),
    title: item.title || 'Untitled',
    poster: item.poster || item.thumb || 'https://via.placeholder.com/400x600',
    score: item.score || item.rating || '0.0',
    genres: Array.isArray(item.genres) ? item.genres : [],
  }));
};

export const fetchAnimeDetail = async (id: string): Promise<Anime | null> => {
  const data = await fetcher(`/anime/${id}`);
  if (!data) return null;

  const anime = data?.data || data;
  return {
    id: anime.id || anime.slug || id,
    title: anime.title || 'Untitled',
    poster: anime.poster || anime.thumb || 'https://via.placeholder.com/400x600',
    description: anime.description || anime.synopsis || 'No description.',
    score: anime.score || anime.rating || '0.0',
    genres: Array.isArray(anime.genres) ? anime.genres : [],
    status: anime.status || 'Unknown',
    episodes: Array.isArray(anime.episodes) ? anime.episodes.map((ep: any) => ({
      id: ep.id || ep.slug || `ep-${ep.number}`,
      anime_id: id,
      title: ep.title || `Episode ${ep.number}`,
      number: ep.number || 0,
      link: ep.link || ep.video_url || 'https://www.w3schools.com/html/mov_bbb.mp4'
    })) : []
  };
};
