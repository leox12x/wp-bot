const { getGroupData } = require('../scripts/helpers');

module.exports = {
    config: {
        name: "leave",
        version: "1.0.0",
        author: "Bot Team",
        description: "Handle user leaving group"
    },
    
    langs: {
        en: {
            goodbye: "👋 Goodbye *{userName}*!\n\nWe'll miss you! Hope to see you again soon. 💙"
        }
    },
    
    execute: async function(client, notification) {
        try {
            const chat = await client.getChatById(notification.chatId);
            const contact = await client.getContactById(notification.recipientIds[0]);
            
            if (!chat.isGroup) return;
            
            const groupData = await getGroupData(notification.chatId);
            
            // Check if goodbye message is enabled for this group
            if (groupData.settings && groupData.settings.goodbyeDisabled) return;
            
            const goodbyeMessage = `👋 Goodbye *${contact.name || contact.pushname || contact.number}*!\n\nWe'll miss you! Hope to see you again soon. 💙`;
            
            await chat.sendMessage(goodbyeMessage);
            
        } catch (error) {
            console.error('Error in leave event:', error);
        }
    }
};