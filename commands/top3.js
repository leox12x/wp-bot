const { getUserData, log } = require('../scripts/helpers');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    config: {
        name: "leaderboard3",
        aliases: ["top3"],
        version: "1.0",
        author: "Rl",
        coolDown: 5,
        role: 0, // Available to all users
        description: "View top players leaderboard",
        category: "game",
        guide: {
            en: "Use {prefix}leaderboard to view top players\nUse {prefix}leaderboard coins to view richest players\nUse {prefix}leaderboard exp to view most experienced players"
        }
    },

    onStart: async function ({ message, args, config, client }) {
        try {
            const type = args[0] || "level";
            const validTypes = ["level", "coins", "exp", "commands"];
            
            if (!validTypes.includes(type)) {
                return await message.reply(`❌ Invalid leaderboard type. Use: ${validTypes.join(", ")}`);
            }
            
            // Get all users data
            const dbPath = path.join(__dirname, '..', config.database.path);
            const data = await fs.readJSON(dbPath);
            const users = data.users || {};
            
            if (Object.keys(users).length === 0) {
                return await message.reply("❌ No user data found. Start using commands to appear on the leaderboard!");
            }
            
            // Convert to array and sort
            const userArray = Object.values(users);
            let sortedUsers;
            let titleIcon, titleText, valueFormat;
            
            switch (type) {
                case "coins":
                    sortedUsers = userArray.sort((a, b) => b.coins - a.coins);
                    titleIcon = "💰";
                    titleText = "Richest Players";
                    valueFormat = (user) => `${user.coins.toLocaleString()} coins`;
                    break;
                case "exp":
                    sortedUsers = userArray.sort((a, b) => b.exp - a.exp);
                    titleIcon = "⭐";
                    titleText = "Most Experienced";
                    valueFormat = (user) => `${user.exp.toLocaleString()} XP`;
                    break;
                case "commands":
                    sortedUsers = userArray.sort((a, b) => (b.commandCount || 0) - (a.commandCount || 0));
                    titleIcon = "🎮";
                    titleText = "Most Active";
                    valueFormat = (user) => `${user.commandCount || 0} commands`;
                    break;
                default: // level
                    sortedUsers = userArray.sort((a, b) => {
                        if (b.level !== a.level) return b.level - a.level;
                        return b.exp - a.exp; // Tie-breaker by experience
                    });
                    titleIcon = "🏆";
                    titleText = "Top Leveled";
                    valueFormat = (user) => `Level ${user.level} (${user.exp.toLocaleString()} XP)`;
                    break;
            }
            
            // Get top 10 users
            const topUsers = sortedUsers.slice(0, 10);
            
            // Build leaderboard message
            let leaderboardMessage = `${titleIcon} **${titleText} Leaderboard**\n\n`;
            
            for (let i = 0; i < topUsers.length; i++) {
                const user = topUsers[i];
                const rank = i + 1;
                const medal = this.getRankMedal(rank);
                
                // Try to get user name from WhatsApp contact
                let userName = "Unknown User";
                try {
                    const contact = await client.getContactById(user.id);
                    userName = contact.name || contact.number || "Unknown User";
                } catch (error) {
                    userName = user.id.split('@')[0] || "Unknown User";
                }
                
                // Limit name length
                if (userName.length > 20) {
                    userName = userName.substring(0, 17) + "...";
                }
                
                leaderboardMessage += `${medal} **${rank}.** ${userName}\n`;
                leaderboardMessage += `   ${valueFormat(user)}\n\n`;
            }
            
            leaderboardMessage += `📊 **Total Players:** ${Object.keys(users).length}\n`;
            leaderboardMessage += `🎯 **Use !profile to check your stats!**`;
            
            await message.reply(leaderboardMessage);
            
            // Log leaderboard access
            log(`Leaderboard (${type}) accessed`, 'info');
            
        } catch (error) {
            log(`Error in leaderboard command: ${error.message}`, 'error');
            await message.reply("❌ An error occurred while fetching leaderboard data. Please try again later.");
        }
    },

    getRankMedal(rank) {
        const medals = {
            1: "🥇",
            2: "🥈", 
            3: "🥉",
            4: "🏅",
            5: "🏅"
        };
        return medals[rank] || "▪️";
    }
};
