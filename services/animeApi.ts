
import { 
  Anime, 
  Episode, 
  SansekaiAnimeItem,
  SansekaiDetailResponse,
  SansekaiDetailData
} from '../types.ts';

// --- CONFIGURATION ---
const BASE_URL = 'https://api.sansekai.my.id/api/anime';
const ANILIST_API = 'https://graphql.anilist.co';        

// --- CACHE SYSTEM ---
const API_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 Menit

// --- HELPERS ---

export const extractIdFromUrl = (url: string): string => {
  if (!url) return '';
  // Remove trailing slash if exists
  const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  const parts = cleanUrl.split('/');
  return parts[parts.length - 1];
};

export const getAnimeSlug = (slug: string): string => {
  return slug.replace(/-episode-\d+.*$/, '');
};

// Helper SUPER KUAT untuk membersihkan judul agar pencarian metadata akurat 100%
const cleanTitle = (title: string): string => {
  if (!title) return '';
  return title
    .replace(/\[.*?\]/g, '')            // Hapus text dalam kurung siku [Genzuro]
    .replace(/\(.*?\)/g, '')            // Hapus text dalam kurung biasa (TV)
    .replace(/\s+episode\s+\d+.*/i, '') // Hapus "Episode 12..." dan seterusnya
    .replace(/\s+sub\s+indo.*/i, '')    // Hapus "Sub Indo..."
    .replace(/\s+subtitle\s+indonesia.*/i, '') // Hapus versi panjang
    .replace(/\b(1080p|720p|480p|360p)\b/gi, '') // Hapus resolusi
    .replace(/\s+/g, ' ')               // Rapikan spasi ganda
    .trim();
};

/**
 * PROXY FETCHER
 */
const fetcher = async (url: string): Promise<any> => {
  const cached = API_CACHE.get(url);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }

  const controller = new AbortController();
  const signal = controller.signal;

  // Try direct fetch first, then proxies if needed (though direct should work for this API)
  const fetchCandidates = [
    fetch(url, { signal }).then(r => { if(!r.ok) throw 1; return r.json() }),
    fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal }).then(r => { if(!r.ok) throw 1; return r.json() }),
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal }).then(async r => { if(!r.ok) throw 1; const j = await r.json(); return JSON.parse(j.contents) })
  ];

  try {
    // @ts-ignore
    const result = await Promise.any(fetchCandidates);
    API_CACHE.set(url, { data: result, timestamp: Date.now() });
    return result;
  } catch (error) {
    console.warn(`Fetch failed for ${url}`);
    throw new Error('Gagal memuat data utama.');
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

const mapSansekaiItemToAnime = (item: SansekaiAnimeItem): Anime => ({
  id: item.url, // Use url as ID/slug
  title: item.judul,
  poster: item.cover,
  status: item.lastup, 
  score: undefined, 
  total_episodes: item.lastch,
  type: 'TV' // Default, will be updated by enrichment
});

// --- SMART BATCH SCRAPER (ANILIST) ---
const fetchAniListBatch = async (titles: string[]) => {
    if (titles.length === 0) return null;

    const validTitles = titles.filter(t => cleanTitle(t).length > 0);
    if (validTitles.length === 0) return null;

    const queryParts = validTitles.map((t, i) => {
        const safeTitle = JSON.stringify(cleanTitle(t));
        return `t${i}: Media(search: ${safeTitle}, type: ANIME) { 
            averageScore 
            seasonYear 
            startDate { year } 
            format
            coverImage { extraLarge }
        }`;
    });
    
    const query = `query { ${queryParts.join('\n')} }`;
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ query }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const json = await res.json();
        return json.data; 
    } catch (e) {
        console.warn("Batch metadata scrape skipped/failed:", e);
        return null; 
    }
};

const enrichAnimeList = async (animeList: Anime[]): Promise<Anime[]> => {
    const titles = animeList.map(a => a.title);
    
    try {
        const metadata = await fetchAniListBatch(titles);
        
        if (metadata) {
            return animeList.map((item, index) => {
                const meta = metadata[`t${index}`];
                if (meta) {
                    return {
                        ...item,
                        score: meta.averageScore ? (meta.averageScore / 10).toFixed(1) : 'N/A', 
                        release_date: String(meta.seasonYear || meta.startDate?.year || 'Unknown'),
                        type: meta.format || item.type,
                        poster: meta.coverImage?.extraLarge || item.poster 
                    };
                }
                return item;
            });
        }
    } catch (e) {
        console.warn("Enrichment failed, returning basic list");
    }
    
    return animeList;
};

// --- API METHODS ---

