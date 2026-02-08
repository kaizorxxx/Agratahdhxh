
export interface Anime {
  id: string; // slug
  title: string;
  poster: string;
  type?: string;
  status?: string;
  score?: string;
  genres?: string[];
  description?: string;
  studio?: string;
  release_date?: string;
  total_episodes?: string | number;
  episodes?: Episode[];
}

export interface Episode {
  id: string; // slug
  title: string;
  number: number | string;
  anime_id: string;
  link?: string;
  date?: string;
}

export interface HistoryItem {
  id: string;
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_poster: string;
  ep_id: string;
  ep_title: string;
  timestamp: number;
  duration: number;
  updated_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  anime_id: string;
  anime_title: string;
  anime_poster: string;
  ep_id: string;
  ep_title: string;
  timestamp: number;
  duration: number;
}

export interface Banner {
  id: string;
  image_url: string;
  link: string;
  size: '728x90' | '300x250' | 'hero';
  is_active: boolean;
}

export interface Ad {
  id: string;
  name: string;
  script: string;
  placement: 'sidebar' | 'sticky-bottom' | 'interstitial';
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  role: 'user' | 'admin';
}

// --- New Backend Types ---

export interface AnimeItem {
    slug: string;
    title: string;
    thumbnail?: string;
    image?: string;
    type: string;
    latest_episode: string;
    episode?: string;
    release_time?: string;
}

export interface HomeResponse {
    status: string;
    data: {
        page: number;
        total_pages: number;
        anime: AnimeItem[];
    };
}

export interface AnimeDetail {
    title: string;
    thumbnail: string;
    synopsis: string;
    info: {
        status: string;
        studio: string;
        dirilis: string;
        durasi: string;
        season: string;
        tipe: string;
        censor: string;
        diposting_oleh: string;
        diperbarui_pada: string;
        genres: string[];
    };
    episodes: Array<{
        slug: string;
        episode: string;
        title: string;
        date: string;
    }>;
}

export interface DetailResponse {
    status: string;
    data: AnimeDetail;
}

export interface StreamingServer {
    name: string;
    type: string;
    url: string;
}

export interface DownloadLink {
    quality: string;
    links: Array<{
        provider: string;
        url: string;
    }>;
}

export interface WatchResponse {
    status: string;
    data: {
        title: string;
        streaming_servers: StreamingServer[];
        download_links: DownloadLink[];
    };
}

export interface ScheduleResponse {
    status: string;
    data: {
        [day: string]: AnimeItem[];
    };
}

export interface SearchResponse {
    status: string;
    data: {
        page: number;
        total_pages: number;
        anime: AnimeItem[];
        query?: string;
    };
}

export interface BatchResponse {
    status: string;
    data: {
        page: number;
        total_pages: number;
        anime: AnimeItem[];
    };
}
