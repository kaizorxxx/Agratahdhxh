
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'kaken' && password === '040411') {
      sessionStorage.setItem('admin_auth', 'true');
      navigate('/admin');
    } else {
      setError('Invalid admin credentials.');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 animate-fadeIn">
      <div className="w-full max-w-md bg-[#16191f] border border-[#272a31] p-10 rounded-[40px] shadow-2xl relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-red-600/5 blur-3xl rounded-full"></div>
        
        <div className="relative z-10 text-center mb-8">
           <div className="w-16 h-16 bg-red-600/10 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-600/20 shadow-lg shadow-red-600/5">
              <i className="fa-solid fa-user-shield text-2xl"></i>
           </div>
           <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Admin Portal</h2>
           <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Authorized Access Only</p>
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-600/20 text-red-500 text-[10px] font-bold p-4 rounded-2xl mb-6 flex items-center space-x-3">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
           <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Username</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                placeholder="Admin username"
                required
              />
           </div>

           <div className="space-y-2">
              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-[#272a31] rounded-2xl py-4 px-6 text-sm text-white focus:outline-none focus:border-red-600 transition-all placeholder:text-gray-700"
                placeholder="••••••••"
                required
              />
           </div>

           <button 
             type="submit" 
             className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-red-600/20 uppercase text-xs tracking-widest mt-4"
           >
             Enter System
           </button>
        </form>

        <div className="mt-8 text-center">
           <button 
             onClick={() => navigate('/')}
             className="text-[10px] text-gray-600 hover:text-gray-400 font-bold uppercase tracking-widest transition-colors"
           >
             <i className="fa-solid fa-arrow-left mr-2"></i>
             Back to Home
           </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
