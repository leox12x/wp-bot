const axios = require("axios");

const baseApiUrl = async () => {
  const base = await axios.get("https://raw.githubusercontent.com/mahmudx7/exe/main/baseApiUrl.json");
  return base.data.jan;
};

const getBotResponse = async (msg) => {
  try {
    const base = await baseApiUrl();
    const res = await axios.get(`${base}/jan/font3/${encodeURIComponent(msg)}`);
    return res.data?.message || "❌ Try again.";
  } catch (err) {
    console.error("API Error:", err.message || err);
    return "❌ Error occurred, janu 🥲";
  }
}; 


module.exports = {
  config: {
    name: "bot",
    version: "1.7",
    author: "MahMUD",
    role: 0,
    coolDown: 3,
    shortDescription: "Talk with jan",
    longDescription: "Text-based response using jan AI",
    category: "ai",
    guide: "Just type jan or jan <message>, or reply jan message"

 },

  onStart: async function () {},

  onChat: async function ({ message, client }) {

try {
      const body = message.body?.toLowerCase() || "";
      const triggers = ["jan", "jaan", "জান", "hinata", "bby", "baby"];
      const words = body.trim().split(/\s+/);
      const match = triggers.some(trigger => body.startsWith(trigger));

      // ✅ 1. Handle reply to jan message
      if (message.hasQuotedMsg) {
        const quoted = await message.getQuotedMessage();
        if (quoted.fromMe) {
          const replyText = await getBotResponse(body);
          return await message.reply(replyText);
        }

   }

      // ✅ 2. Normal "jan ..." message
      if (match) {
        if (words.length === 1) {
          const replies = [
            "babu khuda lagse🥺",
      "Hop beda😾,Boss বল boss😼",  
      "আমাকে ডাকলে ,আমি কিন্তূ কিস করে দেবো😘 ",  
      "🐒🐒🐒",
      "naw message daw m.me/mahmud.x07",
      "mb ney bye bby😘",
      "meww meow",
      "গোলাপ ফুল এর জায়গায় আমি দিলাম তোমায় মেসেজ",
      "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",  
      "𝗜 𝗹𝗼𝘃𝗲 𝘆𝗼𝘂__😘😘",
      "𝗜 𝗵𝗮𝘁𝗲 𝘆𝗼𝘂__😏😏",
      "গোসল করে আসো যাও😑😩",
      "অ্যাসলামওয়ালিকুম",
      "কেমন আসো",
      "বলেন sir__😌",
      "বলেন ম্যাডাম__😌",
      "আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে",
      "🙂🙂🙂",
      "এটায় দেখার বাকি সিলো_🙂🙂🙂",
      "𝗕𝗯𝘆 𝗯𝗼𝗹𝗹𝗮 𝗽𝗮𝗽 𝗵𝗼𝗶𝗯𝗼 😒😒",
      "𝗧𝗮𝗿𝗽𝗼𝗿 𝗯𝗼𝗹𝗼_🙂",
      "𝗕𝗲𝘀𝗵𝗶 𝗱𝗮𝗸𝗹𝗲 𝗮𝗺𝗺𝘂 𝗯𝗼𝗸𝗮 𝗱𝗲𝗯𝗮 𝘁𝗼__🥺",
        "𝗕𝗯𝘆 না জানু, বল 😌",
        "বেশি bby Bbby করলে leave নিবো কিন্তু 😒😒",
        "__বেশি বেবি বললে কামুর দিমু 🤭🤭",
        "𝙏𝙪𝙢𝙖𝙧 𝙜𝙛 𝙣𝙖𝙞, 𝙩𝙖𝙮 𝙖𝙢𝙠 𝙙𝙖𝙠𝙨𝙤? 😂😂😂",
        "bolo baby😒",
        "তোর কথা তোর বাড়ি কেউ শুনে না ,তো আমি কোনো শুনবো ?🤔😂",
        "আমি তো অন্ধ কিছু দেখি না🐸 😎",
        "আম গাছে আম নাই ঢিল কেন মারো, তোমার সাথে প্রেম নাই বেবি কেন ডাকো 😒🫣",
        "𝗼𝗶𝗶 ঘুমানোর আগে.! তোমার মনটা কথায় রেখে ঘুমাও.!🤔_নাহ মানে চুরি করতাম 😞😘",
       "𝗕𝗯𝘆 না বলে 𝗕𝗼𝘄 বলো 😘",
        "দূরে যা, তোর কোনো কাজ নাই, শুধু 𝗯𝗯𝘆 𝗯𝗯𝘆 করিস  😉😋🤣",
        "এই এই তোর পরীক্ষা কবে? শুধু 𝗕𝗯𝘆 𝗯𝗯𝘆 করিস 😾",
        "তোরা যে হারে 𝗕𝗯𝘆 ডাকছিস আমি তো সত্যি বাচ্চা হয়ে যাবো_☹😑",
        "আজব তো__😒",
        "আমাকে ডেকো না,আমি ব্যাস্ত আসি🙆🏻‍♀️",
        "𝗕𝗯𝘆 বললে চাকরি থাকবে না",
        "𝗕𝗯𝘆 𝗕𝗯𝘆 না করে আমার বস মানে, MahMUD ,MahMUD ও তো করতে পারো😑?",
        "আমার সোনার বাংলা, তারপরে লাইন কি? 🙈",
        "🍺 এই নাও জুস খাও..!𝗕𝗯𝘆 বলতে বলতে হাপায় গেছো না 🥲",
        "হটাৎ আমাকে মনে পড়লো 🙄",
        "𝗕𝗯𝘆 বলে অসম্মান করচ্ছিছ,😰😿",
        "𝗔𝘀𝘀𝗮𝗹𝗮𝗺𝘂𝗹𝗮𝗶𝗸𝘂𝗺 🐤🐤",
"আমি তোমার সিনিয়র আপু ওকে 😼সম্মান দেও🙁",
        "খাওয়া দাওয়া করসো 🙄",
        "এত কাছেও এসো না,প্রেম এ পরে যাবো তো 🙈",
        "আরে আমি মজা করার mood এ নাই😒",
        "𝗛𝗲𝘆 𝗛𝗮𝗻𝗱𝘀𝗼𝗺𝗲 বলো 😁😁",
        "আরে Bolo আমার জান, কেমন আসো? 😚",
        "একটা BF খুঁজে দাও 😿",
        "ফ্রেন্ড রিকোয়েস্ট দিলে ৫ টাকা দিবো 😗",
        "oi mama ar dakis na pilis 😿",
        "🐤🐤",
        "__ভালো হয়ে  যাও 😑😒",
        "এমবি কিনে দাও না_🥺🥺",
        "ওই মামা_আর ডাকিস না প্লিজ",
        "৩২ তারিখ আমার বিয়ে 🐤",
        "হা বলো😒,কি করতে পারি😐😑?",
        "বলো ফুলটুশি_😘",
        "amr JaNu lagbe,Tumi ki single aso?",
        "আমাকে না দেকে একটু পড়তেও বসতে তো পারো 🥺🥺",
        "তোর বিয়ে হয় নি 𝗕𝗯𝘆 হইলো কিভাবে,,🙄",
        "আজ একটা ফোন নাই বলে রিপ্লাই দিতে পারলাম না_🙄",
        "চৌধুরী সাহেব আমি গরিব হতে পারি😾🤭 -কিন্তু বড়লোক না🥹 😫",
        "আমি অন্যের জিনিসের সাথে কথা বলি না__😏ওকে",
        "বলো কি বলবা, সবার সামনে বলবা নাকি?🤭🤏",
        "ভুলে জাও আমাকে 😞😞",
        "দেখা হলে কাঠগোলাপ দিও..🤗",
        "শুনবো না😼 তুমি আমাকে প্রেম করাই দাও নি🥺 পচা তুমি🥺",
        "আগে একটা গান বলো, ☹ নাহলে কথা বলবো না 🥺",
        "বলো কি করতে পারি তোমার জন্য 😚",
        "কথা দেও আমাকে পটাবা...!! 😌",
        "বার বার Disturb করেছিস কোনো 😾, আমার জানু এর সাথে ব্যাস্ত আসি 😋",
        "আমাকে না দেকে একটু পড়তে বসতেও তো পারো 🥺🥺",
        "বার বার ডাকলে মাথা গরম হয় কিন্তু 😑😒",
        "ওই তুমি single না?🫵🤨 😑😒",
        "বলো জানু 😒",
        "Meow🐤",     
        "আর কত বার ডাকবা ,শুনছি তো 🤷🏻‍♀️",
        "কি হলো, মিস টিস করচ্ছো নাকি 🤣",
        "Bolo Babu, তুমি কি আমাকে ভালোবাসো? 🙈",
        "আজকে আমার mন ভালো নেই 🙉",
"আমি হাজারো মশার Crush😓",
  "প্রেম করার বয়সে লেখাপড়া করতেছি, রেজাল্ট তো খারা'প হবেই.!🙂",
  "আমার ইয়ারফোন চু'রি হয়ে গিয়েছে!! কিন্তু চোর'কে গা-লি দিলে আমার বন্ধু রেগে যায়!'🙂",
  "ছেলেদের প্রতি আমার এক আকাশ পরিমান শরম🥹🫣",
  "__ফ্রী Whatsapp চালাই কারন ছেলেদের মুখ দেখা হারাম 😌",
  "মন সুন্দর বানাও মুখের জন্য তো Snapchat আছেই! 🌚"
          ];
          const random = replies[Math.floor(Math.random() * replies.length)];
          return await message.reply(random);
        } else {
          words.shift(); // remove "jan"
          const query = words.join(" ");
          const replyText = await getBotResponse(query);
          return await message.reply(replyText);
        }

  }
    } catch (e) {
      console.error("Bot Chat Error:", e);
      await message.reply("❌ Something went wrong.");

  }
  }
};
