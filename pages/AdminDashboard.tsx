
import React, { useState, useEffect } from 'react';
import { getSystemStats, supabase } from '../supabaseClient';
import { Banner, Ad } from '../types';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('stats');
  const [banners, setBanners] = useState<Banner[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  
  // Banner Form State
  const [bannerUrl, setBannerUrl] = useState('');
  const [bannerLink, setBannerLink] = useState('');
  const [bannerSize, setBannerSize] = useState<'728x90' | '300x250' | 'hero'>('728x90');

  useEffect(() => {
    getSystemStats().then(setStats);
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from('banners').select('*').order('id', { ascending: false });
    const { data: aData } = await supabase.from('ads').select('*').order('id', { ascending: false });
    if (bData) setBanners(bData);
    if (aData) setAds(aData);
  };

  const handleAddBanner = async () => {
    if (!bannerUrl || !bannerLink) return;
    const { error } = await supabase.from('banners').insert({
      image_url: bannerUrl,
      link: bannerLink,
      size: bannerSize,
      is_active: true
    });
    if (!error) {
      setBannerUrl('');
      setBannerLink('');
      fetchData();
    }
  };

  const toggleBannerStatus = async (id: string, current: boolean) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id);
    fetchData();
  };

  const deleteBanner = async (id: string) => {
    await supabase.from('banners').delete().eq('id', id);
    fetchData();
  };

  if (!stats) return null;

  return (
    <div className="px-8 pb-12 space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between py-6 gap-4">
         <h1 className="text-3xl font-black">Admin <span className="text-red-600">Dashboard</span></h1>
         <div className="flex bg-[#16191f] p-1 rounded-xl border border-[#272a31] overflow-x-auto">
            {['stats', 'banners', 'ads'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-gray-500 hover:text-white'}`}
              >
                 {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
         </div>
      </div>

      {activeTab === 'stats' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div className="bg-[#16191f] p-6 rounded-3xl border border-[#272a31]">
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center mb-4">
                   <i className="fa-solid fa-eye text-xl"></i>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Views</p>
                <h3 className="text-2xl font-black">{stats.traffic.views.toLocaleString()}</h3>
             </div>
             <div className="bg-[#16191f] p-6 rounded-3xl border border-[#272a31]">
                <div className="w-12 h-12 bg-green-600/10 text-green-500 rounded-xl flex items-center justify-center mb-4">
                   <i className="fa-solid fa-mouse-pointer text-xl"></i>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Ad Clicks</p>
                <h3 className="text-2xl font-black">{stats.traffic.clicks.toLocaleString()}</h3>
             </div>
             <div className="bg-[#16191f] p-6 rounded-3xl border border-[#272a31]">
                <div className="w-12 h-12 bg-purple-600/10 text-purple-500 rounded-xl flex items-center justify-center mb-4">
                   <i className="fa-solid fa-hard-drive text-xl"></i>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Disk Health</p>
                <div className="flex items-center space-x-2">
                   <h3 className="text-2xl font-black">{stats.diskUsage.percent}%</h3>
                   <span className="text-xs text-gray-500 italic">Used</span>
                </div>
             </div>
             <div className="bg-[#16191f] p-6 rounded-3xl border border-[#272a31]">
                <div className="w-12 h-12 bg-orange-600/10 text-orange-500 rounded-xl flex items-center justify-center mb-4">
                   <i className="fa-solid fa-server text-xl"></i>
                </div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Status</p>
                <h3 className="text-2xl font-black text-green-500">Normal</h3>
             </div>
          </div>

          <div className="bg-[#16191f] p-8 rounded-3xl border border-[#272a31]">
             <h3 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <i className="fa-solid fa-microchip text-red-600"></i>
                <span>Disk Checker Script</span>
             </h3>
             <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-green-400">
                <p>$ df -h</p>
                <p>Filesystem Size Used Avail Use% Mounted on</p>
                <p>/dev/sda1 {stats.diskUsage.total} {stats.diskUsage.used} {stats.diskUsage.free} {stats.diskUsage.percent}% /</p>
                <p>Status: All systems check out fine.</p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'banners' && (
        <div className="space-y-6">
           <div className="bg-[#16191f] p-8 rounded-3xl border border-[#272a31]">
              <h3 className="text-xl font-bold mb-6">Create New Banner</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Banner Image URL</label>
                    <input 
                      type="text" 
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      className="w-full bg-gray-900 border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" 
                      placeholder="https://..." 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Target Link</label>
                    <input 
                      type="text" 
                      value={bannerLink}
                      onChange={(e) => setBannerLink(e.target.value)}
                      className="w-full bg-gray-900 border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600" 
                      placeholder="https://..." 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Banner Size</label>
                    <select 
                      value={bannerSize}
                      onChange={(e) => setBannerSize(e.target.value as any)}
                      className="w-full bg-gray-900 border border-[#272a31] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-red-600 appearance-none"
                    >
                       <option value="728x90">728x90 (Leaderboard)</option>
                       <option value="300x250">300x250 (Sidebar Box)</option>
                       <option value="hero">Hero / Top Slider</option>
                    </select>
                 </div>
                 <div className="flex items-end">
                    <button 
                      onClick={handleAddBanner}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-red-600/20"
                    >
                      Publish Banner
                    </button>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#16191f] rounded-3xl border border-[#272a31] overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-800/50 border-b border-[#272a31] text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                       <th className="px-6 py-4">Image Preview</th>
                       <th className="px-6 py-4">Type</th>
                       <th className="px-6 py-4">Status</th>
                       <th className="px-6 py-4">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-[#272a31]">
                    {banners.map(banner => (
                      <tr key={banner.id}>
                        <td className="px-6 py-4">
                          <img src={banner.image_url} className="h-10 w-24 object-cover rounded-md border border-gray-700" alt="Banner" />
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-bold">{banner.size}</td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => toggleBannerStatus(banner.id, banner.is_active)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                              banner.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                            }`}
                          >
                            {banner.is_active ? 'ACTIVE' : 'INACTIVE'}
                          </button>
                        </td>
                        <td className="px-6 py-4 flex space-x-4">
                           <button onClick={() => deleteBanner(banner.id)} className="text-red-500 hover:text-red-400 transition-colors">
                              <i className="fa-solid fa-trash"></i>
                           </button>
                        </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="space-y-6">
           <div className="bg-[#16191f] p-8 rounded-3xl border border-[#272a31]">
              <h3 className="text-xl font-bold mb-6">Ad Script Configuration</h3>
              <p className="text-xs text-gray-500 mb-6 italic">Inject third-party scripts (Adsterra, Monetag, etc.) into specific slots.</p>
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">Placement Target</label>
                    <select className="w-full bg-gray-900 border border-[#272a31] rounded-xl px-4 py-3 text-sm">
                       <option>Sidebar Fixed</option>
                       <option>Sticky Bottom Floating</option>
                       <option>Interstitial Popup</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase">HTML / JS Script</label>
                    <textarea 
                      className="w-full bg-gray-900 border border-[#272a31] rounded-xl px-4 py-4 text-xs font-mono h-40 focus:outline-none focus:border-red-600"
                      placeholder="<!-- Paste your ad code snippet here -->"
                    ></textarea>
                 </div>
                 <button className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-red-600/20">
                    Update Ad Network
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
