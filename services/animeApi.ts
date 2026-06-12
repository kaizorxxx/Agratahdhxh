
import { 
  Anime, 
  Episode 
} from '../types.ts';

// --- CONFIGURATION ---
const BASE_URL = window.location.origin + '/api';
const ANILIST_API = 'https://graphql.anilist.co';        

// --- CACHE SYSTEM ---
const API_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 Menit

// --- HELPERS ---

export const getAnimeSlug = (slug: string): string => {
  if (!slug) return '';
  return slug.replace(/-episode-\d+.*$/, '').replace(/\/$/, '');
};

const cleanTitle = (title: string): string => {
  if (!title) return '';
  return title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\s+episode\s+\d+.*/i, '')
    .replace(/\s+sub\s+indo.*/i, '')
    .replace(/\s+subtitle\s+indonesia.*/i, '')
    .replace(/\b(1080p|720p|480p|360p)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * SECURE DIRECT BACKEND PROXY FETCHER
 * Fetches through our Express backend proxy to ensure 100% reliability, speed, and safety of API calls.
 */
const fetcher = async (url: string): Promise<any> => {
  const cached = API_CACHE.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Server returned status ${res.status}`);
    }
    
    const data = await res.json();
    
    // Strict validation: Every successful Sankavollerei API payload contains a 'data' key nesting actual contents, or 'status' indicating validity.
    const isValidPayload = data && typeof data === 'object' && 
                           ('data' in data || 'status' in data);

    if (isValidPayload) {
      API_CACHE.set(url, { data, timestamp: Date.now() });
      return data;
    } else {
      throw new Error('Invalid server response payload structure');
    }
  } catch (e) {
    console.error(`Secure proxy fetcher failed for: ${url}`, e);
    throw new Error('Gagal memuat data dari server. Silakan coba lagi nanti.');
  }
};

async function fetchAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }
    return fetcher(url.toString());
}

const mapVantaToAnime = (item: any): Anime => ({
  id: item.animeId || item.id,
  title: item.title,
  poster: item.poster,
  status: item.episodes ? `Ep ${item.episodes}` : (item.status || item.releaseDay || ''),
  score: item.score || 'N/A',
  total_episodes: item.episodes || '',
  type: item.type || 'TV',
  genres: Array.isArray(item.genreList) ? item.genreList.map((g: any) => g.title) : []
});

// --- API METHODS ---

export const fetchLatest = async (page: number = 1): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<any>(`/anime/ongoing-anime?page=${page}`);
    if (res && res.data && Array.isArray(res.data.animeList)) {
      return res.data.animeList.map(mapVantaToAnime);
    }
    return [];
  } catch (e) {
    console.error("fetchLatest failed", e);
    return [];
  }
};

export const fetchOngoing = fetchLatest;

export const fetchRecommended = async (): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<any>('/anime/complete-anime');
    if (res && res.data && Array.isArray(res.data.animeList)) {
       return res.data.animeList.map(mapVantaToAnime);
    }
    return [];
  } catch (e) {
    console.error("fetchRecommended failed", e);
    return [];
  }
};

export const fetchTrending = fetchOngoing;
export const fetchRecent = fetchLatest;
export const fetchCompleted = fetchRecommended;

export const fetchMovies = async (): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<any>('/anime/unlimited');
    if (res && res.data && Array.isArray(res.data.animeList)) {
         return res.data.animeList.filter((item: any) => 
            item.type?.toLowerCase().includes('movie') || 
            item.title?.toLowerCase().includes('movie')
         ).map(mapVantaToAnime);
    }
    return [];
  } catch (e) {
    console.error("fetchMovies failed", e);
    return [];
  }
};

export const searchAnime = async (query: string, page: number = 1): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<any>(`/anime/search/${encodeURIComponent(query)}`);
    if (res && res.data && Array.isArray(res.data.animeList)) {
        return res.data.animeList.map(mapVantaToAnime);
    }
    return [];
  } catch (e) {
    console.error("searchAnime failed", e);
    return [];
  }
};

export const fetchAnimeDetail = async (slug: string): Promise<Anime | null> => {
  const cleanSlug = getAnimeSlug(slug);
  try {
    const res = await fetchAPI<any>(`/anime/anime/${cleanSlug}`);

    if (res && res.data) {
      const d = res.data;
      
      const episodes = Array.isArray(d.episodeList)
        ? d.episodeList.map((ep: any) => ({
            id: ep.episodeId,
            title: ep.title,
            number: ep.eps || parseInt(ep.title.match(/episode\s+(\d+)/i)?.[1] || '0'),
            anime_id: cleanSlug,
            date: ep.date
          })).reverse()
        : [];

      let safeDescription = '';
      if (d.synopsis) {
        if (typeof d.synopsis === 'string') {
          safeDescription = d.synopsis;
        } else if (typeof d.synopsis === 'object') {
          if (Array.isArray(d.synopsis.paragraphs)) {
            safeDescription = d.synopsis.paragraphs.join('\n\n');
          } else if (d.synopsis.text) {
            safeDescription = String(d.synopsis.text);
          } else {
            safeDescription = JSON.stringify(d.synopsis);
          }
        }
      }

      return {
        id: cleanSlug,
        title: d.title,
        poster: d.poster,
        description: safeDescription,
        status: d.status,
        studio: d.studios,
        release_date: d.aired,
        genres: Array.isArray(d.genreList) ? d.genreList.map((g: any) => g.title) : [],
        total_episodes: d.episodes || episodes.length,
        episodes: episodes,
        score: d.score || 'N/A'
      };
    }
    return null;
  } catch (e) {
    console.warn("fetchAnimeDetail failed for", cleanSlug, e);
    return null;
  }
};

export const fetchEpisodeDetail = async (slug: string) => {
  try {
    const res = await fetchAPI<any>(`/anime/episode/${slug}`);
    if (res && res.data) {
        const d = res.data;
        
        const streaming_servers: any[] = [];
        
        if (d.defaultStreamingUrl) {
           streaming_servers.push({
              name: 'Default Premium Server',
              url: d.defaultStreamingUrl,
              type: 'embed'
           });
        }
        
        if (d.server && Array.isArray(d.server.qualities)) {
           d.server.qualities.forEach((q: any) => {
              if (Array.isArray(q.serverList)) {
                 q.serverList.forEach((s: any) => {
                    streaming_servers.push({
                       name: `${q.title} - ${s.title.trim()}`,
                       url: s.serverId,
                       type: 'embed'
                    });
                 });
              }
           });
        }
        
        return {
            title: d.title || `Episode ${slug}`,
            stream_url: d.defaultStreamingUrl || '',
            streaming_servers: streaming_servers
        };
    }
    return null;
  } catch (e) {
    console.warn("fetchEpisodeDetail failed for", slug, e);
    return null;
  }
};

export const resolveServer = async (serverId: string) => {
    try {
        const res = await fetchAPI<any>(`/anime/server/${serverId}`);
        if (res && res.data && res.data.url) {
            return res.data.url;
        }
        return null;
    } catch (e) {
        console.warn("resolveServer failed", e);
        return null;
    }
};

export const fetchRelatedAnime = async (genres?: string[]): Promise<Anime[]> => {
  if (!genres || genres.length === 0) return [];
  return searchAnime(genres[0]);
};

