
/**
 * FILE NON-AKTIF
 * Supabase telah dihapus sepenuhnya dari proyek ini.
 * Aplikasi sekarang menggunakan Firebase.
 */

export const supabase = null;

// Fungsi dummy agar tidak break import di file lain (jika masih ada yang import)
export const getSystemStats = async () => ({
  status: 'Firebase Active'
});
