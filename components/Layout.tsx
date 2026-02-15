
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth } from '../firebase.ts';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import AuthModal from './AuthModal.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const handleScroll = () => {
      const scrollable = document.getElementById('scrollable-content');
      if (scrollable) {
        setScrolled(scrollable.scrollTop > 50);
      }
    };

    const scrollContainer = document.getElementById('scrollable-content');
    scrollContainer?.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      scrollContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const menuLinks = [
    { name: 'Home', path: '/', icon: 'fa-house' },
    { name: 'Discovery', path: '/discovery', icon: 'fa-compass' },
    { name: 'Movies', path: '/discovery?type=movie', icon: 'fa-film' },
    { name: 'Search', path: '/search', icon: 'fa-magnifying-glass' },
    { name: 'Profile', path: '/profile', icon: 'fa-user' },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-black text-white font-['Inter']">
      
      {/* Sidebar Overlay */}
      <aside 
        className={`fixed inset-y-0 left-0 w-80 bg-black/60 backdrop-blur-3xl border-r border-white/5 z-[70] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] transform ${
          isSidebarOpen ? 'translate-x-0 shadow-[20px_0_60px_rgba(0,0,0,0.8)]' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:w-28 xl:w-80`}
      >
        <div className="flex flex-col h-full p-8">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center space-x-4 mb-16 px-2">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.4)]">
              <span className="text-2xl font-black italic">G</span>
            </div>
            <span className="text-3xl font-black tracking-tighter italic xl:block hidden">GENZURO</span>
          </Link>

          <nav className="flex-1 space-y-3">
            {menuLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center p-5 rounded-[24px] transition-all duration-500 group relative overflow-hidden ${
                    isActive 
                    ? 'bg-red-600 text-white shadow-[0_10px_25px_rgba(220,38,38,0.3)]' 
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="w-6 flex justify-center z-10">
                    <i className={`fa-solid ${link.icon} text-lg`}></i>
                  </div>
                  <span className={`ml-6 font-black text-xs uppercase tracking-[0.2em] z-10 xl:block hidden`}>
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-8 border-t border-white/5">
             {user ? (
               <button 
                onClick={() => { signOut(auth); setIsSidebarOpen(false); }}
                className="flex items-center w-full p-5 rounded-[24px] text-gray-600 hover:text-red-500 hover:bg-red-500/5 transition-all group"
               >
                 <i className="fa-solid fa-right-from-bracket text-lg"></i>
                 <span className="ml-6 font-black text-[10px] uppercase tracking-widest xl:block hidden">Logout</span>
               </button>
             ) : (
               <button 
                onClick={() => { setIsAuthModalOpen(true); setIsSidebarOpen(false); }}
                className="flex items-center w-full p-5 rounded-[24px] bg-white/5 text-gray-400 hover:text-white transition-all shadow-lg group"
               >
                 <i className="fa-solid fa-user-plus text-lg"></i>
                 <span className="ml-6 font-black text-[10px] uppercase tracking-widest xl:block hidden">Sign In</span>
               </button>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Universal Header */}
        <header className={`fixed top-0 right-0 left-0 lg:left-28 xl:left-80 h-24 px-8 md:px-12 flex items-center justify-between z-[65] transition-all duration-500 ${scrolled ? 'bg-black/80 backdrop-blur-2xl border-b border-white/5 shadow-2xl' : 'bg-transparent'}`}>
            <div className="flex items-center space-x-6">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white border border-white/10"
                >
                  <i className="fa-solid fa-bars-staggered text-xl"></i>
                </button>
                <Link to="/" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-red-600 transition-all border border-white/5 shadow-xl group">
                  <i className="fa-solid fa-house text-sm"></i>
                </Link>
                {scrolled && (
                   <span className="text-sm font-black italic tracking-tight text-white/50 uppercase hidden md:block">GENZURO</span>
                )}
            </div>
            
            <div className="flex items-center space-x-4">
                <Link to="/search" className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 group">
                  <i className="fa-solid fa-magnifying-glass text-sm group-hover:scale-125 transition-transform text-red-600"></i>
                </Link>
                
                {user ? (
                   <Link to="/profile" className="flex items-center space-x-4 bg-white/5 p-1.5 pr-4 md:pr-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all">
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-9 h-9 rounded-xl object-cover border border-white/10" alt="" />
                      <div className="hidden xl:block">
                        <p className="text-[10px] font-black text-white uppercase truncate w-24">{user.displayName || 'Account'}</p>
                      </div>
                   </Link>
                ) : (
                  <button onClick={() => setIsAuthModalOpen(true)} className="bg-red-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hidden md:block">Login</button>
                )}
            </div>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth" id="scrollable-content">
          <div className="pt-24 min-h-screen">
             {children}
          </div>
        </div>

        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[68] lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    </div>
  );
};

export default Layout;
