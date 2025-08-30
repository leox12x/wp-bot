const axios = require("axios");

let cachedApiBaseUrl = null;

const getApiBaseUrl = async () => {
  if (cachedApiBaseUrl) return cachedApiBaseUrl;

  try {
    const { data } = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json", {
      timeout: 5000
    });
    cachedApiBaseUrl = data.mahmud;
    return cachedApiBaseUrl;
  } catch {
    throw new Error("❌ Failed to load AI base URL.");
  }
};

module.exports = {
  config: {
    name: "ai",
    aliases: [],
    version: "1.0",
    author: "MahMUD",
    role: 0, // 0: All users
    shortDescription: "Ask AI any question",
    longDescription: "Ask anything to the AI and receive an intelligent reply.",
    category: "ai",
    guide: "{pn} <question>",
    coolDown: 5
  },

  onStart: async ({ message, args }) => {
    if (!args.length) {
      return message.reply("❓ Please provide a question.");
    }

    const query = args.join(" ");
    let apiUrl;

    try {
      const base = await getApiBaseUrl();
      apiUrl = `${base}/api/ai`;
    } catch (err) {
      return message.reply(err.message);
    }

    try {
      const { data } = await axios.post(
        apiUrl,
        { question: query },
        {
          headers: {
            "Content-Type": "application/json",
            author: "tas33n & MahMUD"
          },
          timeout: 10000
        }
      );

      const reply = data.response || data.error || "🤖 AI failed to respond.";
      return message.reply(reply);
    } catch (err) {
      console.error("[AI Command Error]", err.message);
      return message.reply("⚠️ Something went wrong while fetching AI response.");
    }
  }
};
