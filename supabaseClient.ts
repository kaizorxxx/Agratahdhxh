
import { createClient } from '@supabase/supabase-js';

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

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export const getSystemStats = async () => {
  // Mengambil data real dari tabel 'stats'
  const { data: dbStats } = await supabase.from('stats').select('*');
  
  const statsMap = dbStats?.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value_int;
    return acc;
  }, {}) || {};

  return {
    diskUsage: {
      total: '500GB',
      used: '142GB',
      free: '358GB',
      percent: 28
    },
    traffic: {
      views: statsMap['total_views'] || 0,
      clicks: statsMap['ad_clicks'] || 0
    },
    status: 'Healthy'
  };
};
