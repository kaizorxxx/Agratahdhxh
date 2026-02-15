import { createClient } from '@supabase/supabase-js';

/**
 * PENTING:
 * File ini dipertahankan agar tidak terjadi error pada import legacy.
 * Karena aplikasi sudah migrasi ke Firebase, Supabase Client ini dibuat
 * agar tidak crash jika env var kosong.
 */

const getEnv = (key: string): string => {
  try {
    // Cek Import Meta Env (Vite Standard)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
    // Cek Process Env (Legacy/Next.js/Polyfill)
    // @ts-ignore
    const envVal = (typeof process !== 'undefined' && process.env && process.env[key]);
    if (envVal) return envVal;
    
    return '';
  } catch (e) {
    return '';
  }
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL') || getEnv('VITE_SUPABASE_URL');
const key = getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY');

let supabaseInstance;

try {
  // Validasi ketat: Pastikan URL ada, bukan placeholder, dan panjangnya valid.
  // Ini mencegah createClient melempar error "supabaseUrl is required".
  const isValid = url && key && url.length > 10 && key.length > 10 && 
                  !url.includes('placeholder') && !url.includes('YOUR_PROJECT_ID');
                  
  if (isValid) {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } else {
    // Lempar error secara sengaja agar masuk ke catch block jika config tidak valid/kosong
    throw new Error("Supabase Credentials Invalid or Missing");
  }
} catch (e) {
  console.warn("Supabase Client Init Skipped (Using Mock for Firebase Mode).");
  
  // Mock Client agar aplikasi tidak crash saat file lain mengimport 'supabase'
  supabaseInstance = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithEmailAndPassword: () => Promise.resolve({ data: {}, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } })
      })
    }
  } as any;
}

export const supabase = supabaseInstance;

/**
 * Mengambil statistik sistem (Dummy / Firebase mode).
 */
export const getSystemStats = async () => {
  return {
    diskUsage: {
      total: '500GB',
      used: '142GB',
      free: '358GB',
      percent: 28
    },
    traffic: {
      views: 12500,
      clicks: 450
    },
    status: 'Firebase Active'
  };
};
