
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
        setScrolled(scrollable.scrollTop > 20);
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
      
      {/* MOBILE Sidebar / Drawer (Hidden on Desktop) */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-[#222] z-[70] transition-transform duration-300 transform lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full p-6">
          <Link to="/" onClick={() => setIsSidebarOpen(false)} className="flex items-center space-x-3 mb-12 px-2">
            <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
              <span className="text-xl font-black italic text-white">G</span>
            </div>
            <span className="text-2xl font-black tracking-tighter italic text-white">GENZURO</span>
          </Link>

          <nav className="flex-1 space-y-2">
            {menuLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link 
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center p-4 rounded-xl transition-all duration-300 group ${
                    isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="w-6 flex justify-center">
                    <i className={`fa-solid ${link.icon} text-lg`}></i>
                  </div>
                  <span className="ml-4 font-bold text-xs uppercase tracking-wider">
                    {link.name}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-8 border-t border-[#222]">
             {user ? (
               <button 
                onClick={() => { signOut(auth); setIsSidebarOpen(false); }}
                className="flex items-center w-full p-4 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all group"
               >
                 <i className="fa-solid fa-right-from-bracket text-lg"></i>
                 <span className="ml-4 font-bold text-[10px] uppercase tracking-widest">Logout</span>
               </button>
             ) : (
               <button 
                onClick={() => { setIsAuthModalOpen(true); setIsSidebarOpen(false); }}
                className="flex items-center w-full p-4 rounded-xl bg-[#222] text-gray-400 hover:text-white transition-all group"
               >
                 <i className="fa-solid fa-user-plus text-lg"></i>
                 <span className="ml-4 font-bold text-[10px] uppercase tracking-widest">Login</span>
               </button>
             )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative overflow-hidden w-full">
        
        {/* TOP NAVIGATION BAR (Desktop & Mobile) */}
        <header className={`fixed top-0 inset-x-0 h-20 px-6 md:px-12 flex items-center justify-between z-[60] transition-all duration-300 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-[#222]' : 'bg-gradient-to-b from-black/80 to-transparent'}`}>
            
            {/* Left: Logo & Mobile Toggle */}
            <div className="flex items-center gap-6">
                <button 
                  onClick={() => setIsSidebarOpen(true)} 
                  className="lg:hidden w-10 h-10 flex items-center justify-center text-white"
                >
                  <i className="fa-solid fa-bars text-xl"></i>
                </button>
                
                <Link to="/" className="flex items-center gap-3 group">
                   <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center transform group-hover:rotate-12 transition-transform">
                      <span className="font-black italic text-white">G</span>
                   </div>
                   <span className="font-black italic text-xl tracking-tighter">GENZURO</span>
                </Link>

                {/* DESKTOP MENU LINKS (Center-Left) */}
                <nav className="hidden lg:flex items-center ml-8 space-x-1">
                   {menuLinks.slice(0, 3).map((link) => {
                      const isActive = location.pathname === link.path;
                      return (
                        <Link 
                           key={link.name}
                           to={link.path}
                           className={`px-5 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest transition-all ${
                              isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
                           }`}
                        >
                           {link.name}
                        </Link>
                      );
                   })}
                </nav>
            </div>
            
            {/* Right: Search & Profile */}
            <div className="flex items-center space-x-4">
                <Link to="/search" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group">
                  <i className="fa-solid fa-magnifying-glass text-sm text-gray-300 group-hover:text-white"></i>
                </Link>
                
                {user ? (
                   <Link to="/profile" className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-all border border-transparent hover:border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 hidden md:block">
                          {user.displayName?.split(' ')[0] || 'User'}
                      </span>
                      <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-8 h-8 rounded-full object-cover border border-[#333]" alt="" />
                   </Link>
                ) : (
                  <button onClick={() => setIsAuthModalOpen(true)} className="bg-red-600 text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20">
                      Sign In
                  </button>
                )}
            </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto hide-scrollbar scroll-smooth" id="scrollable-content">
           {children}
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[65] lg:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </main>
    </div>
  );
};

export default Layout;
