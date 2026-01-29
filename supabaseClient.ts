
import { createClient } from '@supabase/supabase-js';

// Fungsi pembantu untuk mendapatkan env variable dengan aman
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env && process.env[key]) || '';
  } catch (e) {
    return '';
  }
};

const supabaseUrl = getEnv('NEXT_PUBLIC_SUPABASE_URL') || 'https://placeholder.supabase.co';
const supabaseAnonKey = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || 'placeholder';

// Inisialisasi dengan pengecekan tambahan agar tidak crash jika env tidak ada
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
