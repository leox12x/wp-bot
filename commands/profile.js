const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');

module.exports = {
    config: {
        name: "profile",
        aliases: ["pp", "pfp"],
        version: "1.2",
        author: "Rahaman Leon",
        coolDown: 5,
        role: 0,
        description: "Get profile picture or default avatar",
        category: "utility",
        guide: {
            en: "{prefix}profile - Your profile pic\n{prefix}profile @mention - Mentioned user\n{prefix}profile reply - Replied user"
        }
    },

    onStart: async function ({ message, client }) {
        try {
            const userId = await resolveTargetId(message);
            const userName = await getUserName(client, userId);
            const picUrl = await client.getProfilePicUrl(userId).catch(() => null);

            const { media, caption } = picUrl
                ? await getProfileMedia(picUrl, userName)
                : await getDefaultMedia(userId, userName);

            const replyId = message.hasQuotedMsg
                ? (await message.getQuotedMessage()).id._serialized
                : message.id._serialized;

            await client.sendMessage(message.from, media, {
                caption,
                quotedMessageId: replyId
            });

        } catch (err) {
            console.error("Profile command error:", err);
            await message.reply("❌ Failed to get profile picture.");
        }
    }
};

async function resolveTargetId(message) {
    if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        return quoted.author || quoted.from;
    }
    if (message.mentionedIds?.length > 0) {
        return message.mentionedIds[0];
    }
    return message.author || message.from;
}

async function getUserName(client, id) {
    try {
        const contact = await client.getContactById(id);
        return contact.pushname || contact.name || contact.number || "User";
    } catch {
        return "User";
    }
}

async function getProfileMedia(url, name) {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);
    const media = new MessageMedia('image/jpeg', buffer.toString('base64'), 'profile.jpg');
    const caption = `>🎀 *${name}'\n𝐇𝐞𝐫𝐞'𝐬 𝐲𝐨𝐮𝐫 𝐩𝐫𝐨𝐟𝐢𝐥𝐞 <😘`;
    return { media, caption };
}

async function getDefaultMedia(userId, name) {
    const avatarUrl = `https://api.dicebear.com/7.x/initials/png?seed=${encodeURIComponent(userId.split('@')[0])}&backgroundColor=b6e3f4&textColor=ffffff`;

    const res = await axios.get(avatarUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(res.data);
    const media = new MessageMedia('image/png', buffer.toString('base64'), 'default_avatar.png');
    const caption = `👤 *${name} has no profile picture*\n🔄 Showing default avatar`;
    return { media, caption };
}
