
import { supabase } from '../supabaseClient.ts';

/**
 * Service untuk mengelola data administratif menggunakan sistem keys.
 */
class AdminService {
  // Keys yang Anda minta untuk identifikasi data
  private userKey = 'nova_anime_current_user';
  private usersDbKey = 'nova_anime_users_db';
  private adsKey = 'nova_anime_ads_config';
  private statsKey = 'nova_anime_stats';

  // Mengambil user saat ini dari session (userKey logic)
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log(`[${this.userKey}] User detected:`, user.email);
    }
    return user;
  }

  // Mengambil daftar semua user (usersDbKey logic)
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    
    if (error) {
      console.error(`[${this.usersDbKey}] Error:`, error);
      return [];
    }
    return data;
  }

  // Mendapatkan semua script iklan yang aktif (adsKey logic)
  async getActiveAds() {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error(`[${this.adsKey}] Error:`, error);
      return [];
    }
    return data;
  }

  // Mengupdate statistik menggunakan RPC increment_stat (statsKey logic)
  async incrementStat(key: 'total_views' | 'ad_clicks') {
    const { error } = await supabase.rpc('increment_stat', { stat_key: key });
    
    if (error) {
      console.warn(`[${this.statsKey}] RPC failed, falling back to manual update:`, error);
      const { data: current } = await supabase.from('stats').select('value_int').eq('key', key).single();
      if (current) {
        await supabase.from('stats').update({ value_int: current.value_int + 1 }).eq('key', key);
      }
    }
  }

  // Mendapatkan dashboard stats
  async getDashboardStats() {
    const { data, error } = await supabase.from('stats').select('*');
    if (error) {
      console.error(`[${this.statsKey}] Error:`, error);
      return null;
    }
    
    return data.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value_int;
      return acc;
    }, {});
  }
}

export const adminService = new AdminService();
