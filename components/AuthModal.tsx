
import React, { useState } from 'react';
import { supabase } from '../supabaseClient.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessVerify, setShowSuccessVerify] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi Password untuk Sign Up
    if (isSignUp && password !== confirmPassword) {
      setError('Password dan Konfirmasi Password tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              phone_number: phoneNumber,
              full_name: email.split('@')[0], // Default username dari email
            }
          }
        });
        if (error) throw error;
        
        // Tampilkan layar sukses verifikasi email
        setShowSuccessVerify(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat otentikasi.');
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setPhoneNumber('');
    setError(null);
    setShowSuccessVerify(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetState();
  };

  // Tampilan Sukses Verifikasi Email
  if (showSuccessVerify) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#16191f] border border-[#272a31] p-10 rounded-[40px] w-full max-w-md shadow-2xl text-center space-y-6">
          <div className="w-20 h-20 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
            <i className="fa-solid fa-envelope-circle-check text-3xl animate-bounce"></i>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Cek Email Anda</h2>
            <p className="text-gray-400 text-xs font-medium leading-relaxed">
              Kami telah mengirimkan link verifikasi ke <span className="text-white font-bold">{email}</span>. 
              Silakan klik link tersebut untuk mengaktifkan akun Anime-X Anda.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-gray-200 transition-all"
          >
            Mengerti
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#16191f] border border-[#272a31] p-8 rounded-[40px] w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Dekorasi Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
        
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">
            {isSignUp ? 'Join Anime-X' : 'Welcome Back'}
          </h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-8">
            {isSignUp ? 'Mulai petualangan animemu sekarang' : 'Masuk untuk akses koleksi favoritmu'}
          </p>

          {error && (
            <div className="bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-bold p-4 rounded-2xl mb-6 flex items-center space-x-3">
              <i className="fa-solid fa-circle-exclamation text-sm"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <i className="fa-solid fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Nomor Telepon</label>
                <div className="relative">
                  <i className="fa-solid fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                  <input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                    placeholder="0812xxxxxx"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <i className="fa-solid fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Konfirmasi Password</label>
                  <div className="relative">
                    <i className="fa-solid fa-shield-check absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs"></i>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                      placeholder="Ulangi password"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 uppercase text-xs tracking-[0.2em] flex items-center justify-center space-x-3 mt-4 transform active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Daftar Sekarang' : 'Masuk'}</span>
                  <i className="fa-solid fa-arrow-right-long text-xs"></i>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
              {isSignUp ? 'Sudah punya akun?' : "Belum punya akun?"}
              <button 
                onClick={toggleMode} 
                className="ml-2 text-white hover:text-red-500 transition-colors underline underline-offset-4 decoration-red-600/50"
              >
                {isSignUp ? 'Sign In Disini' : 'Daftar Disini'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
