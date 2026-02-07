
import { HistoryItem } from '../types.ts';
import { supabase } from '../supabaseClient.ts';

const LOCAL_STORAGE_KEY = 'anime_x_history';

export const getHistory = (): HistoryItem[] => {
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    return local ? JSON.parse(local) : [];
  } catch (e) {
    return [];
  }
};

export const saveProgress = async (item: Omit<HistoryItem, 'id' | 'updated_at' | 'user_id'>) => {
  try {
    // 1. Save to Local Storage
    const currentHistory = getHistory();
    const existingIndex = currentHistory.findIndex(h => h.anime_id === item.anime_id);
    
    const newItem: HistoryItem = {
      ...item,
      id: crypto.randomUUID(),
      user_id: 'guest',
      updated_at: new Date().toISOString(),
    };

    if (existingIndex !== -1) {
      // Update existing record and move to top
      currentHistory.splice(existingIndex, 1);
    }
    
    // Add to beginning of array
    currentHistory.unshift(newItem);
    
    // Limit to 20 items
    if (currentHistory.length > 20) {
      currentHistory.pop();
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentHistory));

    // 2. Try to sync with Supabase if user is logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Check if exists
      const { data: existing } = await supabase
        .from('history')
        .select('id')
        .eq('user_id', user.id)
        .eq('anime_id', item.anime_id)
        .single();

      if (existing) {
        await supabase.from('history').update({
          ep_id: item.ep_id,
          ep_title: item.ep_title,
          timestamp: item.timestamp,
          duration: item.duration,
          updated_at: new Date().toISOString()
        }).eq('id', existing.id);
      } else {
        await supabase.from('history').insert({
          user_id: user.id,
          anime_id: item.anime_id,
          anime_title: item.anime_title,
          anime_poster: item.anime_poster,
          ep_id: item.ep_id,
          ep_title: item.ep_title,
          timestamp: item.timestamp,
          duration: item.duration
        });
      }
    }
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const removeFromHistory = (animeId: string) => {
  const currentHistory = getHistory();
  const newHistory = currentHistory.filter(h => h.anime_id !== animeId);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
};
