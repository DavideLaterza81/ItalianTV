import { RSSItem } from "../types";

// Utilizziamo un servizio pubblico per convertire RSS in JSON ed evitare problemi CORS per i feed standard
const RSS_TO_JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

export interface StileTVNewsItem {
  title: string;
  description: string;
  color: string;    // Mapped from pubDate
  imageUrl: string; // Mapped from link
}

export const fetchRSSFeed = async (rssUrl: string): Promise<RSSItem[]> => {
  try {
    const response = await fetch(`${RSS_TO_JSON_API}${encodeURIComponent(rssUrl)}`);
    const data = await response.json();

    if (data.status === 'ok' && Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.description?.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...' // Strip HTML tags
      }));
    }
    return [];
  } catch (error) {
    console.error("Errore nel caricamento del feed RSS:", error);
    return [];
  }
};

export const fetchStileTVH24 = async (): Promise<StileTVNewsItem[]> => {
  const TARGET_URL = 'https://backend.stiletv.it/h24/bannerh24.xml';
  // Use corsproxy.io which is robust for fetching raw XML without CORS issues
  const PROXY_URL = 'https://corsproxy.io/?' + encodeURIComponent(TARGET_URL);
  
  try {
    const response = await fetch(PROXY_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const str = await response.text();
    const data = new window.DOMParser().parseFromString(str, "text/xml");
    const items = data.querySelectorAll("item");
    
    const news: StileTVNewsItem[] = [];
    
    items.forEach(item => {
      // Helper function to safely get text content
      const getVal = (tag: string) => item.getElementsByTagName(tag)[0]?.textContent || "";

      const title = getVal("title");
      const description = getVal("description");
      // Specific mapping as requested: pubDate contains the HEX Color
      let color = getVal("pubDate");
      // Specific mapping as requested: link contains the Image URL
      const imageUrl = getVal("link");

      // Fallback color if XML is empty or invalid
      if (!color.startsWith('#')) {
          color = '#3b82f6'; 
      }

      if (title.trim()) {
        news.push({ 
          title: title.trim(), 
          description: description.trim(), 
          color: color.trim(), 
          imageUrl: imageUrl.trim() 
        });
      }
    });

    return news;
  } catch (error) {
    console.error("Error fetching StileTV H24:", error);
    return [];
  }
};