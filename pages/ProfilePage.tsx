
import React, { useState, useEffect, useRef } from 'react';
import { auth, db, storage } from '../firebase.ts';
import { updateProfile, updatePassword, sendEmailVerification, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate, Link } from 'react-router-dom';
import { getUserHistoryFromFirestore } from '../services/historyService.ts';
import { HistoryItem } from '../types.ts';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [activeTab, setActiveTab] = useState<'history' | 'settings'>('history');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  // Settings State
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setDisplayName(user.displayName || '');
        setPhotoURL(user.photoURL || '');
        
        // Fetch User Details from Firestore
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setBio(data.bio || '');
            if(!user.displayName && data.username) setDisplayName(data.username);
          }
        } catch (err) {
          console.warn("Error fetching profile metadata:", err);
        }

        // Fetch History
        try {
          const hist = await getUserHistoryFromFirestore();
          setHistory(hist);
        } catch (err) {
           console.warn("Error fetching history:", err);
        }
      } else {
        // Only redirect if we are truly unauthenticated (not just waiting)
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentUser) {
      const file = e.target.files[0];
      setUploading(true);
      setMessage(null);
      
      try {
        const storageRef = ref(storage, `avatars/${currentUser.uid}/${Date.now()}_${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);

        await updateProfile(currentUser, { photoURL: downloadURL });
        await updateDoc(doc(db, "users", currentUser.uid), { avatar_url: downloadURL });
        
        setPhotoURL(downloadURL);
        setMessage({ type: 'success', text: 'Foto profil berhasil diperbarui!' });
      } catch (err: any) {
        console.error(err);
        setMessage({ type: 'error', text: 'Gagal mengupload gambar. Cek izin Storage.' });
      } finally {
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    setMessage(null);

    try {
      if (displayName !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName });
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        bio: bio,
        username: displayName
      });

      if (newPassword) {
        await updatePassword(currentUser, newPassword);
      }

      setMessage({ type: 'success', text: 'Profil berhasil disimpan!' });
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setMessage({ type: 'error', text: 'Untuk mengganti password, silakan logout dan login kembali.' });
      } else {
        setMessage({ type: 'error', text: 'Gagal mengupdate profil.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if(currentUser && !currentUser.emailVerified) {
        try {
            await sendEmailVerification(currentUser);
            setMessage({ type: 'success', text: 'Email verifikasi dikirim ulang.' });
        } catch(e) {
            setMessage({ type: 'error', text: 'Gagal mengirim email.' });
        }
    }
  };

  if (!currentUser) return (
    <div className="flex items-center justify-center h-[70vh]">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="px-8 pb-12 pt-4 space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Profile */}
      <div className="bg-[#16191f] border border-[#272a31] rounded-[40px] p-8 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-red-900/20 to-transparent"></div>
         
         <div className="relative z-10 flex flex-col md:flex-row items-end md:items-center gap-8 pt-10">
            <div className="relative group">
                <div className="w-32 h-32 rounded-full border-4 border-[#0f1115] bg-gray-700 overflow-hidden shadow-2xl">
                    <img 
                        src={photoURL || `https://ui-avatars.com/api/?name=${currentUser.email}&background=random`} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                    />
                    {uploading && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                </div>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition-colors"
                >
                    <i className="fa-solid fa-camera text-sm"></i>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                />
            </div>
            
            <div className="flex-1">
                <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">{displayName || 'User Anime-X'}</h1>
                <p className="text-gray-400 text-sm mt-1">{currentUser.email}</p>
                
                {!currentUser.emailVerified && (
                    <div className="mt-3 inline-flex items-center space-x-3 bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-500"></i>
                        <span className="text-xs text-yellow-500 font-bold">Email belum diverifikasi</span>
                        <button onClick={handleResendVerification} className="text-xs underline text-yellow-500 hover:text-white">Kirim Ulang</button>
                    </div>
                )}

                <p className="mt-4 text-gray-300 text-sm max-w-2xl italic">"{bio || 'Belum ada bio.'}"</p>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex space-x-6 mt-10 border-b border-[#272a31]">
             <button 
                onClick={() => setActiveTab('history')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'history' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
             >
                Watch History
             </button>
             <button 
                onClick={() => setActiveTab('settings')}
                className={`pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-colors border-b-2 ${activeTab === 'settings' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
             >
                Edit Profile
             </button>
         </div>
      </div>

      {message && (
        <div className={`p-4 rounded-2xl flex items-center space-x-3 font-bold text-sm ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            <i className={`fa-solid ${message.type === 'success' ? 'fa-check' : 'fa-triangle-exclamation'}`}></i>
            <span>{message.text}</span>
        </div>
      )}

      {/* Content */}
      {activeTab === 'history' && (
         <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic">Riwayat Menonton</h3>
            {history.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <i className="fa-solid fa-clock-rotate-left text-4xl mb-4 opacity-50"></i>
                    <p className="text-xs font-bold uppercase tracking-widest">Belum ada riwayat nonton</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {history.map((item) => (
                        <Link to={`/watch/${encodeURIComponent(item.anime_id)}/${encodeURIComponent(item.ep_id)}`} key={item.id} className="flex items-center space-x-4 bg-[#16191f] p-3 rounded-2xl border border-[#272a31] hover:border-red-600 transition-colors group">
                            <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-black">
                                <img src={item.anime_poster} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                <div className="absolute bottom-0 left-0 h-1 bg-red-600 w-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-white truncate">{item.anime_title}</h4>
                                <p className="text-xs text-red-500 font-bold mt-1">{item.ep_title}</p>
                                <p className="text-[10px] text-gray-500 mt-2">{new Date(item.updated_at).toLocaleDateString()}</p>
                            </div>
                            <button className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center text-gray-400 group-hover:bg-red-600 group-hover:text-white transition-all">
                                <i className="fa-solid fa-play text-xs"></i>
                            </button>
                        </Link>
                    ))}
                </div>
            )}
         </div>
      )}

      {activeTab === 'settings' && (
         <form onSubmit={handleUpdateProfile} className="max-w-2xl space-y-8">
            <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic border-b border-[#272a31] pb-2">Informasi Dasar</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Username</label>
                        <input 
                            type="text" 
                            value={displayName} 
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="w-full bg-[#16191f] border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Email (Tidak dapat diubah)</label>
                        <input 
                            type="text" 
                            value={currentUser.email || ''} 
                            disabled 
                            className="w-full bg-[#0f1115] border border-[#272a31] rounded-xl px-4 py-3 text-sm text-gray-500 cursor-not-allowed"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Bio / Tentang Saya</label>
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full bg-[#16191f] border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors h-24 resize-none"
                        placeholder="Tulis sesuatu tentang dirimu..."
                    ></textarea>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-black uppercase italic border-b border-[#272a31] pb-2">Keamanan</h3>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ganti Password Baru</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Kosongkan jika tidak ingin mengganti"
                        className="w-full bg-[#16191f] border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 transition-colors"
                    />
                    <p className="text-[10px] text-gray-500">Minimal 6 karakter.</p>
                </div>
            </div>

            <div className="pt-4">
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-3 rounded-xl uppercase text-xs tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center space-x-2"
                >
                    {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                    <span>Simpan Perubahan</span>
                </button>
            </div>
         </form>
      )}
    </div>
  );
};

export default ProfilePage;
