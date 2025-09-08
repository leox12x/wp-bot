module.exports = {
    config: {
        name: "unsend",
        version: "1.0.0",
        author: "Bot Team",
        description: "Handle message deletion/unsend"
    },
    
    execute: async function(client, { after, before }) {
        try {
            if (!before) return;
            
            const config = require('../config.json');
            if (!config.logEvents.reaction) return;
            
            const chat = await client.getChatById(before.from);
            const contact = await client.getContactById(before.author || before.from);
            
            console.log(`🗑️ Message deleted by ${contact.name || contact.number}: ${before.body}`);
            
            // Optionally log deleted messages to admin
            const adminIds = config.adminBot;
            if (adminIds.length > 0 && before.body) {
                const logMessage = `🗑️ *Message Deleted*\n\n` +
                                 `👤 User: ${contact.name || contact.number}\n` +
                                 `💬 Group: ${chat.name || 'Private Chat'}\n` +
                                 `📝 Content: ${before.body}`;
                
                for (const adminId of adminIds) {
                    try {
                        await client.sendMessage(adminId, logMessage);
                    } catch (error) {
                        console.error('Error sending deletion log to admin:', error);
                    }
                }
            }
            
        } catch (error) {
            console.error('Error in unsend event:', error);
        }
    }
};