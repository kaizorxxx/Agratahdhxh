
export interface Anime {
  id: string;
  title: string;
  poster: string;
  type?: string;
  status?: string;
  score?: string;
  genres?: string[];
  description?: string;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  title: string;
  number: number;
  anime_id: string;
  link?: string;
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
