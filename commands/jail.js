// commands/jail.js
const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");
const { MessageMedia } = require("whatsapp-web.js");
const fetch = require("node-fetch"); // Required only for Node.js < 18

module.exports = {
    config: {
        name: "jail",
        version: "1.1.1",
        author: "tas33n",
        role: 0,
        coolDown: 5,
        shortDescription: "Put someone in jail (image)",
        longDescription: "Apply a jail filter to a user's profile photo.",
        category: "fun",
        guide: "jail @mention or reply to someone"
    },

    onStart: async function ({ message, client }) {
        try {
            const quotedMsg = message.hasQuotedMsg ? await message.getQuotedMessage() : null;
            const mentionedIds = message.mentionedIds;
            const targetId = mentionedIds[0] || (quotedMsg?.author || quotedMsg?.from);

            if (!targetId) {
                return await message.reply("❌ Tag or reply to someone to jail them.");
            }

            const targetContact = await client.getContactById(targetId);
            const avatarUrl = await targetContact.getProfilePicUrl();

            let buffer;

            if (avatarUrl) {
                const res = await fetch(avatarUrl);
                buffer = Buffer.from(await res.arrayBuffer());
            } else {
                // Fallback placeholder avatar image (must exist)
                const fallbackPath = path.join(__dirname, "..", "assets", "default-avatar.jpg");
                if (!fs.existsSync(fallbackPath)) {
                    return await message.reply("❌ Could not fetch profile, and fallback image not found.");
                }
                buffer = await fs.readFile(fallbackPath);
            }

            const jailImg = await new DIG.Jail().getImage(buffer);
            const tmpPath = path.join(__dirname, "..", "tmp", `${targetId}_jail.png`);

            await fs.ensureDir(path.dirname(tmpPath));
            await fs.writeFile(tmpPath, jailImg);

            const media = MessageMedia.fromFilePath(tmpPath);
            await message.reply(media, undefined, { caption: "🚔 You're under arrest!" });

            await fs.unlink(tmpPath);
        } catch (error) {
            console.error("Jail command error:", error);
            await message.reply("❌ Something went wrong while jailing.");
        }
    }
};
