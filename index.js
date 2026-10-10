const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");
const axios = require("axios");

const builder = new addonBuilder({
  id: "org.sinewix.official.addon",
  version: "1.0.0",
  name: "Sinewix TR Addon",
  description: "Nuvio, Stremio ve Mind IPTV için donmasız Türkçe içerik eklentisi",
  resources: ["catalog", "stream"],
  types: ["movie", "series"],
  catalogs: [
    { type: "movie", id: "sinewix_movies", name: "Sinewix Filmler" },
    { type: "series", id: "sinewix_series", name: "Sinewix Diziler" }
  ],
  idPrefixes: ["snx_"]
});

// 1. KATALOG HANDLER
builder.defineCatalogHandler(async ({ type, id }) => {
  if (type === "movie" && id === "sinewix_movies") {
    return {
      metas: [
        {
          id: "snx_sample_1",
          type: "movie",
          name: "Sintel (Örnek Test Filmi)",
          poster: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Sintel_poster.jpg",
          description: "Sinewix ve Nuvio akış test filmi."
        },
        {
          id: "snx_sample_2",
          type: "movie",
          name: "Tears of Steel (Örnek Test Filmi)",
          poster: "https://upload.wikimedia.org/wikipedia/commons/7/70/Tears_of_Steel_poster.jpg",
          description: "Sinewix 4K/HD akış test filmi."
        }
      ]
    };
  }
  
  if (type === "series" && id === "sinewix_series") {
    return {
      metas: [
        {
          id: "snx_sample_series",
          type: "series",
          name: "Örnek Türkçe Dizi",
          poster: "https://image.tmdb.org/t/p/w500/1E5baA2A161R22C9fT232.jpg",
          description: "Sinewix test dizisi."
        }
      ]
    };
  }

  return { metas: [] };
});

// 2. STREAM HANDLER (Gerçek m3u8 ve mp4 akışları)
builder.defineStreamHandler(async ({ type, id }) => {
  if (id === "snx_sample_1") {
    return {
      streams: [
        {
          title: "Sinewix 1080p - HLS (Fast)",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
        }
      ]
    };
  }

  if (id === "snx_sample_2") {
    return {
      streams: [
        {
          title: "Sinewix 720p - Direct Stream",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        }
      ]
    };
  }

  return { streams: [] };
});

const PORT = process.env.PORT || 7000;

// CORS Başlıkları ile Sunucuyu Başlatma
const addonInterface = builder.getInterface();
serveHTTP(addonInterface, { 
  port: PORT,
  cors: true // CORS Güvenlik Engelini Aşmak İçin ŞART
});

console.log(`Sinewix Eklentisi ${PORT} portunda başarıyla başlatıldı.`);
