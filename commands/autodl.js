const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { shortenURL } = global.utils;

const baseApiUrl = "https://www.noobs-api.rf.gd/dipto";

module.exports = {
  config: {
    name: "autodl",
    version: "1.0.1",
    author: "404",
    countDown: 0,
    role: 0,
    description: {
      en: "Auto download video from Tiktok, Facebook, Instagram, YouTube, and more",
    },
    category: "media",
    guide: {
      en: "[video_link]",
    },
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    try {
      let dipto = event.body ? event.body.trim() : "";

      // Validate supported URLs
      const supportedUrls = [
        "https://vt.tiktok.com",
        "https://www.tiktok.com/",
        "https://www.facebook.com",
        "https://www.instagram.com/",
        "https://youtu.be/",
        "https://youtube.com/",
        "https://x.com/",
        "https://twitter.com/",
        "https://vm.tiktok.com",
        "https://fb.watch"
      ];

      if (!supportedUrls.some(url => dipto.startsWith(url))) return;

      // React to user message
      api.setMessageReaction("🐤", event.messageID, () => {}, true);

      // Ensure cache folder exists
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const videoPath = path.join(cacheDir, "diptoo.mp4");

      // Fetch video download URL from API
      const response = await axios.get(`${baseApiUrl}/alldl`, { params: { url: dipto } });
      if (!response.data || !response.data.result) throw new Error("Failed to fetch video URL");

      const videoUrl = response.data.result;

      // Download the video binary data
      const videoResponse = await axios.get(videoUrl, { responseType: "arraybuffer" });
      const videoBuffer = Buffer.from(videoResponse.data, "binary");

      // Write video to file
      fs.writeFileSync(videoPath, videoBuffer);

      // Shorten video URL if function exists
      let shortUrl = videoUrl;
      if (typeof shortenURL === "function") {
        try {
          shortUrl = await shortenURL(videoUrl);
        } catch {
          shortUrl = videoUrl; // fallback to original url if error
        }
      }

      // Send video with caption
      api.sendMessage(
        {
          body: `${response.data.cp || "Downloaded Video"}\n🐤 | Link: ${shortUrl || "Unavailable"}`,
          attachment: fs.createReadStream(videoPath),
        },
        event.threadID,
        async (err) => {
          // Delete temp video file after sending
          try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
          } catch (e) {
            console.error("Failed to delete temp video file:", e);
          }
          if (err) {
            api.setMessageReaction("❎", event.messageID, () => {}, true);
            api.sendMessage(`Error sending video: ${err.message || err}`, event.threadID, event.messageID);
          }
        },
        event.messageID
      );

    } catch (e) {
      // On error, react with ❎ and notify user
      try {
        api.setMessageReaction("❎", event.messageID, () => {}, true);
        api.sendMessage(`❌ Error: ${e.message || e}`, event.threadID, event.messageID);
      } catch (sendErr) {
        console.error("Error reporting failure:", sendErr);
      }
    }
  },
};
