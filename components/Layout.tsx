
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient.ts';
import AuthModal from './AuthModal.tsx';
import { fetchMovies } from '../services/animeApi.ts';
import { Anime } from '../types.ts';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<Anime[]>([]);
  const [showNotif, setShowNotif] = useState(false);

  const menuItems = [
    { name: 'Home', icon: 'fa-house', path: '/' },
    { name: 'Discovery', icon: 'fa-compass', path: '/discovery' },
    { name: 'Community', icon: 'fa-users', path: '/community' },
  ];

  const libraryItems = [
    { name: 'Recent', icon: 'fa-clock-rotate-left', path: '/recent' },
    { name: 'My Collection', icon: 'fa-bookmark', path: '/collection' },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Ambil data movie untuk notifikasi
    fetchMovies().then(data => {
      setNotifications(data.slice(0, 6)); // Ambil 6 movie terbaru
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen overflow-hidden bg-[#0f1115]">
      {/* Sidebar */}
      <aside className={`w-64 bg-[#16191f] flex-shrink-0 flex flex-col border-r border-[#272a31] transition-all duration-300 ${isSidebarOpen ? 'ml-0' : '-ml-64'}`}>
        <div className="p-8">
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl font-bold tracking-tighter text-white">
              Anime<span className="text-red-600">-X</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-6 space-y-8 overflow-y-auto">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Menu</p>
            <ul className="space-y-2">
              {menuItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      isActive(item.path) ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5`}></i>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Library</p>
            <ul className="space-y-2">
              {libraryItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center space-x-3 p-2 rounded-lg transition-colors ${
                      isActive(item.path) ? 'bg-red-600/10 text-red-500 border-l-2 border-red-600' : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    <i className={`fa-solid ${item.icon} w-5`}></i>
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="p-6 border-t border-[#272a31] space-y-2">
          <Link to="/admin" className="flex items-center space-x-3 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
            <i className="fa-solid fa-gear w-5"></i>
            <span className="text-sm font-medium">Admin Panel</span>
          </Link>
          {user ? (
            <button 
              onClick={handleLogout}
              className="flex w-full items-center space-x-3 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <i className="fa-solid fa-right-from-bracket w-5"></i>
              <span className="text-sm font-medium">Log out</span>
            </button>
          ) : (
            <button 
              onClick={() => setIsAuthModalOpen(true)}
              className="flex w-full items-center space-x-3 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
            >
              <i className="fa-solid fa-right-to-bracket w-5"></i>
              <span className="text-sm font-medium">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 bg-transparent z-10">
          <div className="flex items-center space-x-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-gray-400 hover:text-white">
              <i className="fa-solid fa-bars text-xl"></i>
            </button>
            <nav className="hidden md:flex space-x-6">
              <Link to="/discovery" className="text-sm font-semibold text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-600 pb-1">Series</Link>
              <Link to="/discovery" className="text-sm font-semibold text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-600 pb-1">Movies</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            {/* Notification Bell (Movies) */}
            <div className="relative group">
               <button onClick={() => setShowNotif(!showNotif)} className="relative p-2">
                 <i className="fa-solid fa-bell text-gray-400 hover:text-white cursor-pointer transition-colors text-lg"></i>
                 <span className="absolute top-1 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse border border-[#0f1115]"></span>
               </button>
               
               {/* Dropdown Notification */}
               {showNotif && (
                 <div className="absolute right-0 mt-2 w-80 bg-[#16191f] border border-[#272a31] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="p-4 border-b border-[#272a31] flex justify-between items-center bg-gray-800/30">
                       <h4 className="font-bold text-white text-sm">New Anime Movies</h4>
                       <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold">NEW</span>
                    </div>
                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                       {notifications.map((movie, idx) => (
                         <Link 
                           key={idx} 
                           to={`/anime/${movie.id}`} 
                           onClick={() => setShowNotif(false)}
                           className="flex items-start space-x-3 p-3 hover:bg-[#272a31] transition-colors border-b border-gray-800/50 last:border-0"
                         >
                            <img src={movie.poster} alt="" className="w-12 h-16 object-cover rounded-md bg-gray-800" />
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-bold text-white line-clamp-2 leading-relaxed">{movie.title}</p>
                               <div className="flex items-center space-x-2 mt-1">
                                  <span className="text-[10px] text-yellow-500 font-bold"><i className="fa-solid fa-star mr-1"></i>{movie.score}</span>
                                  <span className="text-[10px] text-gray-500">Movie</span>
                               </div>
                            </div>
                         </Link>
                       ))}
                       {notifications.length === 0 && (
                         <div className="p-8 text-center text-xs text-gray-500">Loading notifications...</div>
                       )}
                    </div>
                 </div>
               )}
            </div>
            
            {user ? (
              <Link to="/profile" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 group-hover:border-red-600 transition-all">
                  <img src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${user.email}&background=random`} alt="Avatar" className="w-full h-full object-cover" />
                </div>
              </Link>
            ) : (
              <button 
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-red-600/20"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar" id="scrollable-content">
          {children}
        </div>

        {/* Auth Modal */}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    </div>
  );
};

export default Layout;
