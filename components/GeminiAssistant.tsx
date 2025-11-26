import React, { useState } from 'react';
import { getRecommendations } from '../services/geminiService';
import { Channel, ChatMessage } from '../types';

interface GeminiAssistantProps {
  channels: Channel[];
  onRecommendationClick: (id: string) => void;
}

export const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ channels, onRecommendationClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Ciao! Non sai cosa guardare? Dimmi cosa ti piace (es. 'notizie', 'calcio', 'musica') e ti aiuterò!" }
  ]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMsg = query;
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const result = await getRecommendations(userMsg, channels);

    setMessages(prev => [...prev, { 
      role: 'model', 
      text: result.text,
      recommendedChannelIds: result.channelIds
    }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-xl transition-all duration-300 flex items-center gap-2 ${isOpen ? 'bg-red-500 rotate-45' : 'bg-brand-accent hover:bg-brand-hover'}`}
      >
        {isOpen ? <i className="fa-solid fa-plus text-white text-xl"></i> : <i className="fa-solid fa-robot text-white text-xl"></i>}
      </button>

      {/* Chat Interface */}
      <div className={`fixed bottom-24 right-6 w-80 md:w-96 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl z-40 overflow-hidden transition-all duration-300 origin-bottom-right transform ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>
        <div className="bg-brand-accent/10 p-4 border-b border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
            <i className="fa-solid fa-sparkles text-white text-sm"></i>
          </div>
          <div>
            <h3 className="font-bold text-white">AI TV Guide</h3>
            <p className="text-xs text-brand-accent">Powered by Gemini</p>
          </div>
        </div>

        <div className="h-80 overflow-y-auto p-4 space-y-4 bg-gray-900/95">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                msg.role === 'user' 
                  ? 'bg-brand-accent text-white rounded-tr-none' 
                  : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
              }`}>
                {msg.text}
              </div>
              
              {/* Recommendations Chips */}
              {msg.recommendedChannelIds && msg.recommendedChannelIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {msg.recommendedChannelIds.map(id => {
                    const channel = channels.find(c => c.id === id);
                    if (!channel) return null;
                    return (
                      <button 
                        key={id}
                        onClick={() => {
                            onRecommendationClick(id);
                            setIsOpen(false);
                        }}
                        className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-full transition-colors border border-gray-600"
                      >
                        <i className="fa-solid fa-play text-[10px]"></i>
                        {channel.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex justify-start">
               <div className="bg-gray-800 rounded-2xl px-4 py-3 rounded-tl-none border border-gray-700">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
               </div>
             </div>
          )}
        </div>

        <form onSubmit={handleSearch} className="p-3 border-t border-gray-800 bg-gray-900">
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cosa vuoi guardare?" 
              className="w-full bg-gray-950 text-white text-sm rounded-full pl-4 pr-10 py-3 border border-gray-700 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent transition-all"
            />
            <button 
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-brand-accent text-white hover:bg-brand-hover disabled:opacity-50 disabled:hover:bg-brand-accent transition-colors"
            >
              <i className="fa-solid fa-paper-plane text-xs"></i>
            </button>
          </div>
        </form>
      </div>
    </>
  );
};
