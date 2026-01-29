
import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AnimeDetailPage from './pages/AnimeDetailPage';
import WatchPage from './pages/WatchPage';
import SearchPage from './pages/SearchPage';
import DiscoveryPage from './pages/DiscoveryPage';
import AdminDashboard from './pages/AdminDashboard';

// Placeholder untuk rute yang belum dibuat
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
    <i className="fa-solid fa-hammer text-5xl text-red-600 opacity-20"></i>
    <h2 className="text-2xl font-black uppercase italic">{title}</h2>
    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Halaman ini sedang dalam pengembangan.</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/discovery" element={<DiscoveryPage />} />
          <Route path="/anime/:id" element={<AnimeDetailPage />} />
          <Route path="/watch/:animeId/:epId" element={<WatchPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          
          {/* Rute Navigasi Tambahan */}
          <Route path="/community" element={<PlaceholderPage title="Community" />} />
          <Route path="/coming-soon" element={<PlaceholderPage title="Coming Soon" />} />
          <Route path="/series" element={<DiscoveryPage />} />
          <Route path="/movies" element={<DiscoveryPage />} />
          <Route path="/recent" element={<HomePage />} />
          <Route path="/collection" element={<PlaceholderPage title="My Collection" />} />
          <Route path="/download" element={<PlaceholderPage title="Downloads" />} />
          <Route path="/profile" element={<PlaceholderPage title="User Profile" />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
