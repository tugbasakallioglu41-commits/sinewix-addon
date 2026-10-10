const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

// Sinewix / Anthology API Yapılandırması
const SINEWIX_API_BASE = "https://raw.githubusercontent.com/falsisdev/anthology/main";

const builder = new addonBuilder({
  id: "org.sinewix.custom.addon",
  version: "1.0.0",
  name: "Sinewix TR Addon",
  description: "Nuvio ve Stremio için yüksek hızlı Sinewix Türkçe film ve dizi eklentisi",
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "sinewix_movies", name: "Sinewix Filmler" },
    { type: "series", id: "sinewix_series", name: "Sinewix Diziler" }
  ]
});

// 1. KATALOG HANDLER (Sinewix içerik listesini getirir)
builder.defineCatalogHandler(async ({ type, id }) => {
  try {
    let targetEndpoint = "";
    if (type === "movie" && id === "sinewix_movies") {
      targetEndpoint = `${SINEWIX_API_BASE}/data/movies.json`;
    } else if (type === "series" && id === "sinewix_series") {
      targetEndpoint = `${SINEWIX_API_BASE}/data/series.json`;
    }

    if (!targetEndpoint) return { metas: [] };

    const res = await axios.get(targetEndpoint, { timeout: 10000 });
    const items = res.data || [];

    const metas = items.slice(0, 50).map((item, index) => {
      const cleanId = item.id ? `snx_${item.id}` : `snx_${index}`;
      return {
        id: cleanId,
        type: type,
        name: item.title || item.name || "Sinewix İçerik",
        poster: item.poster || item.image || "",
        description: item.description || "Sinewix Türkçe İçerik"
      };
    });

    return { metas };
  } catch (err) {
    console.error("[Katalog Hatası]:", err.message);
    return { metas: [] };
  }
});

// 2. STREAM HANDLER (Sinewix HLS / m3u8 video akışını çözer)
builder.defineStreamHandler(async ({ type, id }) => {
  if (id.startsWith("snx_")) {
    try {
      const realId = id.replace("snx_", "");
      
      // Sinewix video çözücü kaynağı
      const streamUrl = `https://sinewix-stream-provider.vercel.app/api/stream?id=${realId}`;

      return {
        streams: [
          {
            title: "Sinewix HD (HLS - Donmasız)",
            type: "m3u8",
            url: streamUrl,
            behaviorHints: {
              notResponseLocation: true,
              proxyHeaders: {
                request: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  "Referer": "https://sinewix.com/"
                }
              }
            }
          }
        ]
      };
    } catch (err) {
      console.error("[Stream Hatası]:", err.message);
    }
  }
  return { streams: [] };
});

const PORT = process.env.PORT || 7000;
serveHTTP(builder.getInterface(), { port: PORT });
console.log(`Sinewix Eklentisi ${PORT} portunda çalışıyor.`);