import { createClient } from '@supabase/supabase-js';

// Helper untuk membaca environment variables dengan aman
const getEnv = (key: string): string => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
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

// Definisi Mock Client untuk mode Firebase (atau jika kredensial Supabase kosong)
// Objek ini meniru struktur Supabase Client agar tidak error saat di-import file lain
const mockClient = {
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
};

let supabaseInstance = mockClient;

// Hanya inisialisasi Supabase jika URL dan Key BENAR-BENAR ada dan valid
// Cek 'http' untuk memastikan URL valid dan key cukup panjang
if (url && key && url.startsWith('http') && key.length > 20 && !url.includes('placeholder')) {
  try {
    supabaseInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    });
  } catch (e) {
    console.warn("Gagal menginisialisasi Supabase, beralih ke Mock Client.", e);
    supabaseInstance = mockClient;
  }
} else {
  // Log agar developer tahu bahwa mode Firebase sedang aktif
  console.log("Mode Firebase Aktif: Supabase Client menggunakan Mock (Dummy).");
}

export const supabase = supabaseInstance as any;

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
