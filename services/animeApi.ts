
import { 
  Anime, 
  Episode, 
  HomeResponse, 
  DetailResponse, 
  WatchResponse, 
  SearchResponse, 
  AnimeItem, 
  ScheduleResponse
} from '../types.ts';

// --- CONFIGURATION ---
const BASE_URL = 'https://rgsordertracking.com/animekompi/endpoints';

// --- HELPERS ---

export const extractIdFromUrl = (url: string): string => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1];
};

/**
 * Robust Fetcher with Proxy Support
 */
const fetcher = async (url: string): Promise<any> => {
  console.log(`[API] Fetching: ${url}`);
  
  const proxies = [
    (u: string) => u, // Direct
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`
  ];

  for (const proxy of proxies) {
    try {
      const target = proxy(url);
      const res = await fetch(target);
      if (res.ok) {
        if (target.includes('allorigins')) {
          const json = await res.json();
          return JSON.parse(json.contents);
        }
        return await res.json();
      }
    } catch (e) {
      console.warn(`Proxy fail: ${proxy(url)}`, e);
    }
  }
  throw new Error(`Failed to fetch ${url}`);
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

// --- MAPPERS ---

const mapAnimeItemToAnime = (item: AnimeItem): Anime => ({
  id: item.slug,
  title: item.title,
  poster: item.image || item.thumbnail || '',
  status: item.type, 
  score: undefined, 
  total_episodes: item.latest_episode,
  type: item.type
});

// --- API METHODS ---

export const fetchLatest = async (page: number = 1): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<HomeResponse>('/home.php', { page: page.toString() });
    if (res.status === 'success' && res.data?.anime) {
      return res.data.anime.map(mapAnimeItemToAnime);
    }
    return [];
  } catch (e) {
    console.error('fetchLatest error', e);
    return [];
  }
};

export const fetchRecommended = async (): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<HomeResponse>('/home.php', { page: '2' });
    if (res.status === 'success' && res.data?.anime) {
      return res.data.anime.map(mapAnimeItemToAnime);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const searchAnime = async (query: string, page: number = 1): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<SearchResponse>('/search.php', { q: query, page: page.toString() });
    if (res.status === 'success' && res.data?.anime) {
      return res.data.anime.map(mapAnimeItemToAnime);
    }
    return [];
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const fetchAnimeDetail = async (slug: string): Promise<Anime | null> => {
  try {
    const res = await fetchAPI<DetailResponse>('/detail.php', { slug });
    if (res.status === 'success' && res.data) {
      const d = res.data;
      
      const episodes: Episode[] = d.episodes.map((ep, idx) => ({
        id: ep.slug,
        title: ep.title,
        number: ep.episode,
        anime_id: slug,
        date: ep.date
      }));

      return {
        id: slug,
        title: d.title,
        poster: d.thumbnail,
        description: d.synopsis,
        status: d.info.status,
        studio: d.info.studio,
        release_date: d.info.dirilis,
        genres: d.info.genres,
        total_episodes: episodes.length,
        episodes: episodes,
        score: 'N/A'
      };
    }
    return null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchEpisodeDetail = async (slug: string) => {
  try {
    const res = await fetchAPI<WatchResponse>('/watch.php', { slug });
    if (res.status === 'success' && res.data) {
      const d = res.data;
      
      // Ensure we have an array
      const rawServers = d.streaming_servers || [];
      
      const serverList = rawServers.map(s => ({
        serverName: s.name, 
        type: s.type, // 'video' | 'embed'
        url: s.url
      }));

      // Fallback if list is empty
      const defaultServer = serverList.length > 0 ? serverList[0] : null;

      return {
        title: d.title,
        stream_url: defaultServer?.url || '',
        serverList
      };
    }
    throw new Error('Episode not found');
  } catch (e) {
    console.error(e);
    return null;
  }
};

export const fetchMovies = async (): Promise<Anime[]> => {
    return fetchLatest(1);
};

// Wrappers
export const fetchOngoing = fetchLatest;
export const fetchCompleted = fetchRecommended;
export const fetchRecent = fetchLatest;
export const fetchTrending = fetchRecommended;
