module.exports = {
  config: {
    name: "unsend",
    aliases: ["uns", "r", "unsent", "u"],
    version: "1.5",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    category: "group",
    description: {
      en: "Unsend bot's message"
    },
    guide: {
      en: "Reply to the bot's message and use {pn}"
    }
  },

  langs: {
    en: {
      syntaxError: "❌ Please reply to a bot message you want to unsend.",
      notBotMsg: "⚠️ That message was not sent by the bot."
    }
  },

  onStart: async function ({ message, event, api, getLang }) {
    const replyMsg = event.messageReply;

    if (!replyMsg)
      return message.reply(getLang("syntaxError"));

    const botID = api.getCurrentUserID();
    if (replyMsg.senderID !== botID)
      return message.reply(getLang("notBotMsg"));

    try {
      await message.unsend(replyMsg.messageID);
    } catch (err) {
      console.error("❌ Unsend Error:", err);
      return message.reply("❌ Failed to unsend the message.");
    }
  }
};
