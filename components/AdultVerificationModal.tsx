
import React, { useEffect, useState } from 'react';

const AdultVerificationModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    const isVerified = localStorage.getItem('genzuro_adult_verified');
    // Jika belum diverifikasi, jangan langsung munculkan (opsional), 
    // atau munculkan saat user akses genre tertentu. 
    // Di sini kita buat event listener custom agar bisa dipanggil dari mana saja.
    
    const handleCheck = () => setIsOpen(true);
    window.addEventListener('trigger-18-check', handleCheck);

    return () => window.removeEventListener('trigger-18-check', handleCheck);
  }, []);

  const handleVerify = () => {
    localStorage.setItem('genzuro_adult_verified', 'true');
    setIsOpen(false);
    window.dispatchEvent(new Event('18-verified')); // Notify listeners
  };

  const handleDecline = () => {
    window.location.href = 'https://www.google.com'; // Redirect away
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn">
      <div className="max-w-md w-full bg-[#111] border border-red-600/30 rounded-3xl p-8 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
        
        <div className="w-20 h-20 bg-red-600/10 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-600/20">
            <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
        </div>

        <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-2">
            Peringatan Keras
        </h2>
        <p className="text-red-500 font-bold text-xs uppercase tracking-[0.3em] mb-6">
            Konten Dewasa (18+)
        </p>

        <div className="bg-red-900/10 border border-red-900/30 p-4 rounded-xl mb-8">
            <p className="text-gray-300 text-sm leading-relaxed font-medium">
                Website ini berisi konten yang mungkin tidak layak untuk anak di bawah umur. 
                Dengan melanjutkan, Anda menyatakan bahwa Anda berusia di atas <span className="text-white font-bold">18 tahun</span>.
            </p>
            <p className="text-red-400 text-xs font-bold mt-3 uppercase italic">
                "Segala dosa dan dampak psikologis ditanggung oleh pengguna masing-masing."
            </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
            <button 
                onClick={handleVerify}
                className="bg-red-600 hover:bg-red-700 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02]"
            >
                Saya Mengerti & Lanjut
            </button>
            <button 
                onClick={() => setIsOpen(false)}
                className="bg-[#222] hover:bg-[#333] text-gray-400 py-4 rounded-xl font-bold uppercase text-xs tracking-widest transition-all"
            >
                Batalkan
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdultVerificationModal;
