const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

// Sinewix / Anthology Veri Kaynağı
const ANTHOLOGY_RAW = "https://raw.githubusercontent.com/falsisdev/anthology/main";

const builder = new addonBuilder({
  id: "org.sinewix.official.addon",
  version: "1.1.0",
  name: "Sinewix TR Addon",
  description: "Nuvio, Stremio ve Mind IPTV için canlı Sinewix Türkçe içerik eklentisi",
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "sinewix_movies", name: "Sinewix Filmler" },
    { type: "series", id: "sinewix_series", name: "Sinewix Diziler" }
  ],
  idPrefixes: ["snx_"]
});

// 1. KATALOG HANDLER (Canlı Sinewix İçeriklerini Çeker)
builder.defineCatalogHandler(async ({ type, id }) => {
  try {
    let fileUrl = "";
    if (type === "movie" && id === "sinewix_movies") {
      fileUrl = `${ANTHOLOGY_RAW}/data/movies.json`;
    } else if (type === "series" && id === "sinewix_series") {
      fileUrl = `${ANTHOLOGY_RAW}/data/series.json`;
    }

    if (!fileUrl) return { metas: [] };

    const response = await axios.get(fileUrl, { timeout: 8000 });
    const items = response.data || [];

    // Sinewix listesindeki ilk 60 içeriği haritalandırıyoruz
    const metas = items.slice(0, 60).map((item, idx) => {
      const contentId = item.id ? `snx_${item.id}` : `snx_${idx}`;
      return {
        id: contentId,
        type: type,
        name: item.title || item.name || "Türkçe İçerik",
        poster: item.poster || item.image || "",
        description: item.description || "Sinewix Türkçe Dizi / Film"
      };
    });

    return { metas };
  } catch (err) {
    console.error("[Katalog Çekme Hatası]:", err.message);
    return { metas: [] };
  }
});

// 2. STREAM HANDLER (Sinewix Akış Bağlantılarını Çözer)
builder.defineStreamHandler(async ({ type, id }) => {
  if (id.startsWith("snx_")) {
    try {
      const cleanId = id.replace("snx_", "");
      
      // Anthology / Sinewix stream resolver endpoint'i
      const streamResolverUrl = `https://raw.githubusercontent.com/falsisdev/anthology/main/data/streams/${cleanId}.json`;
      const res = await axios.get(streamResolverUrl, { timeout: 5000 });
      
      if (res.data && res.data.url) {
        return {
          streams: [
            {
              title: "Sinewix HD (HLS Akış)",
              type: "m3u8",
              url: res.data.url,
              behaviorHints: {
                notResponseLocation: true,
                proxyHeaders: {
                  request: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                    "Referer": "https://sinewix.com/"
                  }
                }
              }
            }
          ]
        };
      }
    } catch (err) {
      console.error("[Stream Çözme Hatası]:", err.message);
    }
  }

  return { streams: [] };
});

const PORT = process.env.PORT || 7000;

const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { 
  port: PORT,
  cors: true 
});

console.log(`Sinewix Canlı Eklenti ${PORT} portunda yayında.`);
