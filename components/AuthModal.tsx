
import React, { useState } from 'react';
import { auth, db } from '../firebase.ts';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

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
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);

  if (!isOpen) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validasi Password untuk Sign Up
    if (isSignUp && password !== confirmPassword) {
      setError({ code: 'custom', message: 'Password dan Konfirmasi Password tidak cocok.' });
      setLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        // Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Kirim Email Verifikasi
        await sendEmailVerification(user);

        // Simpan data tambahan ke Firestore
        await setDoc(doc(db, "users", user.uid), {
          email: user.email,
          phone_number: phoneNumber,
          role: 'user',
          bio: 'Anime enthusiast',
          created_at: new Date().toISOString()
        });
        
        setVerificationSent(true);
      } else {
        // Sign In
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      let msg = 'Terjadi kesalahan saat otentikasi.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'Email sudah digunakan. Silakan masuk atau gunakan email lain.';
      } else if (err.code === 'auth/invalid-credential') {
        msg = 'Email atau password salah.';
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Login belum diaktifkan di server.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password terlalu lemah (minimal 6 karakter).';
      }
      setError({ code: err.code || 'unknown', message: msg });
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
    setVerificationSent(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetState();
  };

  if (verificationSent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn">
        <div className="bg-[#16191f] border border-[#272a31] p-8 rounded-[40px] w-full max-w-md shadow-2xl text-center">
            <div className="w-20 h-20 bg-green-600/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-envelope-circle-check text-4xl"></i>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Verifikasi Email</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                Link verifikasi telah dikirim ke <span className="text-white font-bold">{email}</span>. Akun Anda sudah siap digunakan setelah verifikasi.
            </p>
            <button 
                onClick={() => { onClose(); resetState(); }}
                className="bg-white text-black font-black px-8 py-3 rounded-xl uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors"
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
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl"></div>
        
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10">
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">
            {isSignUp ? 'Join Genzuro' : 'Welcome Back'}
          </h2>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mb-8">
            {isSignUp ? 'Mulai petualangan animemu sekarang' : 'Masuk untuk akses koleksi favoritmu'}
          </p>

          {error && (
            <div className="bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-bold p-4 rounded-2xl mb-6">
              <div className="flex items-center space-x-3">
                <i className="fa-solid fa-circle-exclamation text-sm"></i>
                <span className="flex-1">{error.message}</span>
              </div>
              {error.code === 'auth/email-already-in-use' && (
                <button 
                  onClick={toggleMode}
                  className="mt-2 w-full bg-red-600/20 hover:bg-red-600/40 text-red-500 py-2 rounded-xl border border-red-600/20 transition-all uppercase text-[9px] tracking-widest"
                >
                  Klik untuk Masuk (Login)
                </button>
              )}
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
              className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 uppercase text-xs tracking-[0.2em] flex items-center justify-center space-x-3 mt-4"
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
              <button onClick={toggleMode} className="ml-2 text-white hover:text-red-500 transition-colors underline underline-offset-4 decoration-red-600/50">
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
