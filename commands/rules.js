// Universal rules command that works across different WhatsApp bot frameworks

const { getPrefix } = global.utils || {};

module.exports = {
  config: {
    name: "rules",
    version: "1.7",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    description: "Create/view/add/edit/move/delete group rules",
    category: "group",
    guide: "   {pn} [add | -a] <rule>: add a rule\n"
      + "   {pn}: view all rules\n"
      + "   {pn} [edit | -e] <n> <new content>: edit rule n\n"
      + "   {pn} [move | -m] <pos1> <pos2>: swap rules at positions\n"
      + "   {pn} [delete | -d] <n>: delete rule n\n"
      + "   {pn} [remove | -r]: remove all rules\n"
      + "\nExamples:\n"
      + "{pn} add Don't spam\n"
      + "{pn} move 1 3\n"
      + "{pn} -e 1 No spamming messages\n"
      + "{pn} -r"
  },

  onStart: async function ({ role, args, message, event, threadsData }) {
    // Safely get chat/thread ID and sender ID from event (works with whatsapp-web.js and similar)
    const threadID = event.threadID || event.chatId || event.chat?.id || event.from;
    const senderID = event.sender?.id || event.author || event.senderID || event.from;

    if (!threadID) {
      return message.reply("❌ Could not identify chat.");
    }

    // Retrieve existing rules, fallback empty array
    let rules = [];
    try {
      rules = (threadsData && typeof threadsData.get === "function")
        ? await threadsData.get(threadID, "data.rules", [])
        : (global.database?.rules?.[threadID] || []);
    } catch {
      rules = [];
    }
    if (!Array.isArray(rules)) rules = [];

    const total = rules.length;
    const isAdmin = role > 0 || role === undefined; // fallback allow if role check unavailable

    // Save rules helper
    const saveRules = async (newRules) => {
      if (threadsData && typeof threadsData.set === "function") {
        await threadsData.set(threadID, newRules, "data.rules");
      } else {
        if (!global.database) global.database = {};
        if (!global.database.rules) global.database.rules = {};
        global.database.rules[threadID] = newRules;
      }
    };

    // Parse numbers safely
    const parsePos = (str) => {
      const n = parseInt(str);
      return (isNaN(n) || n <= 0) ? null : n;
    };

    const type = args[0];

    // Show all rules
    if (!type) {
      if (total === 0)
        return message.reply(`📋 No rules found. Add one with \`rules add <rule>\`.`);

      let text = "📋 Group Rules:\n";
      rules.forEach((r, i) => text += `${i + 1}. ${r}\n`);
      return message.reply(text);
    }

    // Add rule
    if (["add", "-a"].includes(type)) {
      if (!isAdmin) return message.reply("❌ Only admins can add rules.");
      const content = args.slice(1).join(" ").trim();
      if (!content) return message.reply("❌ Please specify the rule content.");
      rules.push(content);
      await saveRules(rules);
      return message.reply(`✅ Added rule ${rules.length}: "${content}"`);
    }

    // Edit rule
    if (["edit", "-e"].includes(type)) {
      if (!isAdmin) return message.reply("❌ Only admins can edit rules.");
      const pos = parsePos(args[1]);
      if (!pos || pos > total) return message.reply(`❌ Invalid rule number. Must be between 1 and ${total}.`);
      const newContent = args.slice(2).join(" ").trim();
      if (!newContent) return message.reply("❌ Please specify new content.");
      const old = rules[pos - 1];
      rules[pos - 1] = newContent;
      await saveRules(rules);
      return message.reply(`✅ Edited rule ${pos}:\nOld: "${old}"\nNew: "${newContent}"`);
    }

    // Move/swap rules
    if (["move", "-m"].includes(type)) {
      if (!isAdmin) return message.reply("❌ Only admins can move rules.");
      const pos1 = parsePos(args[1]);
      const pos2 = parsePos(args[2]);
      if (!pos1 || !pos2 || pos1 > total || pos2 > total)
        return message.reply(`❌ Invalid positions. Must be between 1 and ${total}.`);
      if (pos1 === pos2) return message.reply("❌ Positions must be different.");
      [rules[pos1 - 1], rules[pos2 - 1]] = [rules[pos2 - 1], rules[pos1 - 1]];
      await saveRules(rules);
      return message.reply(`✅ Swapped rules ${pos1} and ${pos2}.`);
    }

    // Delete rule
    if (["delete", "-d", "del"].includes(type)) {
      if (!isAdmin) return message.reply("❌ Only admins can delete rules.");
      const pos = parsePos(args[1]);
      if (!pos || pos > total) return message.reply(`❌ Invalid rule number. Must be between 1 and ${total}.`);
      const removed = rules.splice(pos - 1, 1)[0];
      await saveRules(rules);
      return message.reply(`✅ Deleted rule ${pos}: "${removed}"`);
    }

    // Remove all rules
    if (["remove", "-r", "reset", "-rm"].includes(type)) {
      if (!isAdmin) return message.reply("❌ Only admins can remove all rules.");
      if (total === 0) return message.reply("❌ No rules to remove.");
      await saveRules([]);
      return message.reply(`✅ Removed all ${total} rules.`);
    }

    // View specific rules by number(s)
    if (!isNaN(type)) {
      const numbers = args.map(parsePos).filter(n => n && n <= total);
      if (numbers.length === 0)
        return message.reply(`❌ Invalid rule numbers. Must be between 1 and ${total}.`);
      let text = "📋 Requested Rules:\n";
      numbers.forEach(n => text += `${n}. ${rules[n - 1]}\n`);
      return message.reply(text);
    }

    // Invalid command
    return message.reply("❌ Invalid command. Use help for instructions.");
  }
};
