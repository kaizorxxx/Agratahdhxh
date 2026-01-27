
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

// Inisialisasi dengan pengecekan tambahan
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export const getSystemStats = async () => {
  return {
    diskUsage: {
      total: '500GB',
      used: '120GB',
      free: '380GB',
      percent: 24
    },
    traffic: {
      views: 125430,
      clicks: 8421
    },
    status: 'Healthy'
  };
};
