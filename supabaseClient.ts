
import { createClient } from '@supabase/supabase-js';

/**
 * PENTING:
 * File ini dipertahankan agar tidak terjadi error pada import legacy.
 * Karena aplikasi sudah migrasi ke Firebase, Supabase Client ini dibuat
 * agar tidak crash jika env var kosong.
 */

const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    const envVal = (typeof process !== 'undefined' && process.env && process.env[key]);
    if (envVal) return envVal;
    return '';
  } catch (e) {
    return '';
  }
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

// Logic: Jika URL/Key tidak valid, jangan panggil createClient (karena akan throw Error)
// Melainkan return objek dummy.
const isConfigured = url && !url.includes('placeholder') && !url.includes('YOUR_PROJECT_ID') && key && !key.includes('placeholder');

export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  : (() => {
      console.warn("Supabase credentials not found. Using Mock Client (Firebase Mode).");
      return {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: null }),
          update: () => Promise.resolve({ data: null, error: null }),
          delete: () => Promise.resolve({ data: null, error: null }),
        }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
        }
      } as any;
    })();

/**
 * Mengambil statistik sistem (Dummy / Firebase mode).
 */
export const getSystemStats = async () => {
  // Return static/dummy data karena kita sekarang menggunakan Firebase
  return {
    diskUsage: {
      total: '500GB',
      used: '142GB',
      free: '358GB',
      percent: 28
    },
    traffic: {
      views: 12500, // Dummy fallback
      clicks: 450
    },
    status: 'Firebase Active'
  };
};
