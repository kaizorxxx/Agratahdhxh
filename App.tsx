
import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.tsx';

// --- LAZY LOAD COMPONENTS ---
// Code splitting: Hanya load komponen saat dibutuhkan user
const HomePage = lazy(() => import('./pages/HomePage.tsx'));
const AnimeDetailPage = lazy(() => import('./pages/AnimeDetailPage.tsx'));
const WatchPage = lazy(() => import('./pages/WatchPage.tsx'));
const SearchPage = lazy(() => import('./pages/SearchPage.tsx'));
const DiscoveryPage = lazy(() => import('./pages/DiscoveryPage.tsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.tsx'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage.tsx'));
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx'));

const LoadingFallback = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-black">
    <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

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
        <Suspense fallback={<LoadingFallback />}>
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
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
