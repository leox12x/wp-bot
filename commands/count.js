// Simple in-memory message counting
if (!global.messageCounts) {
  global.messageCounts = {};
}

module.exports = {
  config: {
    name: "count",
    aliases: ["msgcount", "messages", "c"],
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    shortDescription: "Count user's messages",
    longDescription: "Tracks how many messages each user sends in a WhatsApp group",
    category: "group",
    guide: {
      en: "{pn} - Show your message count\n{pn} all - Show leaderboard"
    }
  },

  onStart: async function ({ message, args, command }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat?.id?._serialized;
      const userID = contact?.id?._serialized;
      const userName = contact?.pushname || "Unknown";
      const commandName = command?.config?.name || "unknown";

      // Safely track command usage
      if (userID) {
        if (!global.commandCount) global.commandCount = {};
        if (!global.commandCount[userID]) global.commandCount[userID] = {};
        if (!global.commandCount[userID][commandName]) global.commandCount[userID][commandName] = 0;
        global.commandCount[userID][commandName]++;
      }

      if (!threadID || !userID) return message.reply("❌ Unable to identify user or group.");

      if (args[0]?.toLowerCase() === "all") {
        const groupCounts = global.messageCounts[threadID] || {};
        const sortedUsers = Object.entries(groupCounts)
          .map(([uid, data]) => ({ userID: uid, ...data }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 50);

        if (sortedUsers.length === 0)
          return message.reply("❌ No message data found for this group.");

        let msg = "📊 Group Message Leaderboard:\n";
        sortedUsers.forEach((user, i) => {
          const rank = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          msg += `\n${rank} ${user.name}: ${user.count} msg`;
        });

        return message.reply(msg);
      }

      const userCount = global.messageCounts[threadID]?.[userID]?.count || 0;

      if (userCount === 0)
        return message.reply("❌ No message data found for you.");

      return message.reply(`✅ ${userName}, you have sent ${userCount} messages in this group.`);
    } catch (err) {
      console.error("❌ count command error:", err);
      return message.reply("❌ An error occurred: " + err.message);
    }
  },

  onChat: async function ({ message }) {
    try {
      const chat = await message.getChat();
      const contact = await message.getContact();
      const threadID = chat?.id?._serialized;
      const userID = contact?.id?._serialized;
      const userName = contact?.pushname || "Unknown";

      if (!threadID || !userID) return;

      if (!global.messageCounts[threadID]) {
        global.messageCounts[threadID] = {};
      }

      if (!global.messageCounts[threadID][userID]) {
        global.messageCounts[threadID][userID] = {
          name: userName,
          count: 0
        };
      }

      global.messageCounts[threadID][userID].count += 1;
      if (userName && userName !== "Unknown") {
        global.messageCounts[threadID][userID].name = userName;
      }
    } catch (err) {
      console.error("❌ Error updating message count:", err);
    }
  }
};
