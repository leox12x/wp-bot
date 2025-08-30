const { log } = require('../scripts/helpers');
const User = require('../models/User');

module.exports = {
  config: {
    name: "top2",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    category: "economy",
    guide: {
      en: "Use `{pn}` or `{pn} bal` to view richest users, `{pn} exp` to view top EXP users"
    }
  },

  onStart: async function ({ message, args }) {
    try {
      const type = (args[0] || "bal").toLowerCase();

      let users;
      if (type === "exp") {
        users = await User.find({ exp: { $gt: 0 } }).sort({ exp: -1 }).limit(15);
        if (!users.length) return message.reply("No users with EXP to display.");
      } else {
        users = await User.find({ coins: { $gt: 0 } }).sort({ coins: -1 }).limit(15);
        if (!users.length) return message.reply("No users with money to display.");
      }

      const medals = ["🥇", "🥈", "🥉"];

      const topList = users.map((user, i) => {
        const rank = i < 3 ? medals[i] : `${i + 1}.`;
        const displayName = user.name || user.id;
        const value = type === "exp" ? `${user.exp} EXP` : `${formatNumber(user.coins)}$`;
        return `${rank} ${displayName}: ${value}`;
      });

      const title = type === "exp"
        ? "👑 TOP 15 EXP USERS:\n"
        : "👑 | Top 15 Richest Users:\n";

      return message.reply(`${title}\n${topList.join("\n")}`);

    } catch (error) {
      log(`Top command error: ${error.message}`, "error");
      return message.reply("❌ An error occurred while fetching leaderboard.");
    }
  }
};

// Format number with suffix (K, M, B...)
function formatNumber(num) {
  const units = ["", "K", "M", "B", "T"];
  let unit = 0;
  while (num >= 1000 && unit < units.length - 1) {
    num /= 1000;
    unit++;
  }
  return `${Number(num.toFixed(1))}${units[unit]}`;
}
