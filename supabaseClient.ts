
import { createClient } from '@supabase/supabase-js';

/**
 * PENTING:
 * Ambil URL dan Key dari Dashboard Supabase:
 * Settings -> API -> Project URL & anon public key
 */

const SUPABASE_URL = 'https://jvwwazeuxmisehplhmtl.supabase.co'; // GANTI DENGAN URL ANDA
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2d3dhemV1eG1pc2VocGxobXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODM2NjUsImV4cCI6MjA4NDA1OTY2NX0.72ydk1kZOO_WnQthfHKyuFZHJwmxk0Zi4kOWjkYLzy0';           // GANTI DENGAN ANON KEY ANDA

// Fungsi helper untuk mengambil dari env atau hardcoded
const getEnv = (key: string): string => {
  try {
    // Mencoba mengambil dari process.env (Vite/Node)
    // @ts-ignore
    const envVal = (typeof process !== 'undefined' && process.env && process.env[key]);
    if (envVal) return envVal;
    
    // Fallback ke hardcoded jika env kosong
    if (key === 'NEXT_PUBLIC_SUPABASE_URL') return SUPABASE_URL;
    if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') return SUPABASE_ANON_KEY;
    
    return '';
  } catch (e) {
    return '';
  }
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Validasi sederhana agar tidak crash jika belum diisi
if (!url || url.includes('placeholder') || !key || key.includes('placeholder')) {
  console.warn("PERINGATAN: Supabase URL atau Anon Key belum dikonfigurasi di supabaseClient.ts");
}

export const supabase = createClient(url, key, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

/**
 * Mengambil statistik sistem dari database.
 * Pastikan tabel 'stats' sudah dibuat menggunakan SQL yang diberikan sebelumnya.
 */
export const getSystemStats = async () => {
  try {
    const { data: dbStats, error } = await supabase.from('stats').select('*');
    
    if (error) throw error;

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
        views: parseInt(statsMap['total_views'] || 0),
        clicks: parseInt(statsMap['ad_clicks'] || 0)
      },
      status: 'Healthy'
    };
  } catch (err) {
    console.error("Gagal mengambil statistik. Pastikan tabel 'stats' ada di Supabase:", err);
    return {
      diskUsage: { total: 'N/A', used: 'N/A', free: 'N/A', percent: 0 },
      traffic: { views: 0, clicks: 0 },
      status: 'Disconnected'
    };
  }
};
