
import { supabase } from '../supabaseClient.ts';

/**
 * Service untuk mengelola data administratif menggunakan sistem keys.
 * Pola ini memudahkan pengelolaan identitas data di database atau local storage.
 */
class AdminService {
  private adsKey = 'nova_anime_ads_config';
  private statsKey = 'nova_anime_stats';

  // Mendapatkan semua script iklan yang aktif
  async getActiveAds() {
    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      console.error(`[${this.adsKey}] Error fetching ads:`, error);
      return [];
    }
    return data;
  }

  // Mengupdate statistik (misal: tambah view)
  async incrementStat(key: 'total_views' | 'ad_clicks') {
    const { data, error } = await supabase.rpc('increment_stat', { stat_key: key });
    
    if (error) {
      // Fallback jika RPC belum dibuat: Update manual via filter
      const { data: current } = await supabase.from('stats').select('value_int').eq('key', key).single();
      if (current) {
        await supabase.from('stats').update({ value_int: current.value_int + 1 }).eq('key', key);
      }
    }
  }

  // Mendapatkan dashboard stats
  async getDashboardStats() {
    const { data, error } = await supabase.from('stats').select('*');
    if (error) return null;
    
    // Transform array ke object based on keys
    return data.reduce((acc: any, curr: any) => {
      acc[curr.key] = curr.value_int;
      return acc;
    }, {});
  }

  // Auth helper (Simulasi user management jika diperlukan di luar Supabase Auth)
  async getAdminProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin');
    return data;
  }
}

export const adminService = new AdminService();
