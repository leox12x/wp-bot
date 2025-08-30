const axios = require("axios");

// Get base API URL from remote config
const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "say",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: {
      en: "say <text> (or reply to a message)"
    }
  },

  onStart: async function ({ api, message, args, event }) {
    try {
      // Get user input or fallback to replied message
      let text = args.join(" ");
      if (event.type === "message_reply" && event.messageReply?.body) {
        text = event.messageReply.body;
      }

      // Validate input
      if (!text || text.trim().length === 0) {
        return message.reply("⚠️ দয়া করে কিছু লিখুন অথবা একটি মেসেজে রিপ্লাই দিন!");
      }

      const apiUrl = await baseApiUrl();

      // Fetch audio stream from the API
      const response = await axios.get(`${apiUrl}/api/say`, {
        params: { text },
        headers: { Author: module.exports.config.author },
        responseType: "stream"
      });

      // Check for API error
      if (response.data?.error) {
        return message.reply(`❌ ${response.data.error}`);
      }

      return message.reply({
        body: "",
        attachment: response.data
      });

    } catch (error) {
      console.error("❌ Say command error:", error.message);
      return message.reply("🥹 An error occurred while processing your request. Please contact MahMUD.");
    }
  }
};
