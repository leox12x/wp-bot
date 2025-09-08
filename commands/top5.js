const User = require('../models/User');

module.exports = {
  config: {
    name: "top5",
    version: "1.2",
    author: "Mahmud",
    description: "Shows top users by EXP and Coins",
    category: "economy",
    role: 0
  },

  onStart: async function ({ message }) {
    const users = await User.find({});

    const topExp = [...users]
      .sort((a, b) => b.exp - a.exp)
      .slice(0, 10)
      .map((user, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        return `${medal} ${user.name || user.id}: ${user.exp} EXP`;
      }).join("\n");

    const topCoins = [...users]
      .sort((a, b) => b.coins - a.coins)
      .slice(0, 10)
      .map((user, i) => {
        const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
        return `${medal} ${user.name || user.id}: ${user.coins}$`;
      }).join("\n");

    message.reply(`👑 TOP EXP USERS:\n\n${topExp}\n\n👑 TOP COINS USERS:\n\n${topCoins}`);
  }
};
