module.exports = {
  config: {
    name: "uid",
    version: "1.0",
    author: "Rahaman Leon",
    role: 0,
    description: {
      en: "Show your user ID"
    },
    category: "Utility",
    guide: {
      en: "{pn} — get your WhatsApp user ID"
    }
  },

  onStart: async function({ message, event }) {
    const userID = event.senderID || event.sender;
    await message.reply(`🆔 Your User ID is:\n${userID}`);
  }
};
