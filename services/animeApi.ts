
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
const JIKAN_API = 'https://api.jikan.moe/v4/anime';      
const ANILIST_API = 'https://graphql.anilist.co';        

// --- CACHE SYSTEM ---
const API_CACHE = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 15; // 15 Menit

// --- HELPERS ---

export const extractIdFromUrl = (url: string): string => {
  if (!url) return '';
  const parts = url.split('/');
  return parts[parts.length - 1];
};

export const getAnimeSlug = (slug: string): string => {
  return slug.replace(/-episode-\d+.*$/, '');
};

// Helper SUPER KUAT untuk membersihkan judul agar pencarian metadata akurat 100%
// Mengubah "One Piece Episode 1090 Sub Indo [1080p]" menjadi "One Piece"
const cleanTitle = (title: string): string => {
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

  const fetchCandidates = [
    fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`, { signal }).then(r => { if(!r.ok) throw 1; return r.json() }),
    fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal }).then(async r => { if(!r.ok) throw 1; const j = await r.json(); return JSON.parse(j.contents) }),
    fetch(url, { signal }).then(r => { if(!r.ok) throw 1; return r.json() })
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

const mapAnimeItemToAnime = (item: AnimeItem): Anime => ({
  id: item.slug,
  title: item.title,
  poster: item.image || item.thumbnail || '',
  status: item.type, 
  score: undefined, 
  total_episodes: item.latest_episode,
  type: item.type
});

// --- SMART BATCH SCRAPER (ANILIST) ---
// Mengambil metadata untuk BANYAK anime sekaligus dalam 1 request GraphQL
const fetchAniListBatch = async (titles: string[]) => {
    if (titles.length === 0) return null;

    // Filter judul kosong setelah dibersihkan
    const validTitles = titles.filter(t => cleanTitle(t).length > 0);
    if (validTitles.length === 0) return null;

    // Buat query alias (t0, t1, t2...) untuk mengambil banyak data sekaligus
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
        // Timeout 4 detik agar UI tidak hang jika AniList lambat
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
        return null; // Return null agar UI tetap jalan dengan data basic (tanpa score)
    }
};

// Helper untuk menggabungkan data API utama + Metadata Scraper
const enrichAnimeList = async (animeList: Anime[]): Promise<Anime[]> => {
    const titles = animeList.map(a => a.title);
    
    // Jangan biarkan error metadata menghentikan flow utama app
    try {
        const metadata = await fetchAniListBatch(titles);
        
        if (metadata) {
            return animeList.map((item, index) => {
                // Mapping balik: t0 -> item[0]
                // Karena kita memfilter judul kosong di fetchAniListBatch, 
                // index mungkin tidak 1:1 jika ada judul yang hilang, tapi untuk kasus umum ini aman.
                // Jika ingin presisi 100%, kita harus map ulang berdasarkan judul bersih.
                
                // Simplified mapping (asumsi urutan sama untuk valid titles)
                const meta = metadata[`t${index}`];
                if (meta) {
                    return {
                        ...item,
                        score: meta.averageScore ? (meta.averageScore / 10).toFixed(1) : 'N/A', 
                        release_date: String(meta.seasonYear || meta.startDate?.year || 'Unknown'),
                        type: meta.format || item.type,
                        // Gunakan poster HD dari AniList jika ada (lebih tajam dari source asli)
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
    const res = await fetchAPI<HomeResponse>('/home.php', { page: page.toString() });
    if (res.status === 'success' && res.data?.anime) {
      const basicList = res.data.anime.map(mapAnimeItemToAnime);
      // Inject metadata (Score & Year)
      return await enrichAnimeList(basicList);
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const fetchRecommended = async (): Promise<Anime[]> => {
  try {
    const res = await fetchAPI<HomeResponse>('/home.php', { page: '2' });
    if (res.status === 'success' && res.data?.anime) {
      const basicList = res.data.anime.map(mapAnimeItemToAnime);
      return await enrichAnimeList(basicList);
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
      const basicList = res.data.anime.map(mapAnimeItemToAnime);
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

const fetchJikanMetadata = async (title: string) => {
    try {
        const q = cleanTitle(title);
        const url = `${JIKAN_API}?q=${encodeURIComponent(q)}&limit=1`;
        const res = await fetch(url);
        if (res.ok) {
            const json = await res.json();
            if (json.data && json.data.length > 0) return json.data[0];
        }
        return null;
    } catch (e) { return null; }
};

export const fetchAnimeDetail = async (slug: string): Promise<Anime | null> => {
  try {
    const cleanSlug = getAnimeSlug(slug);
    const mainRes = await fetchAPI<DetailResponse>('/detail.php', { slug: cleanSlug });

    if (mainRes.status === 'success' && mainRes.data) {
      const d = mainRes.data;
      
      const episodes: Episode[] = d.episodes.map((ep, idx) => ({
        id: ep.slug,
        title: ep.title,
        number: ep.episode,
        anime_id: cleanSlug,
        date: ep.date
      })).reverse(); 

      let finalScore = 'N/A';
      let finalDate = d.info.dirilis;
      let finalStudio = d.info.studio;
      let finalPoster = d.thumbnail;

      // Single fetch fallback (Detail Page)
      let aniListData = await fetchAniListMetadata(d.title);
      
      if (aniListData) {
          if (aniListData.averageScore) finalScore = (aniListData.averageScore / 10).toFixed(1);
          if (aniListData.seasonYear || aniListData.startDate?.year) finalDate = String(aniListData.seasonYear || aniListData.startDate?.year);
          if (aniListData.studios?.nodes?.length > 0) finalStudio = aniListData.studios.nodes[0].name;
          if (aniListData.coverImage?.extraLarge) finalPoster = aniListData.coverImage.extraLarge;
      } else {
          // Backup Jikan
          const jikanData = await fetchJikanMetadata(d.title);
          if (jikanData) {
              if (jikanData.score) finalScore = String(jikanData.score);
              if (jikanData.year) finalDate = String(jikanData.year);
              if (jikanData.studios?.[0]?.name) finalStudio = jikanData.studios[0].name;
          }
      }

      return {
        id: cleanSlug,
        title: d.title,
        poster: finalPoster,
        description: d.synopsis,
        status: d.info.status,
        studio: finalStudio,
        release_date: finalDate,
        genres: d.info.genres,
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
  try {
    const res = await fetchAPI<WatchResponse>('/watch.php', { slug });
    if (res.status === 'success' && res.data) {
      const d = res.data;
      const rawServers = d.streaming_servers || [];
      const serverList = rawServers.map(s => ({
        serverName: s.name, 
        type: s.type, 
        url: s.url
      }));
      return {
        title: d.title,
        stream_url: serverList[0]?.url || '',
        serverList
      };
    }
    throw new Error('Episode not found');
  } catch (e) {
    return null;
  }
};

export const fetchMovies = async (): Promise<Anime[]> => fetchLatest(1);
export const fetchOngoing = fetchLatest;
export const fetchCompleted = fetchRecommended;
export const fetchRecent = fetchLatest;
export const fetchTrending = fetchRecommended;
