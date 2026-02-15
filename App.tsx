
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import HomePage from './pages/HomePage.tsx';
import AnimeDetailPage from './pages/AnimeDetailPage.tsx';
import WatchPage from './pages/WatchPage.tsx';
import SearchPage from './pages/SearchPage.tsx';
import DiscoveryPage from './pages/DiscoveryPage.tsx';
import AdminDashboard from './pages/AdminDashboard.tsx';
import AdminLoginPage from './pages/AdminLoginPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-[70vh] space-y-4">
    <i className="fa-solid fa-hammer text-5xl text-red-600 opacity-20"></i>
    <h2 className="text-2xl font-black uppercase italic">{title}</h2>
    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Halaman ini sedang dalam pengembangan.</p>
  </div>
);

// Protected Admin Route
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdmin = sessionStorage.getItem('admin_auth') === 'true';
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

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
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Admin Routes */}
          <Route path="/adminlogin" element={<AdminLoginPage />} />
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } 
          />
          
          <Route path="/community" element={<PlaceholderPage title="Community" />} />
          <Route path="/coming-soon" element={<PlaceholderPage title="Coming Soon" />} />
          <Route path="/series" element={<DiscoveryPage />} />
          <Route path="/movies" element={<DiscoveryPage />} />
          <Route path="/recent" element={<HomePage />} />
          <Route path="/collection" element={<PlaceholderPage title="My Collection" />} />
          <Route path="/download" element={<PlaceholderPage title="Downloads" />} />
          
          {/* Catch-all route to prevent 404 within the app */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
