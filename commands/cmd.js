// cmd.js - WhatsApp Bot Command Loader
// Author: NTKhang | Cleaned and adapted by Rahaman Leon
// Fixed version to resolve loading issues

const axios = require("axios");
const { execSync } = require("child_process");
const fs = require("fs-extra");
const path = require("path");
const cheerio = require("cheerio");
const { configCommands } = global.GoatBot;
const { log, loading, removeHomeDir } = global.utils;

// Local project path constants
const COMMANDS_DIR = path.resolve(__dirname); // C:\Users\leox\Desktop\whatspp-bot\commands\
const SCRIPTS_DIR = path.resolve(__dirname, "..", "scripts", "cmds"); // Fallback scripts directory

function getDomain(url) {
  const match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:/\n]+)/im);
  return match ? match[1] : null;
}

function isURL(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// Enhanced loadScripts function
function loadScripts(folder, fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode) {
  const storageCommandFilesPath = global.GoatBot[folder === "cmds" ? "commandFilesPath" : "eventCommandsFilesPath"];

  try {
    let pathCommand;
    
    if (rawCode) {
      fileName = fileName.endsWith('.js') ? fileName.slice(0, -3) : fileName;
      pathCommand = path.join(COMMANDS_DIR, `${fileName}.js`);
      fs.writeFileSync(pathCommand, rawCode);
    } else {
      // Check in commands directory first
      const commandsPath = path.join(COMMANDS_DIR, `${fileName}.js`);
      const scriptsPath = fs.existsSync(SCRIPTS_DIR) ? path.join(SCRIPTS_DIR, `${fileName}.js`) : null;
      
      if (fs.existsSync(commandsPath)) {
        pathCommand = commandsPath;
      } else if (scriptsPath && fs.existsSync(scriptsPath)) {
        pathCommand = scriptsPath;
      } else {
        throw new Error(`Command file "${fileName}.js" not found in ${COMMANDS_DIR}${scriptsPath ? ` or ${SCRIPTS_DIR}` : ''}`);
      }
    }

    // Package checking and installation
    const regExpCheckPackage = /require(\s+|)\((\s+|)[`'"]([^`'"]+)[`'"](\s+|)\)/g;
    const contentFile = fs.readFileSync(pathCommand, "utf8");
    let allPackage = contentFile.match(regExpCheckPackage);
    
    if (allPackage) {
      allPackage = allPackage
        .map(p => p.match(/[`'"]([^`'"]+)[`'"]/)[1])
        .filter(p => p.indexOf("/") !== 0 && p.indexOf("./") !== 0 && p.indexOf("../") !== 0);
      
      for (let packageName of allPackage) {
        if (packageName.startsWith('@'))
          packageName = packageName.split('/').slice(0, 2).join('/');
        else
          packageName = packageName.split('/')[0];

        if (!fs.existsSync(`${process.cwd()}/node_modules/${packageName}`)) {
          try {
            execSync(`npm install ${packageName} --save`, { stdio: "pipe" });
            log.info("PACKAGE", `Installed ${packageName}`);
          } catch (error) {
            log.warn("PACKAGE", `Failed to install ${packageName}`);
          }
        }
      }
    }

    // Clear old command from cache
    if (require.cache[require.resolve(pathCommand)]) {
      delete require.cache[require.resolve(pathCommand)];
    }

    // Load new command
    const command = require(pathCommand);
    command.location = pathCommand;
    const configCommand = command.config;
    
    if (!configCommand || typeof configCommand !== "object") {
      throw new Error("config of command must be an object");
    }

    const scriptName = configCommand.name;
    if (!scriptName) {
      throw new Error("Name of command is missing!");
    }

    if (!command.onStart || typeof command.onStart !== "function") {
      throw new Error("Function onStart is missing or not a function!");
    }

    // Handle aliases
    if (configCommand.aliases) {
      let { aliases } = configCommand;
      if (typeof aliases === "string") aliases = [aliases];
      
      for (const alias of aliases) {
        if (global.GoatBot.aliases.has(alias)) {
          // Remove old alias first
          global.GoatBot.aliases.delete(alias);
        }
        global.GoatBot.aliases.set(alias, scriptName);
      }
    }

    // Set command in GoatBot
    const setMap = folder === "cmds" ? "commands" : "eventCommands";
    global.GoatBot[setMap].set(scriptName, command);

    // Also update the main bot instance if available
    if (global.client && global.client.commands) {
      global.client.commands.set(scriptName.toLowerCase(), command);
      
      // Add aliases to main bot
      if (configCommand.aliases) {
        let { aliases } = configCommand;
        if (typeof aliases === "string") aliases = [aliases];
        
        for (const alias of aliases) {
          global.client.commands.set(alias.toLowerCase(), command);
        }
      }
    }

    // Handle onLoad function
    if (command.onLoad && typeof command.onLoad === "function") {
      try {
        command.onLoad({ api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData });
      } catch (loadError) {
        console.warn(`Warning: onLoad function failed for ${scriptName}:`, loadError.message);
      }
    }

    // Update storage
    const indexStorageCommandFilesPath = storageCommandFilesPath.findIndex(item => item.filePath === pathCommand);
    if (indexStorageCommandFilesPath !== -1) {
      storageCommandFilesPath.splice(indexStorageCommandFilesPath, 1);
    }
    
    storageCommandFilesPath.push({
      filePath: pathCommand,
      commandName: [scriptName, ...(configCommand.aliases || [])]
    });

    // Save config
    if (global.client?.dirConfigCommands) {
      fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
    }

    return {
      status: "success",
      name: fileName,
      command
    };

  } catch (err) {
    return {
      status: "failed",
      name: fileName,
      error: err
    };
  }
}

function unloadScripts(folder, fileName, configCommands, getLang) {
  try {
    const commandsPath = path.join(COMMANDS_DIR, `${fileName}.js`);
    const scriptsPath = fs.existsSync(SCRIPTS_DIR) ? path.join(SCRIPTS_DIR, `${fileName}.js`) : null;
    
    let pathCommand;
    if (fs.existsSync(commandsPath)) {
      pathCommand = commandsPath;
    } else if (scriptsPath && fs.existsSync(scriptsPath)) {
      pathCommand = scriptsPath;
    } else {
      throw new Error(getLang ? getLang("missingFile", `${fileName}.js`) : `Command "${fileName}.js" not found`);
    }

    const command = require(pathCommand);
    const commandName = command.config?.name;
    
    if (!commandName) {
      throw new Error(getLang ? getLang("invalidFileName", `${fileName}.js`) : `Invalid command filename: ${fileName}.js`);
    }

    // Handle aliases
    if (command.config.aliases) {
      let aliases = command.config.aliases;
      if (typeof aliases === "string") aliases = [aliases];
      
      for (const alias of aliases) {
        global.GoatBot.aliases.delete(alias);
        
        // Also remove from main bot
        if (global.client && global.client.commands) {
          global.client.commands.delete(alias.toLowerCase());
        }
      }
    }

    // Remove from cache and GoatBot
    delete require.cache[require.resolve(pathCommand)];
    const setMap = folder === "cmds" ? "commands" : "eventCommands";
    global.GoatBot[setMap].delete(commandName);

    // Also remove from main bot
    if (global.client && global.client.commands) {
      global.client.commands.delete(commandName.toLowerCase());
    }

    // Update unload list
    const commandUnload = configCommands[folder === "cmds" ? "commandUnload" : "commandEventUnload"] || [];
    if (!commandUnload.includes(`${fileName}.js`)) {
      commandUnload.push(`${fileName}.js`);
    }
    configCommands[folder === "cmds" ? "commandUnload" : "commandEventUnload"] = commandUnload;

    // Save config
    if (global.client?.dirConfigCommands) {
      fs.writeFileSync(global.client.dirConfigCommands, JSON.stringify(configCommands, null, 2));
    }

    return {
      status: "success",
      name: fileName
    };

  } catch (err) {
    return {
      status: "failed",
      name: fileName,
      error: err
    };
  }
}

// Export utility functions to global
global.utils.loadScripts = loadScripts;
global.utils.unloadScripts = unloadScripts;

module.exports = {
  config: {
    name: "cmd",
    version: "1.18",
    author: "NTKhang | Fixed by Rahaman Leon",
    countDown: 5,
    role: 2,
    description: "Manage your command files",
    category: "owner",
    guide:
      "{pn} load <command>\n" +
      "{pn} loadAll\n" +
      "{pn} unload <command>\n" +
      "{pn} install <url> <filename.js>\n" +
      "{pn} install <filename.js> <code>",
  },

  langs: {
    en: {
      missingFileName: "⚠️ | Enter the command name you want to reload.",
      loaded: "✅ | Loaded command \"%1\" successfully.",
      loadedError: "❌ | Failed to load \"%1\"\n%2: %3",
      loadedSuccess: "✅ | Loaded %1 command(s) successfully.",
      loadedFail: "❌ | Failed to load %1 command(s):\n%2",
      openConsoleToSeeError: "👀 | See console for error details.",
      missingCommandNameUnload: "⚠️ | Enter the command name you want to unload.",
      unloaded: "✅ | Unloaded command \"%1\" successfully.",
      unloadedError: "❌ | Failed to unload \"%1\"\n%2: %3",
      missingUrlCodeOrFileName: "⚠️ | Provide url/code and filename to install.",
      missingUrlOrCode: "⚠️ | Provide a valid url or code.",
      missingFileNameInstall: "⚠️ | Provide a filename ending in .js.",
      invalidUrl: "⚠️ | Invalid URL.",
      invalidUrlOrCode: "⚠️ | Unable to retrieve command code.",
      alreadExist: "⚠️ | File exists. React to this to overwrite.",
      installed: "✅ | Installed \"%1\" successfully at %2",
      installedError: "❌ | Install failed for \"%1\"\n%2: %3",
      missingFile: "⚠️ | Command \"%1\" not found.",
      invalidFileName: "⚠️ | Invalid command filename.",
      unloadedFile: "✅ | Unloaded \"%1\"",
    },
  },

  onStart: async function ({
    args, message, event, getLang,
    api, threadModel, userModel, dashBoardModel, globalModel,
    threadsData, usersData, dashBoardData, globalData, commandName,
    client, config
  }) {
    // Provide default getLang if not available
    if (!getLang) {
      getLang = (key, ...args) => {
        if (this.langs && this.langs.en && this.langs.en[key]) {
          let text = this.langs.en[key];
          args.forEach((arg, index) => {
            text = text.replace(`%${index + 1}`, arg);
          });
          return text;
        }
        return key;
      };
    }

    // Load single command
    if (args[0] === "load" && args[1]) {
      const info = loadScripts("cmds", args[1], log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
      return message.reply(info.status === "success"
        ? getLang("loaded", info.name)
        : getLang("loadedError", info.name, info.error.name, info.error.message) + "\n" + info.error.stack);
    }

    // Load all or multiple
    if (args[0]?.toLowerCase() === "loadall" || (args[0] === "load" && args.length > 2)) {
      const files = args[0].toLowerCase() === "loadall"
        ? fs.readdirSync(COMMANDS_DIR).filter(f => 
            f.endsWith(".js") && 
            !f.includes("dev") && 
            !configCommands.commandUnload?.includes(f)
          ).map(f => f.split(".")[0])
        : args.slice(1);

      const ok = [], fail = [];
      for (const name of files) {
        const info = loadScripts("cmds", name, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang);
        info.status === "success" ? ok.push(name) : fail.push(`❗ ${name} => ${info.error.name}: ${info.error.message}`);
      }

      let msg = "";
      if (ok.length) msg += getLang("loadedSuccess", ok.length);
      if (fail.length) msg += (msg ? "\n" : "") + getLang("loadedFail", fail.length, fail.join("\n")) + "\n" + getLang("openConsoleToSeeError");
      return message.reply(msg);
    }

    // Unload
    if (args[0] === "unload" && args[1]) {
      const info = unloadScripts("cmds", args[1], configCommands, getLang);
      return message.reply(info.status === "success"
        ? getLang("unloaded", info.name)
        : getLang("unloadedError", info.name, info.error.name, info.error.message));
    }

    // Install from URL or code
    if (args[0] === "install") {
      let url = args[1], fileName = args[2], rawCode;

      if (!url || !fileName) return message.reply(getLang("missingUrlCodeOrFileName"));

      if (url.endsWith(".js") && !isURL(url)) {
        [fileName, url] = [url, fileName];
      }

      if (isURL(url)) {
        if (!fileName.endsWith(".js")) return message.reply(getLang("missingFileNameInstall"));
        let domain = getDomain(url);
        if (!domain) return message.reply(getLang("invalidUrl"));

        if (domain === "pastebin.com") url = url.replace(/\/(?!raw\/)(.*)/, "/raw/$1");
        if (domain === "github.com") url = url.replace("github.com", "raw.githubusercontent.com").replace("/blob/", "/");

        try {
          const res = await axios.get(url);
          rawCode = domain === "savetext.net" ? cheerio.load(res.data)("#content").text() : res.data;
        } catch (error) {
          return message.reply(getLang("invalidUrlOrCode"));
        }
      } else {
        rawCode = event.body.slice(event.body.indexOf("install") + 7).replace(fileName, "").trim();
      }

      if (!rawCode) return message.reply(getLang("invalidUrlOrCode"));

      const targetPath = path.join(COMMANDS_DIR, fileName);
      if (fs.existsSync(targetPath)) {
        return message.reply(getLang("alreadExist"), (_, info) => {
          global.GoatBot.onReaction.set(info.messageID, {
            commandName,
            messageID: info.messageID,
            type: "install",
            author: event.senderID,
            data: { fileName, rawCode }
          });
        });
      }

      const info = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
      return message.reply(info.status === "success"
        ? getLang("installed", info.name, targetPath.replace(process.cwd(), ""))
        : getLang("installedError", info.name, info.error.name, info.error.message));
    }

    return message.reply("⚠️ | Invalid subcommand. Try: load, loadall, unload, install");
  },

  onReaction: async function ({
    Reaction, message, event, api, threadModel, userModel, dashBoardModel,
    globalModel, threadsData, usersData, dashBoardData, globalData, getLang
  }) {
    const { author, data: { fileName, rawCode } } = Reaction;
    if (event.userID !== author) return;

    const info = loadScripts("cmds", fileName, log, configCommands, api, threadModel, userModel, dashBoardModel, globalModel, threadsData, usersData, dashBoardData, globalData, getLang, rawCode);
    return message.reply(info.status === "success"
      ? getLang("installed", info.name, path.join(COMMANDS_DIR, fileName).replace(process.cwd(), ""))
      : getLang("installedError", info.name, info.error.name, info.error.message));
  }
};
