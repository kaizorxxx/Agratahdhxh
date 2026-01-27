
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { name: 'Home', icon: 'fa-house', path: '/' },
    { name: 'Discovery', icon: 'fa-compass', path: '/discovery' },
    { name: 'Community', icon: 'fa-users', path: '/community' },
    { name: 'Coming Soon', icon: 'fa-clock', path: '/coming-soon' },
  ];

  const libraryItems = [
    { name: 'Recent', icon: 'fa-clock-rotate-left', path: '/recent' },
    { name: 'My Collection', icon: 'fa-bookmark', path: '/collection' },
    { name: 'Download', icon: 'fa-download', path: '/download' },
  ];

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
          <button className="flex w-full items-center space-x-3 p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors">
            <i className="fa-solid fa-right-from-bracket w-5"></i>
            <span className="text-sm font-medium">Log out</span>
          </button>
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
              <Link to="/series" className="text-sm font-semibold text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-600 pb-1">Series</Link>
              <Link to="/movies" className="text-sm font-semibold text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-600 pb-1">Movies</Link>
              <Link to="/goodies" className="text-sm font-semibold text-gray-300 hover:text-white border-b-2 border-transparent hover:border-red-600 pb-1">Goodies</Link>
            </nav>
          </div>

          <div className="flex items-center space-x-6">
            <div className="relative group">
               <i className="fa-solid fa-bell text-gray-400 hover:text-white cursor-pointer transition-colors text-lg"></i>
               <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full"></span>
            </div>
            <Link to="/profile" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border-2 border-gray-600 group-hover:border-red-600 transition-all">
                <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="w-full h-full object-cover" />
              </div>
              <i className="fa-solid fa-chevron-down text-gray-400 group-hover:text-white text-xs transition-colors"></i>
            </Link>
          </div>
        </header>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </div>

        {/* Sticky Ads (Simulated) */}
        <div className="sticky bottom-0 w-full bg-[#16191f]/90 backdrop-blur-sm border-t border-[#272a31] py-2 flex justify-center items-center z-50">
           <div className="max-w-screen-lg w-full flex justify-center">
              <div className="bg-gray-800/50 rounded-md px-10 py-2 border border-dashed border-gray-600 text-xs text-gray-500 uppercase tracking-widest">
                [ Advertisement Placeholder ]
              </div>
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
