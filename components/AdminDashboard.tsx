
import React, { useState } from 'react';
import { Channel, ChannelCategory } from '../types';

interface AdminDashboardProps {
  channels: Channel[];
  onAddChannel: (channel: Channel) => void;
  onUpdateChannel: (channel: Channel) => void;
  onDeleteChannel: (id: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  channels, 
  onAddChannel, 
  onUpdateChannel, 
  onDeleteChannel,
  onLogout
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const emptyForm = {
    name: '',
    streamUrl: '',
    description: '',
    category: ChannelCategory.ENTERTAINMENT,
    websiteUrl: '',
    rssUrl: '',
    logoUrl: '',
    youtubeChannelId: '',
    order: 10
  };

  const [formData, setFormData] = useState(emptyForm);

  const handleEdit = (channel: Channel) => {
    setFormData({
      name: channel.name,
      streamUrl: channel.streamUrl,
      description: channel.description,
      category: channel.category,
      websiteUrl: channel.websiteUrl || '',
      rssUrl: channel.rssUrl || '',
      logoUrl: channel.logoUrl || '',
      youtubeChannelId: channel.youtubeChannelId || '',
      order: channel.order || 99
    });
    setEditingId(channel.id);
    setIsEditing(true);
  };

  const handleCreate = () => {
    // Find next available order number
    const maxOrder = channels.length > 0 ? Math.max(...channels.map(c => c.order || 0)) : 0;
    setFormData({ ...emptyForm, order: maxOrder + 1 });
    setEditingId(null);
    setIsEditing(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-detect YouTube URL for Stream
    let streamType: 'direct_url' | 'youtube_id' = 'direct_url';
    let finalStreamUrl = formData.streamUrl;

    if (formData.streamUrl.includes('youtube.com') || formData.streamUrl.includes('youtu.be')) {
        streamType = 'youtube_id';
        // Extract Video ID basic regex
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = formData.streamUrl.match(regExp);
        if (match && match[2].length === 11) {
            finalStreamUrl = match[2];
        }
    }

    const channelData: Channel = {
      id: editingId || `custom-${Date.now()}`,
      ...formData,
      order: Number(formData.order),
      streamUrl: finalStreamUrl,
      streamType: streamType,
      isLive: true,
      rating: 0,
      viewCount: 0, // Initialize real view count to 0
      isUserAdded: true
    };

    if (editingId) {
      // Preserve existing fields like rating/viewCount if updating
      const existing = channels.find(c => c.id === editingId);
      if (existing) {
        onUpdateChannel({ 
            ...existing, 
            ...channelData, 
            viewCount: existing.viewCount || 0,
            rating: existing.rating || 0 
        });
      }
    } else {
      onAddChannel(channelData);
    }
    
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="p-6 md:p-8 bg-gray-900 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-gray-800 pb-6">
        <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
                <i className="fa-solid fa-cogs text-brand-accent"></i>
                Pannello Amministratore
            </h1>
            <p className="text-gray-400 mt-1">Gestisci i canali e le configurazioni dell'app.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={onLogout}
                className="px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors"
            >
                Esci
            </button>
            <button 
                onClick={handleCreate}
                className="px-4 py-2 bg-brand-accent hover:bg-brand-hover text-white font-bold rounded-lg shadow-lg shadow-brand-accent/20 transition-all flex items-center gap-2"
            >
                <i className="fa-solid fa-plus"></i> Nuovo Canale
            </button>
        </div>
      </div>

      {isEditing ? (
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl border border-gray-700 p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">{editingId ? 'Modifica Canale' : 'Aggiungi Nuovo Canale'}</h2>
                <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white">
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Nome Canale</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                </div>
                
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Ordinamento (Posizione)</label>
                    <input type="number" name="order" value={formData.order} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                    <p className="text-xs text-gray-500 mt-1">Numero più basso = posizione più alta. (StileTV è 1, SET è 2).</p>
                </div>
                
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">URL Streaming</label>
                    <input required type="text" name="streamUrl" value={formData.streamUrl} onChange={handleChange} placeholder="https://...m3u8 oppure link YouTube Live" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                    <p className="text-xs text-gray-500 mt-1">Inserisci un link diretto .m3u8, un link YouTube o un codice iframe.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Categoria</label>
                    <select name="category" value={formData.category} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2">
                        {Object.values(ChannelCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Sito Web</label>
                    <input type="url" name="websiteUrl" value={formData.websiteUrl} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">URL Logo (Opzionale)</label>
                    <input type="url" name="logoUrl" value={formData.logoUrl} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">RSS News Feed (Opzionale)</label>
                    <input type="url" name="rssUrl" value={formData.rssUrl} onChange={handleChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                </div>

                 <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">ID Canale YouTube (Opzionale)</label>
                    <input type="text" name="youtubeChannelId" value={formData.youtubeChannelId} onChange={handleChange} placeholder="es. UCxxxxxxxxxxxx" className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2" />
                    <p className="text-xs text-gray-500 mt-1">Inserisci l'ID del canale YouTube (es. UC...) per mostrare automaticamente gli ultimi video on-demand.</p>
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-1">Descrizione</label>
                    <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 resize-none" />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-700">Annulla</button>
                    <button type="submit" className="px-6 py-2 rounded-lg bg-green-600 text-white font-bold hover:bg-green-500 shadow-lg">Salva</button>
                </div>
            </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900/50 text-gray-400 text-xs uppercase font-semibold">
                        <tr>
                            <th className="p-4 w-12">Pos.</th>
                            <th className="p-4">Canale</th>
                            <th className="p-4 hidden md:table-cell">Categoria</th>
                            <th className="p-4 hidden md:table-cell">URL Stream</th>
                            <th className="p-4 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {channels
                          .sort((a,b) => (a.order || 999) - (b.order || 999)) // Sort display in table too
                          .map(channel => (
                            <tr key={channel.id} className="hover:bg-gray-700/50 transition-colors">
                                <td className="p-4 font-mono text-gray-500">
                                    {channel.order || '-'}
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        {channel.logoUrl ? (
                                            <img src={channel.logoUrl} alt="" className="w-8 h-8 object-contain rounded bg-white/10 p-0.5" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-600 rounded flex items-center justify-center text-xs font-bold">{channel.name[0]}</div>
                                        )}
                                        <div>
                                            <div className="font-bold text-white">{channel.name}</div>
                                            <div className="text-xs text-gray-500 md:hidden">{channel.category}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 hidden md:table-cell text-sm text-gray-300">
                                    <span className="bg-gray-700 px-2 py-1 rounded text-xs">{channel.category}</span>
                                </td>
                                <td className="p-4 hidden md:table-cell text-xs text-gray-500 font-mono truncate max-w-[200px]">
                                    {channel.streamUrl}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button 
                                            onClick={() => handleEdit(channel)}
                                            className="p-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                                            title="Modifica"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if(confirm('Sei sicuro di voler eliminare questo canale?')) onDeleteChannel(channel.id);
                                            }}
                                            className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                            title="Elimina"
                                        >
                                            <i className="fa-solid fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};
