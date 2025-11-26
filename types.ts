
export enum ChannelCategory {
  ALL = 'Tutti',
  NEWS = 'Notizie',
  SPORT = 'Sport',
  MUSIC = 'Musica',
  ENTERTAINMENT = 'Intrattenimento',
  KIDS = 'Bambini',
  RELIGION = 'Religione',
  LOCAL = 'Regionali',
  DOCUMENTARY = 'Documentari'
}

export interface Channel {
  id: string;
  name: string;
  category: ChannelCategory;
  description: string;
  logoUrl: string;
  streamType: 'youtube_id' | 'direct_url';
  streamUrl: string; // m3u8 URL or YouTube Video ID
  isLive: boolean;
  websiteUrl?: string; // Link al sito ufficiale
  rssUrl?: string;     // Link al feed RSS News
  youtubeChannelId?: string; // ID del canale YouTube (es. UCxxxxxxxx) per i video on demand
  rating?: number;     // Voto utente (0-5)
  viewCount?: number;  // Numero spettatori
  isUserAdded?: boolean; // Flag per canali custom
  order?: number;      // Ordinamento visualizzazione
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  recommendedChannelIds?: string[];
}

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  thumbnail?: string;
}
