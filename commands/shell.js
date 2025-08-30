const { exec } = require("child_process");

module.exports = {
  config: {
    name: "shell",
    aliases: [ "terminal"],
    version: "1.1",
    author: "Rahaman Leon",
    role: 2, // Owner only
    coolDown: 10,
    description: "Execute shell commands (Owner only)",
    category: "owner",
    guide: {
      en: "Use {prefix}shell <command> to execute shell commands"
    }
  },

  onStart: async function({ message, args, config }) {
    try {
      // Check if user is bot owner
      const contact = await message.getContact();
      const isOwner = config.adminBot.includes(contact.id._serialized);
      
      if (!isOwner) {
        return await message.reply("❌ You do not have permission to use this command.");
      }

      if (!args.length) {
        return await message.reply("⚠️ Please provide a shell command to run.");
      }

      const command = args.join(" ");
      
      // Security check - block dangerous commands
      const dangerousCommands = ['rm -rf', 'del', 'format', 'shutdown', 'reboot', 'passwd'];
      const isDangerous = dangerousCommands.some(dangerous => 
        command.toLowerCase().includes(dangerous)
      );
      
      if (isDangerous) {
        return await message.reply("⚠️ This command is blocked for security reasons.");
      }

      await message.reply("🔄 Executing command...");

      exec(command, { 
        timeout: 10000, 
        maxBuffer: 1024 * 1024 
      }, async (error, stdout, stderr) => {
        try {
          if (error) {
            await message.reply(`❌ **Error:**\n\`\`\`\n${error.message}\n\`\`\``);
            return;
          }
          
          if (stderr) {
            await message.reply(`⚠️ **Stderr:**\n\`\`\`\n${stderr}\n\`\`\``);
            return;
          }

          const output = stdout.trim() || "✅ Command executed with no output.";
          // Limit message size to avoid WhatsApp message limit
          const reply = output.length > 1900 ? 
            output.slice(0, 1900) + "\n\n...[truncated]" : output;

          await message.reply(`📢 **Output:**\n\`\`\`\n${reply}\n\`\`\``);
        } catch (replyError) {
          console.error("Shell command reply error:", replyError);
        }
      });
    } catch (error) {
      console.error("Shell command error:", error);
      await message.reply("❌ Failed to execute shell command.");
    }
  }
};
