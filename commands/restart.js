const fs = require('fs-extra');
const path = require('path');
const restartFilePath = path.join(__dirname, '..', 'tmp', 'restart.txt');

module.exports = {
    config: {
        name: "restart",
        aliases: ["reboot", "rerun"],
        version: "1.5",
        author: "Rahaman Leon",
        coolDown: 10,
        role: 2, // Owner only
        description: "Restart the WhatsApp bot",
        category: "owner",
        guide: {
            en: "{prefix}restart - Restart the bot (Owner only)"
        }
    },
    
    onStart: async function ({ message, client, config, contact }) {
        try {
            const userId = contact.id._serialized;
            
            // Check if config exists and has adminBot property
            if (!config || !config.adminBot || !Array.isArray(config.adminBot)) {
                console.error('❌ Config error: adminBot not properly configured');
                return await message.reply("❌ Configuration Error: Admin settings not found. Please check config.json");
            }
            
            const isOwner = config.adminBot.includes(userId);
            if (!isOwner) {
                return await message.reply("❌ Access Denied: Only bot owners can restart the bot.");
            }

            // Create restart data - using the same format as restart-alt.js
            const restartData = {
                chatId: message.from,
                userId,
                userName: contact.name || contact.pushname || "Owner",
                timestamp: Date.now(),
                reason: "Manual restart"
            };

            // Ensure tmp directory exists
            const tmpDir = path.join(__dirname, '..', 'tmp');
            await fs.ensureDir(tmpDir);

            // Write restart data to file
            await fs.writeFile(restartFilePath, JSON.stringify(restartData, null, 2));
            
            // Send restart notification
            await message.reply("🔄 Bot is restarting...\n⏳ Please wait a moment.");
            
            // Log restart action
            console.log(`🔄 Bot restart initiated by ${restartData.userName} (${userId})`);
            console.log(`📝 Restart data saved to: ${restartFilePath}`);
            
            // Small delay to ensure message is sent
            setTimeout(async () => {
                try {
                    // Graceful shutdown
                    if (client && typeof client.destroy === 'function') {
                        await client.destroy();
                    }
                    
                    // Force exit if graceful shutdown fails
                    setTimeout(() => {
                        process.exit(0);
                    }, 3000);
                    
                    // Normal exit
                    process.exit(0);
                    
                } catch (error) {
                    console.error('❌ Error during restart:', error);
                    process.exit(1);
                }
            }, 1000);

        } catch (error) {
            console.error('❌ Restart command error:', error);
            
            try {
                await message.reply("❌ Failed to restart bot. Please check console for details.");
            } catch (replyError) {
                console.error('❌ Failed to send error message:', replyError);
            }
        }
    },

    // Optional: Handle restart completion (called when bot starts up)
    onRestart: async function ({ client, config }) {
        try {
            // Check if restart file exists
            if (!await fs.pathExists(restartFilePath)) {
                return; // No restart data, normal startup
            }

            // Read restart data
            const restartData = JSON.parse(await fs.readFile(restartFilePath, 'utf8'));
            
            // Calculate restart time
            const restartTime = ((Date.now() - restartData.timestamp) / 1000).toFixed(2);
            
            // Send restart completion message
            const completionMessage = `✅ Bot restart completed successfully!\n⏱️ Restart time: ${restartTime}s\n👤 Initiated by: ${restartData.userName}`;
            
            try {
                await client.sendMessage(restartData.chatId, completionMessage);
            } catch (sendError) {
                console.log('ℹ️ Could not send restart completion message:', sendError.message);
            }
            
            // Log restart completion
            console.log(`✅ Bot restart completed in ${restartTime}s`);
            console.log(`📋 Restart initiated by: ${restartData.userName}`);
            
            // Clean up restart file
            await fs.remove(restartFilePath);
            
        } catch (error) {
            console.error('❌ Error handling restart completion:', error);
            
            // Clean up restart file even if there's an error
            try {
                await fs.remove(restartFilePath);
            } catch (cleanupError) {
                console.error('❌ Failed to clean up restart file:', cleanupError);
            }
        }
    }
};