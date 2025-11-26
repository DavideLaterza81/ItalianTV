import React, { useState, useMemo, useEffect } from 'react';
import { SYSTEM_CHANNELS } from './constants';
import { Channel, ChannelCategory } from './types';
import { ChannelCard } from './components/ChannelCard';
import { VideoPlayer } from './components/VideoPlayer';
import { GeminiAssistant } from './components/GeminiAssistant';
import { AdminLogin } from './components/AdminLogin';
import { AdminDashboard } from './components/AdminDashboard';
import { NewsTicker } from './components/NewsTicker';

const DB_KEY = 'tv_italia_channels_v2'; 

const App: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ChannelCategory>(ChannelCategory.ALL);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // App State: 'user' | 'admin_login' | 'admin_dashboard'
  const [viewState, setViewState] = useState<'user' | 'admin_login' | 'admin_dashboard'>('user');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load Channels from LocalStorage "DB"
  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = () => {
    const savedDB = localStorage.getItem(DB_KEY);
    let finalChannels: Channel[] = [];

    if (savedDB) {
      try {
        const dbChannels: Channel[] = JSON.parse(savedDB);
        const systemIds = SYSTEM_CHANNELS.map(s => s.id);
        
        // 1. Keep non-system channels
        const userChannels = dbChannels.filter(c => !systemIds.includes(c.id));
        
        // 2. Merge System channels (preserving dynamic data like viewCount, rating, order)
        const mergedSystemChannels = SYSTEM_CHANNELS.map(sysChannel => {
          const saved = dbChannels.find(d => d.id === sysChannel.id);
          return saved ? { 
              ...sysChannel, 
              viewCount: saved.viewCount || 0, 
              rating: saved.rating || 0,
              order: saved.order || sysChannel.order 
          } : sysChannel;
        });

        finalChannels = [...mergedSystemChannels, ...userChannels];
      } catch (e) {
        console.error("Error parsing DB", e);
        finalChannels = [...SYSTEM_CHANNELS];
      }
    } else {
      // Init DB with System Channels
      finalChannels = SYSTEM_CHANNELS.map(ch => ({
        ...ch,
        viewCount: 0 
      }));
    }

    // --- SORTING LOGIC ---
    // 1. StileTV always first
    // 2. SET always second
    // 3. Others by 'order' property
    finalChannels.sort((a, b) => {
        if (a.id === 'stiletv') return -1;
        if (b.id === 'stiletv') return 1;
        
        if (a.id === 'settv') return -1;
        if (b.id === 'settv') return 1;

        const orderA = a.order !== undefined ? a.order : 999;
        const orderB = b.order !== undefined ? b.order : 999;
        
        return orderA - orderB;
    });

    setChannels(finalChannels);
    saveToStorage(finalChannels);
  };

  const saveToStorage = (updatedChannels: Channel[]) => {
    localStorage.setItem(DB_KEY, JSON.stringify(updatedChannels));
  };

  // Filter logic
  const filteredChannels = useMemo(() => {
    return channels.filter(channel => {
      const matchesCategory = selectedCategory === ChannelCategory.ALL || channel.category === selectedCategory;
      const matchesSearch = channel.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            channel.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [channels, selectedCategory, searchTerm]);

  // Seperazione Canale in Evidenza (Hero) vs Altri
  const featuredChannel = filteredChannels.length > 0 ? (filteredChannels.find(c => c.id === 'stiletv') || filteredChannels[0]) : null;
  const otherChannels = useMemo(() => {
      return filteredChannels.filter(c => c.id !== featuredChannel?.id);
  }, [filteredChannels, featuredChannel]);

  // Ranking Logic (Sort by Rating Descending)
  const topRatedChannels = useMemo(() => {
    return [...channels]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 5);
  }, [channels]);

  // Admin Actions
  const handleAdminAddChannel = (newChannel: Channel) => {
    // New channels go to the end by default if no order specified
    const maxOrder = Math.max(...channels.map(c => c.order || 0), 0);
    if (!newChannel.order) newChannel.order = maxOrder + 1;

    const updated = [...channels, newChannel];
    setChannels(updated);
    saveToStorage(updated);
    // Reload to apply sort
    setTimeout(loadChannels, 50);
  };

  const handleAdminUpdateChannel = (updatedChannel: Channel) => {
    const updated = channels.map(c => c.id === updatedChannel.id ? updatedChannel : c);
    setChannels(updated);
    saveToStorage(updated);
    // Reload to apply sort
    setTimeout(loadChannels, 50);
  };

  const handleAdminDeleteChannel = (id: string) => {
    const updated = channels.filter(c => c.id !== id);
    setChannels(updated);
    saveToStorage(updated);
  };

  // User Actions
  const handleRateChannel = (id: string, rating: number) => {
    const updated = channels.map(ch => ch.id === id ? { ...ch, rating } : ch);
    setChannels(updated);
    saveToStorage(updated);
  };

  const handleChannelView = (id: string) => {
    const updated = channels.map(ch => 
      ch.id === id ? { ...ch, viewCount: (ch.viewCount || 0) + 1 } : ch
    );
    setChannels(updated);
    saveToStorage(updated);
    
    const ch = updated.find(c => c.id === id);
    if (ch) setCurrentChannel(ch);
  };

  const handleRecommendationClick = (channelId: string) => {
    const channel = channels.find(c => c.id === channelId);
    if (channel) {
      setCurrentChannel(channel);
    }
  };

  // Helper for stars in Hero
  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <i key={i} className={`fa-solid fa-star text-sm md:text-base ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}></i>
    ));
  };

  // --- RENDER ---

  if (viewState === 'admin_login') {
    return (
      <AdminLogin 
        onLogin={() => setViewState('admin_dashboard')} 
        onCancel={() => setViewState('user')} 
      />
    );
  }

  if (viewState === 'admin_dashboard') {
    return (
      <AdminDashboard
        channels={channels}
        onAddChannel={handleAdminAddChannel}
        onUpdateChannel={handleAdminUpdateChannel}
        onDeleteChannel={handleAdminDeleteChannel}
        onLogout={() => setViewState('user')}
      />
    );
  }

  // DEFAULT USER VIEW
  return (
    <div className="min-h-screen bg-brand-dark font-sans text-gray-100 flex flex-col relative">
      
      {/* NAVBAR / HEADER */}
      <header className="sticky top-0 z-30 bg-brand-dark/95 backdrop-blur-md border-b border-gray-800 h-16 flex items-center justify-between px-4 md:px-8 shadow-sm">
         <div className="flex items-center gap-4">
             {/* Hamburger Button */}
             <button 
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-gray-300 hover:text-white focus:outline-none transition-colors"
             >
                 <i className="fa-solid fa-bars text-xl"></i>
             </button>
             
             {/* Logo */}
             <div className="flex items-center gap-2 select-none">
                 <div className="w-8 h-8 bg-brand-accent rounded flex items-center justify-center shadow-lg shadow-brand-accent/20">
                    <i className="fa-solid fa-tv text-white text-sm"></i>
                 </div>
                 <h1 className="text-lg font-bold tracking-tight text-white leading-none">
                   Italian<span className="text-brand-accent">TV</span>
                 </h1>
             </div>
         </div>

         {/* Search Bar - Integrated in Header */}
         <div className="relative w-48 md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <i className="fa-solid fa-search text-gray-500 text-sm"></i>
            </div>
            <input
            type="text"
            placeholder="Cerca canale..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 bg-gray-900 border border-gray-700 rounded-full focus:ring-1 focus:ring-brand-accent focus:border-brand-accent placeholder-gray-500 text-white text-sm transition-all"
            />
        </div>
      </header>

      {/* DRAWER MENU (OVERLAY) */}
      {/* Backdrop */}
      {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
      )}
      
      {/* Sidebar Content */}
      <aside 
        className={`fixed inset-y-0 left-0 w-72 bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-r border-gray-800 ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
         <div className="h-full flex flex-col">
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <span className="text-gray-400 font-bold uppercase text-xs tracking-widest">Menu Principale</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-gray-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>

            {/* Scrollable Nav */}
            <div className="flex-1 overflow-y-auto p-4">
                <button 
                    onClick={() => {
                        setViewState('admin_login');
                        setIsMenuOpen(false);
                    }}
                    className="w-full mb-6 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 hover:text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all group"
                >
                    <i className="fa-solid fa-lock text-xs group-hover:text-brand-accent"></i>
                    <span className="text-sm font-semibold">Area Riservata</span>
                </button>

                <nav className="space-y-1">
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">Categorie</div>
                    {Object.values(ChannelCategory).map((category) => (
                    <button
                        key={category}
                        onClick={() => {
                            setSelectedCategory(category);
                            setIsMenuOpen(false); // Close menu on selection
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-between group ${
                        selectedCategory === category 
                            ? 'bg-brand-accent text-white shadow-md shadow-brand-accent/20' 
                            : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                        <span>{category}</span>
                        {selectedCategory === category && <i className="fa-solid fa-chevron-right text-[10px]"></i>}
                    </button>
                    ))}
                </nav>
            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-800 text-center text-xs text-gray-600">
                &copy; 2025 ItalianTV
            </div>
         </div>
      </aside>


      {/* Main Content Area - Full Width */}
      <main className="flex-1 overflow-y-auto pb-20">
        
        <div className="p-4 md:p-8 space-y-8 w-full max-w-[1920px] mx-auto">
            {/* NEWS TICKER SECTION - ALWAYS VISIBLE AT TOP */}
            <NewsTicker />

            {/* FEATURED + RANKING SECTION */}
            {featuredChannel && !searchTerm && selectedCategory === ChannelCategory.ALL && (
              <div className="flex flex-col xl:flex-row gap-6">
                
                {/* HERO SECTION (Featured Channel) - 75% width on large screens */}
                <div className="xl:w-3/4 relative w-full rounded-2xl overflow-hidden shadow-2xl group cursor-pointer border border-gray-800" onClick={() => setCurrentChannel(featuredChannel)}>
                    {/* Background with Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/90 to-transparent z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
                    
                    {/* Background "Image" */}
                    <div className="absolute inset-0 bg-brand-dark flex items-center justify-end opacity-40">
                         {featuredChannel.logoUrl ? (
                             <img src={featuredChannel.logoUrl} className="h-full w-2/3 object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all duration-700" alt="Background" />
                         ) : (
                             <div className="w-full h-full bg-gray-800"></div>
                         )}
                    </div>

                    {/* Content */}
                    <div className="relative z-20 p-6 md:p-12 flex flex-col justify-end md:justify-center min-h-[400px] md:min-h-[500px] max-w-3xl">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider">
                                In Diretta
                            </span>
                             <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider border border-white/10">
                                {featuredChannel.category}
                            </span>
                        </div>

                        {featuredChannel.logoUrl && (
                            <img src={featuredChannel.logoUrl} alt={featuredChannel.name} className="h-16 md:h-24 w-auto object-contain mb-6 self-start" />
                        )}
                        
                        <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-2 leading-tight drop-shadow-lg">
                            {featuredChannel.name}
                        </h2>

                        {/* HERO STARS & VIEWS */}
                        <div className="flex gap-4 mb-4 items-center">
                            <div className="flex gap-1 items-center">
                                {renderStars(featuredChannel.rating)}
                                <span className="text-xs text-gray-400 ml-2 mt-0.5">({featuredChannel.rating || 0}/5)</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-300 bg-black/30 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                                <i className="fa-solid fa-eye text-xs"></i>
                                <span className="font-mono text-sm font-bold">{(featuredChannel.viewCount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                        
                        <p className="text-gray-300 text-base md:text-lg mb-8 line-clamp-3 md:line-clamp-none max-w-2xl drop-shadow-md">
                            {featuredChannel.description}
                        </p>

                        <div className="flex gap-4">
                            <button className="bg-white text-black hover:bg-gray-200 font-bold px-8 py-3 rounded-lg flex items-center gap-3 transition-transform transform hover:scale-105">
                                <i className="fa-solid fa-play text-xl"></i>
                                <span>Guarda Ora</span>
                            </button>
                            {featuredChannel.websiteUrl && (
                                <a 
                                    href={featuredChannel.websiteUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="bg-gray-600/40 hover:bg-gray-600/60 backdrop-blur-sm text-white font-bold px-8 py-3 rounded-lg flex items-center gap-3 transition-colors border border-white/20"
                                >
                                    <i className="fa-solid fa-globe text-xl"></i>
                                    <span>WEB</span>
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* RANKING SIDEBAR - 25% width on large screens */}
                <div className="xl:w-1/4 bg-gray-900 rounded-2xl border border-gray-800 p-5 flex flex-col shadow-xl">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-800">
                    <i className="fa-solid fa-trophy text-yellow-400"></i>
                    <h3 className="font-bold text-white uppercase tracking-wider text-sm">Top 5 Canali</h3>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    {topRatedChannels.map((channel, index) => (
                      <div 
                        key={channel.id} 
                        onClick={() => setCurrentChannel(channel)}
                        className="group flex items-center gap-3 p-2 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <div className={`w-6 h-6 flex items-center justify-center font-bold text-sm rounded ${index === 0 ? 'bg-yellow-400 text-black' : index === 1 ? 'bg-gray-400 text-black' : index === 2 ? 'bg-orange-700 text-white' : 'bg-gray-800 text-gray-500'}`}>
                          {index + 1}
                        </div>
                        
                        <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center p-1">
                           {channel.logoUrl ? (
                              <img src={channel.logoUrl} alt="" className="w-full h-full object-contain" />
                           ) : (
                              <span className="font-bold text-xs">{channel.name[0]}</span>
                           )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-white truncate group-hover:text-brand-accent transition-colors">{channel.name}</h4>
                          <div className="flex items-center gap-1">
                             <i className="fa-solid fa-star text-[10px] text-yellow-400"></i>
                             <span className="text-xs text-gray-400">{channel.rating || 0}</span>
                          </div>
                        </div>
                        
                        <i className="fa-solid fa-play text-gray-600 group-hover:text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Other Channels Grid */}
            <div>
                {featuredChannel && !searchTerm && selectedCategory === ChannelCategory.ALL && <h3 className="text-xl font-bold text-white mb-4">Tutti i Canali</h3>}
                
                {filteredChannels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {/* If searching or filtering, show ALL results including featured. If homepage, show only others */}
                    {(searchTerm || selectedCategory !== ChannelCategory.ALL ? filteredChannels : otherChannels).map(channel => (
                    <ChannelCard 
                        key={channel.id} 
                        channel={channel} 
                        onClick={setCurrentChannel} 
                    />
                    ))}
                </div>
                ) : (
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 border border-dashed border-gray-800 rounded-xl bg-gray-900/30">
                    <i className="fa-solid fa-satellite-dish text-4xl mb-4 opacity-50"></i>
                    <p>Nessun canale corrisponde alla tua ricerca.</p>
                </div>
                )}
            </div>
        </div>
      </main>

      {/* Modals */}
      {currentChannel && (
        <VideoPlayer 
          channel={currentChannel} 
          onClose={() => setCurrentChannel(null)} 
          onRate={handleRateChannel}
          onView={handleChannelView}
        />
      )}

      {/* Gemini Assistant Chat */}
      <GeminiAssistant 
        channels={channels} 
        onRecommendationClick={handleRecommendationClick} 
      />
    </div>
  );
};

export default App;