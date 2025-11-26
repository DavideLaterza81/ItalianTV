import React, { useEffect, useRef, useState } from 'react';
import { Channel, RSSItem } from '../types';
import { fetchRSSFeed } from '../services/rssService';

interface VideoPlayerProps {
  channel: Channel;
  onClose: () => void;
  onRate: (id: string, rating: number) => void;
  onView: (id: string) => void;
}

declare global {
  interface Window {
    Hls: any;
  }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ channel, onClose, onRate, onView }) => {
  const isYoutube = channel.streamType === 'youtube_id';
  // Check if it is a standard video file (m3u8/mp4)
  const isStandardVideo = channel.streamUrl.includes('.m3u8') || channel.streamUrl.includes('.mp4');
  // If it's not YouTube and not a standard video file, treat it as a generic web iframe (for sites like Canale21, Televomero etc)
  const isGenericWebPlayer = !isYoutube && !isStandardVideo;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [rssItems, setRssItems] = useState<RSSItem[]>([]);
  const [loadingSidebar, setLoadingSidebar] = useState(false);
  const [currentRating, setCurrentRating] = useState(channel.rating || 0);
  const [hasIncrementedView, setHasIncrementedView] = useState(false);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);

  // Detect Orientation for Mobile Fullscreen
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscape = window.innerWidth > window.innerHeight;
      // Consider "mobile/tablet" as width < 1024px. 
      const isSmallScreen = window.innerWidth < 1024;
      setIsMobileLandscape(isLandscape && isSmallScreen);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  // Increment view count on mount (once)
  useEffect(() => {
    if (!hasIncrementedView) {
      onView(channel.id);
      setHasIncrementedView(true);
    }
  }, [channel.id]);

  // Load stream
  useEffect(() => {
    setError(null);
    
    // If it's a generic web player or YouTube, we don't need HLS logic
    if (isGenericWebPlayer || isYoutube) return;

    // Short delay to ensure video element is rendered
    const timer = setTimeout(() => {
    if (videoRef.current && window.Hls && channel.streamUrl) {
        const hls = new window.Hls();
        
        if (window.Hls.isSupported()) {
        hls.loadSource(channel.streamUrl);
        hls.attachMedia(videoRef.current);
        hls.on(window.Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(e => console.log("Autoplay prevented:", e));
        });
        hls.on(window.Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
            console.error("HLS Fatal Error", data);
            setError("Impossibile caricare il flusso video. Verifica che il link sia corretto e attivo.");
            hls.destroy();
            }
        });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = channel.streamUrl;
        videoRef.current.addEventListener('loadedmetadata', () => {
            videoRef.current?.play().catch(e => console.log("Autoplay prevented:", e));
        });
        } else {
        setError("Il tuo browser non supporta la riproduzione di questo formato.");
        }

        return () => {
        if (hls) hls.destroy();
        };
    }
    }, 100);
    return () => clearTimeout(timer);
  }, [channel, isYoutube, isGenericWebPlayer]);

  // Load RSS News
  useEffect(() => {
    const loadSidebarContent = async () => {
        if (!channel.rssUrl) {
            setRssItems([]);
            return;
        }

        setLoadingSidebar(true);
        try {
            const items = await fetchRSSFeed(channel.rssUrl);
            setRssItems(items);
        } catch (e) {
            console.error("Sidebar load error", e);
        } finally {
            setLoadingSidebar(false);
        }
    };

    loadSidebarContent();
  }, [channel.rssUrl]);

  const handleRating = (rating: number) => {
    setCurrentRating(rating);
    onRate(channel.id, rating);
  };

  const getYoutubeEmbedUrl = (videoId: string) => {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  };

  // Determine external YouTube Link
  const getExternalYoutubeLink = () => {
    if (isYoutube) return `https://www.youtube.com/watch?v=${channel.streamUrl}`;
    if (channel.youtubeChannelId) {
        if (channel.youtubeChannelId.startsWith('UC')) return `https://www.youtube.com/channel/${channel.youtubeChannelId}`;
        return channel.youtubeChannelId; 
    }
    return null;
  };

  const showSidebar = rssItems.length > 0;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm ${isMobileLandscape ? 'p-0 bg-black' : 'p-0 md:p-6'}`}>
      <div 
        className={`relative flex flex-col md:flex-row bg-gray-900 overflow-hidden shadow-2xl border-gray-700
          ${isMobileLandscape 
            ? 'w-full h-full rounded-none border-0' 
            : 'w-full max-w-7xl h-full md:h-[90vh] md:rounded-xl border'
          }`}
      >
        
        {/* Left Side: Video Player Container */}
        <div className="flex-1 flex flex-col min-h-0 bg-black relative">
          
          {/* Header - Static Position (Hidden in Mobile Landscape) */}
          {!isMobileLandscape && (
            <div className="flex items-center justify-between p-3 md:p-4 bg-gray-900 border-b border-gray-800 shrink-0">
                <div className="flex items-center gap-4">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-lg"
                    >
                    <i className="fa-solid fa-arrow-left"></i>
                    <span className="text-sm font-medium">Torna alla lista</span>
                    </button>
                    
                    <h2 className="text-lg md:text-xl font-bold text-white tracking-wide truncate max-w-[150px] md:max-w-xs">
                        {channel.name} 
                    </h2>

                    <div className="hidden sm:flex items-center gap-2 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        Live
                    </div>
                </div>
                
                <div className="hidden md:flex items-center gap-2 text-gray-300 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
                    <i className="fa-solid fa-eye text-xs"></i>
                    <span className="font-mono text-sm font-bold">{(channel.viewCount || 0).toLocaleString()}</span>
                </div>
            </div>
          )}

          {/* Player Area */}
          <div className="flex-1 relative bg-black w-full overflow-hidden">
            {isYoutube ? (
                <iframe
                width="100%"
                height="100%"
                src={getYoutubeEmbedUrl(channel.streamUrl)}
                title={channel.name}
                frameBorder="0"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
                ></iframe>
            ) : isGenericWebPlayer ? (
                <iframe
                width="100%"
                height="100%"
                src={channel.streamUrl}
                title={channel.name}
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; picture-in-picture"
                className="absolute inset-0 w-full h-full bg-black"
                ></iframe>
            ) : (
                <>
                {error ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-900">
                        <i className="fa-solid fa-triangle-exclamation text-yellow-500 text-4xl mb-4"></i>
                        <p className="text-white font-medium mb-4">{error}</p>
                        <button onClick={() => window.open(channel.streamUrl, '_blank')} className="text-brand-accent hover:underline">
                            Prova ad aprire il flusso diretto
                        </button>
                    </div>
                ) : (
                    <video
                    ref={videoRef}
                    controls
                    autoPlay
                    playsInline
                    className="absolute inset-0 w-full h-full object-contain"
                    ></video>
                )}
                </>
            )}
          </div>
          
          {/* Controls / Info Bar (Hidden in Mobile Landscape) */}
          {!isMobileLandscape && (
            <div className="p-3 md:p-4 bg-gray-900 border-t border-gray-800 shrink-0">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    
                    {/* Left: Ratings */}
                    <div className="flex gap-2 items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                        key={star}
                        onClick={() => handleRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                        >
                        <i className={`fa-star text-lg ${star <= currentRating ? 'fa-solid text-yellow-400' : 'fa-regular text-gray-600'}`}></i>
                        </button>
                    ))}
                    <span className="text-xs text-gray-500 ml-2">Valuta il canale</span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                        {/* External Link Button */}
                        {(isYoutube || channel.youtubeChannelId) && (
                            <a 
                            href={getExternalYoutubeLink() || '#'} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#FF0000]/80 hover:bg-[#FF0000] transition-colors flex items-center gap-2 shadow-lg"
                            title="Apri canale YouTube"
                        >
                            <i className="fa-brands fa-youtube text-sm"></i>
                            <span className="hidden sm:inline">Apri su YouTube</span>
                        </a>
                        )}
                    </div>
                </div>
            </div>
          )}
        </div>

        {/* Right Side: Sidebar (RSS ONLY) - Hidden in Mobile Landscape */}
        {!isMobileLandscape && showSidebar && (
          <div className="w-full md:w-80 bg-gray-800 border-l border-gray-700 flex flex-col h-[40vh] md:h-auto shrink-0 z-30">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-700 bg-gray-800/95 sticky top-0 flex items-center gap-2 shadow-sm">
                <i className="fa-solid fa-rss text-orange-500"></i>
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Ultime Notizie</h3>
            </div>
            
            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gray-800/50">
                  {loadingSidebar ? (
                        <div className="flex justify-center p-4"><div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div></div>
                  ) : (
                     <div>
                        <div className="space-y-3">
                            {rssItems.map((item, index) => (
                                <a key={index} href={item.link} target="_blank" rel="noreferrer" className="block group">
                                    <article className="bg-gray-900/50 p-3 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700/50 hover:border-brand-accent/30 shadow-sm">
                                    <h4 className="text-xs font-bold text-gray-300 group-hover:text-brand-accent mb-1 line-clamp-2 leading-snug">
                                        {item.title}
                                    </h4>
                                    <p className="text-[10px] text-gray-500 mb-2">{new Date(item.pubDate).toLocaleDateString('it-IT')}</p>
                                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{item.description}</p>
                                    </article>
                                </a>
                                ))}
                        </div>
                     </div>
                  )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};