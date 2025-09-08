const fs = require("fs-extra");
const path = require("path");
const { spawn } = require("child_process");

module.exports = {
  config: {
    name: "restart2",
    version: "1.3",
    author: "Rahaman Leon", 
    coolDown: 5,
    role: 2, // Bot owner only
    description: {
      en: "Restart the WhatsApp bot",
      vi: "Khởi động lại bot WhatsApp",
    },
    category: "Owner",
    guide: {
      en: "Use {pn} to restart the bot",
      vi: "{pn}: Khởi động lại bot",
    },
  },

  onStart: async function ({ message, client, contact }) {
    try {
      // Check if user is authorized (bot owner)
      const config = require("../config.json");
      const userId = contact.id._serialized;
      
      if (!config.adminBot.includes(userId)) {
        return await message.reply("❌ You don't have permission to restart the bot.");
      }

      // Create restart flag file
      const tempDir = path.join(__dirname, "..", "tmp");
      await fs.ensureDir(tempDir);
      
      const restartFile = path.join(tempDir, "restart.txt");
      const restartData = {
        chatId: message.from,
        timestamp: Date.now(),
        userId: contact.id._serialized,
        userName: contact.name || contact.pushname || "Unknown"
      };

      await fs.writeFile(restartFile, JSON.stringify(restartData));

      // Send restart message
      await message.reply("🔄 **Restarting WhatsApp Bot...**\n\n⏳ Please wait, this may take a few moments.");

      // Log restart action
      console.log(`🔄 Bot restart initiated by ${contact.name || contact.number} at ${new Date().toLocaleString()}`);

      // Check if PM2 is being used
      const isPM2 = process.env.PM2_HOME || process.env.pm_id;
      
      if (isPM2) {
        // If using PM2, just exit
        setTimeout(() => {
          console.log("🔄 Initiating bot restart (PM2)...");
          process.exit(0);
        }, 2000);
      } else {
        // If not using PM2, try to restart using spawn
        setTimeout(() => {
          console.log("🔄 Initiating bot restart (spawn)...");
          
          // Spawn a new process
          const child = spawn(process.argv[0], process.argv.slice(1), {
            detached: true,
            stdio: 'inherit'
          });
          
          child.unref();
          process.exit(0);
        }, 2000);
      }

    } catch (error) {
      console.error("Restart command error:", error);
      await message.reply("❌ Failed to restart the bot. Please check the console for errors.");
    }
  },

  // Function to handle post-restart notification
  checkRestart: async function(client) {
    try {
      const restartFile = path.join(__dirname, "..", "tmp", "restart.txt");
      
      if (await fs.pathExists(restartFile)) {
        const fileContent = await fs.readFile(restartFile, "utf-8");
        
        // Try to parse as JSON first
        let restartData;
        try {
          restartData = JSON.parse(fileContent);
        } catch (parseError) {
          console.log("Restart file is not valid JSON, cleaning up...");
          await fs.remove(restartFile);
          return;
        }
        
        const downtime = ((Date.now() - restartData.timestamp) / 1000).toFixed(1);
        
        const message = `✅ **Bot Restarted Successfully!**\n\n` +
                       `⏰ **Downtime:** ${downtime} seconds\n` +
                       `👤 **Restarted by:** ${restartData.userName}\n` +
                       `🕐 **Time:** ${new Date().toLocaleString()}`;

        await client.sendMessage(restartData.chatId, message);
        
        // Clean up restart file
        await fs.remove(restartFile);
        
        console.log(`✅ Restart notification sent. Downtime: ${downtime}s`);
      }
    } catch (error) {
      console.error("Error checking restart file:", error);
      // Clean up problematic file
      try {
        const restartFile = path.join(__dirname, "..", "tmp", "restart.txt");
        if (await fs.pathExists(restartFile)) {
          await fs.remove(restartFile);
          console.log("Cleaned up problematic restart file");
        }
      } catch (cleanupError) {
        console.error("Error cleaning up restart file:", cleanupError);
      }
    }
  }
};
