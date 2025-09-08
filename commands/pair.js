const { loadImage, createCanvas } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "pair",
    author: "xemon (fixed by Mahmud)",
    role: 0,
    countDown: 10,
    category: "love",
    guide: "{pn}",
  },

  onStart: async function ({ api, event }) {
    try {
      const threadID = event.key.remoteJid;
      const senderID = event.key.participant || event.key.remoteJid;

      let pathImg = path.join(__dirname, "cache", "background.png");
      let pathAvt1 = path.join(__dirname, "cache", "Avtmot.png");
      let pathAvt2 = path.join(__dirname, "cache", "Avthai.png");

      let threadInfo = await api.groupMetadata(threadID);
      let all = threadInfo?.participants || [];

      const senderInfo = all.find((user) => user.id === senderID) || {};
      const name1 = senderInfo?.notify || "User1";
      const gender1 = senderInfo?.gender || null;

      const botID = (await api.getHostNumber()).replace("@c.us", "");

      let candidates = [];

      if (gender1 === "female" || gender1 === "FEMALE") {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID && u.gender?.toLowerCase() === "male");
      } else if (gender1 === "male" || gender1 === "MALE") {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID && u.gender?.toLowerCase() === "female");
      } else {
        candidates = all.filter(u => u.id !== senderID && u.id !== botID);
      }

      if (candidates.length === 0) {
        return api.sendMessage("❌ No suitable candidates found for pairing.", threadID);
      }

      const candidate = candidates[Math.floor(Math.random() * candidates.length)];
      const id2 = candidate.id;
      const name2 = candidate.notify || "User2";

      const randomPercent = Math.floor(Math.random() * 100) + 1;
      const weirdValues = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
      const percentagePool = [
        randomPercent, randomPercent, randomPercent, randomPercent, randomPercent,
        weirdValues[Math.floor(Math.random() * weirdValues.length)],
        randomPercent, randomPercent, randomPercent, randomPercent
      ];
      const tile = percentagePool[Math.floor(Math.random() * percentagePool.length)];

      const backgrounds = [
        "https://i.postimg.cc/wjJ29HRB/background1.png",
        "https://i.postimg.cc/zf4Pnshv/background2.png",
        "https://i.postimg.cc/5tXRQ46D/background3.png",
      ];
      const bgUrl = backgrounds[Math.floor(Math.random() * backgrounds.length)];

      const downloadImage = async (url, destPath) => {
        const res = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(destPath, Buffer.from(res.data));
      };

      const token = "6628568379%7Cc1e620fa708a1d5696fb991c1bde5662";

      await downloadImage(`https://graph.facebook.com/${senderID}/picture?width=720&height=720&access_token=${token}`, pathAvt1);
      await downloadImage(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=${token}`, pathAvt2);
      await downloadImage(bgUrl, pathImg);

      const baseImage = await loadImage(pathImg);
      const baseAvt1 = await loadImage(pathAvt1);
      const baseAvt2 = await loadImage(pathAvt2);

      const canvas = createCanvas(baseImage.width, baseImage.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
      ctx.drawImage(baseAvt1, 100, 150, 300, 300);
      ctx.drawImage(baseAvt2, 900, 150, 300, 300);

      const imageBuffer = canvas.toBuffer();
      await fs.writeFile(pathImg, imageBuffer);

      await fs.remove(pathAvt1);
      await fs.remove(pathAvt2);

      return api.sendMessage(
        {
          body: `🥰 Successful pairing:\n• ${name1} 💞\n• ${name2} 💞\n\n💌 Love Percentage: ${tile}% 💙`,
          attachment: fs.createReadStream(pathImg),
        },
        threadID,
        async (err) => {
          if (err) console.error(err);
          try {
            await fs.unlink(pathImg);
          } catch (e) {
            console.error("Error deleting image file:", e);
          }
        }
      );
    } catch (error) {
      console.error("❌ Error in pair command:", error);
      const threadID = event?.key?.remoteJid || "unknown";
      return api.sendMessage("❌ Something went wrong while pairing.", threadID);
    }
  },
};