export const fetchLatest = async (page: number = 1): Promise<Anime[]> => {
  try {
    // The API doesn't seem to support pagination for latest based on the example URL
    // But if it does, it might be ?page=...
    // Assuming standard fetch for now
    const res = await fetchAPI<SansekaiAnimeItem[]>('/latest');
    if (Array.isArray(res)) {
      const basicList = res.map(mapSansekaiItemToAnime);
      return await enrichAnimeList(basicList);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const fetchRecommended = async (): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<SansekaiAnimeItem[]>('/recommended');
    if (Array.isArray(res)) {
      const basicList = res.map(mapSansekaiItemToAnime);
      return await enrichAnimeList(basicList);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const searchAnime = async (query: string, page: number = 1): Promise<Anime[]> => {
  try {
    // The search response structure is nested: { data: [{ result: [...] }] }
    const res = await fetchAPI<any>('/search', { query: query });
    
    if (res && res.data && res.data.length > 0 && res.data[0].result) {
        const results = res.data[0].result;
        const basicList = results.map((item: any) => ({
            id: item.url,
            title: item.judul,
            poster: item.cover,
            status: item.status,
            score: item.score,
            total_episodes: item.total_episode,
            type: 'TV'
        }));
        return await enrichAnimeList(basicList);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const fetchMovies = async (): Promise<Anime[]> => {
    try {
        const res = await fetchAPI<SansekaiAnimeItem[]>('/movie');
        if (Array.isArray(res)) {
            const basicList = res.map(mapSansekaiItemToAnime);
            return await enrichAnimeList(basicList);
        }
        return [];
    } catch (e) {
        return [];
    }
};

// --- SINGLE METADATA FETCHERS (DETAIL PAGE) ---

const fetchAniListMetadata = async (title: string) => {
    const q = cleanTitle(title);
    const query = `
    query ($search: String) {
      Media (search: $search, type: ANIME) {
        averageScore
        seasonYear
        startDate { year }
        studios(isMain: true) { nodes { name } }
        coverImage { extraLarge }
      }
    }
    `;
    try {
        const res = await fetch(ANILIST_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { search: q } })
        });
        const json = await res.json();
        return json.data?.Media || null;
    } catch (e) { return null; }
};

export const fetchAnimeDetail = async (slug: string): Promise<Anime | null> => {
  try {
    const cleanSlug = getAnimeSlug(slug);
    const res = await fetchAPI<SansekaiDetailResponse>('/detail', { urlId: cleanSlug });

    if (res && res.data && res.data.length > 0) {
      const d = res.data[0];
      
      const episodes: Episode[] = d.chapter.map((ep) => ({
        id: ep.url, // This is the slug for the episode
        title: ep.ch,
        number: ep.ch.replace(/\D/g, ''), // Extract number
        anime_id: cleanSlug,
        date: ep.date
      })); // Already sorted? Assuming yes or reverse if needed

      let finalScore = d.rating || 'N/A';
      let finalDate = d.published;
      let finalStudio = d.author; // Assuming author is studio
      let finalPoster = d.cover;

      // Single fetch fallback (Detail Page)
      let aniListData = await fetchAniListMetadata(d.judul);
      
      if (aniListData) {
          if (aniListData.averageScore) finalScore = (aniListData.averageScore / 10).toFixed(1);
          if (aniListData.seasonYear || aniListData.startDate?.year) finalDate = String(aniListData.seasonYear || aniListData.startDate?.year);
          if (aniListData.studios?.nodes?.length > 0) finalStudio = aniListData.studios.nodes[0].name;
          if (aniListData.coverImage?.extraLarge) finalPoster = aniListData.coverImage.extraLarge;
      }

      return {
        id: cleanSlug,
        title: d.judul,
        poster: finalPoster,
        description: d.sinopsis,
        status: d.status,
        studio: finalStudio,
        release_date: finalDate,
        genres: d.genre,
        total_episodes: episodes.length,
        episodes: episodes,
        score: finalScore
      };
    }
    return null;
  } catch (e) {
    console.error("Fetch Anime Detail Error:", e);
    return null;
  }
};

export const fetchEpisodeDetail = async (slug: string) => {
  // The new API does not provide a direct endpoint for streaming details.
  // We return null to indicate failure, or we could try to scrape if we had permission.
  // For now, we stub it.
  console.warn("Streaming endpoint not available in the new API.");
  return null;
};

export const fetchRelatedAnime = async (genres?: string[]): Promise<Anime[]> => {
  if (!genres || genres.length === 0) return [];
  const query = genres[0];
  try {
      const results = await searchAnime(query);
      return results.slice(0, 10); 
  } catch (e) {
      return [];
  }
};

export const fetchOngoing = fetchLatest;
export const fetchCompleted = fetchRecommended;
export const fetchRecent = fetchLatest;
export const fetchTrending = fetchRecommended;
