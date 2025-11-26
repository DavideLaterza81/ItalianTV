import React from 'react';
import { Channel } from '../types';

interface ChannelCardProps {
  channel: Channel;
  onClick: (channel: Channel) => void;
}

export const ChannelCard: React.FC<ChannelCardProps> = ({ channel, onClick }) => {
  // Genera stelle piene/vuote in base al rating
  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <i key={i} className={`fa-solid fa-star text-[10px] ${i < rating ? 'text-yellow-400' : 'text-gray-600'}`}></i>
    ));
  };

  return (
    <div 
      onClick={() => onClick(channel)}
      className="group relative bg-brand-card rounded-xl overflow-hidden cursor-pointer border border-gray-800 hover:border-brand-accent transition-all duration-300 hover:shadow-lg hover:shadow-brand-accent/20 flex flex-col h-full transform hover:-translate-y-1"
    >
      {/* Live Badge */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <span className="flex items-center gap-1 bg-red-600/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider backdrop-blur-sm">
           <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
           Live
        </span>
      </div>

      {/* View Count Badge */}
      <div className="absolute top-2 right-2 z-10">
          <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm flex items-center gap-1">
            <i className="fa-solid fa-eye text-[9px]"></i>
            {channel.viewCount ? channel.viewCount.toLocaleString() : 0}
          </span>
      </div>

      {/* Image Area */}
      <div className="h-40 w-full bg-gray-950 flex items-center justify-center p-6 relative group-hover:bg-gray-900 transition-colors">
        {channel.logoUrl ? (
             <img 
                src={channel.logoUrl} 
                alt={channel.name} 
                className="max-h-full max-w-full object-contain filter drop-shadow-md group-hover:scale-110 transition-transform duration-300"
            />
        ) : (
            <div className="text-4xl font-bold text-gray-700 group-hover:text-brand-accent transition-colors">
                {channel.name.charAt(0)}
            </div>
        )}
       
        {/* Play Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-12 h-12 bg-brand-accent rounded-full flex items-center justify-center text-white shadow-lg transform scale-0 group-hover:scale-100 transition-transform duration-300 delay-75">
                <i className="fa-solid fa-play ml-1"></i>
            </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-white text-lg truncate flex-1">{channel.name}</h3>
        </div>
        
        {/* Rating Stars */}
        <div className="flex gap-0.5 mb-2">
            {renderStars(channel.rating)}
        </div>

        <p className="text-gray-400 text-xs line-clamp-2 mb-3 flex-1">{channel.description || 'Nessuna descrizione disponibile.'}</p>
        
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-800">
            <span className="text-[10px] font-medium text-brand-accent bg-brand-accent/10 px-2 py-1 rounded">
                {channel.category}
            </span>
            <div className="flex gap-2">
                {channel.youtubeChannelId && <i className="fa-brands fa-youtube text-red-500" title="On Demand Available"></i>}
                {channel.rssUrl && <i className="fa-solid fa-rss text-orange-500" title="News Available"></i>}
            </div>
        </div>
      </div>
    </div>
  );
};