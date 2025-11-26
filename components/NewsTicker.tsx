import React, { useEffect, useState } from 'react';
import { fetchStileTVH24, StileTVNewsItem } from '../services/rssService';

export const NewsTicker: React.FC = () => {
  const [news, setNews] = useState<StileTVNewsItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // 1. Fetch Data every 2 minutes
  useEffect(() => {
    const loadNews = async () => {
      const items = await fetchStileTVH24();
      if (items.length > 0) {
        setNews(items);
      }
    };

    loadNews(); // Initial load
    const fetchInterval = setInterval(loadNews, 120000); // 2 minutes

    return () => clearInterval(fetchInterval);
  }, []);

  // 2. Rotate Slide every 8 seconds
  useEffect(() => {
    if (news.length === 0) return;

    const rotateInterval = setInterval(() => {
      setIsVisible(false); // Fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % news.length);
        setIsVisible(true); // Fade in
      }, 500); // Wait for fade out
    }, 8000);

    return () => clearInterval(rotateInterval);
  }, [news.length]);

  if (news.length === 0) return null;

  const currentItem = news[currentIndex];

  return (
    <div className="w-full mb-8">
      <div className="bg-gray-900 border-y border-gray-800 md:border md:rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-auto md:h-64 relative group">
        
        {/* Label - Updated Text */}
        <div className="absolute top-0 left-0 bg-brand-accent text-white text-[10px] font-bold px-4 py-1 z-20 rounded-br-lg shadow-md uppercase tracking-widest">
          STILETV NEWS H24
        </div>

        {/* Image Section - Larger width (5/12) */}
        <div className="md:w-5/12 h-56 md:h-full relative overflow-hidden bg-black">
          {currentItem.imageUrl ? (
             <img 
               src={currentItem.imageUrl} 
               alt="News" 
               className={`w-full h-full object-cover transition-all duration-700 transform hover:scale-105 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
             />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <i className="fa-solid fa-newspaper text-5xl text-gray-700"></i>
            </div>
          )}
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent md:bg-gradient-to-r md:from-transparent md:to-gray-900"></div>
        </div>

        {/* Content Section - Right Aligned & Uppercase */}
        <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-center items-end text-right relative bg-gray-900">
          <div className={`w-full transition-all duration-500 transform ${isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
            
            {/* Title */}
            <h3 className="text-xl md:text-3xl font-black text-white leading-none mb-3 uppercase tracking-tight drop-shadow-md">
              {currentItem.title}
            </h3>

            {/* Color Bar - Aligned Right */}
            <div className="flex justify-end w-full mb-4">
                 <div 
                  className="h-2 w-32 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]" 
                  style={{ backgroundColor: currentItem.color || '#3b82f6' }}
                ></div>
            </div>

            {/* Description */}
            <p className="text-gray-300 text-sm md:text-lg font-medium uppercase tracking-wide leading-relaxed line-clamp-3 md:line-clamp-4">
              {currentItem.description}
            </p>
          </div>
          
          {/* Progress Indicator - Bottom Right */}
          <div className="absolute bottom-4 right-6 flex gap-1 z-10">
             {news.map((_, idx) => (
               <div 
                 key={idx} 
                 className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-brand-accent' : 'w-2 bg-gray-700'}`}
               ></div>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
};