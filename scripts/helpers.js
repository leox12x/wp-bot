const chalk = require('chalk');
const moment = require('moment');
const axios = require('axios');
const config = require('../config.json');
const DatabaseManager = require('./databaseManager');

// Initialize database manager
let dbManager = null;

// Logging function
function log(message, type = 'info') {
  const timestamp = moment().format('YYYY-MM-DD HH:mm:ss');
  const colors = {
    info: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red
  };
  const coloredMessage = colors[type] ? colors[type](message) : message;
  console.log(`[${timestamp}] ${coloredMessage}`);
}

// Format uptime
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Initialize database
async function initDatabase() {
  try {
    dbManager = new DatabaseManager(config);
    await dbManager.init();
    log(`✅ Database (${config.database.type}) initialized successfully`, 'success');
  } catch (error) {
    log(`❌ Database initialization failed: ${error.message}`, 'error');
    throw error;
  }
}

// Get user data with proper name handling
async function getUserData(userId, name = null) {
  if (!dbManager) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return await dbManager.getUserData(userId, name);
}

// Update user data
async function updateUserData(userId, updates) {
  if (!dbManager) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return await dbManager.updateUserData(userId, updates);
}

// Get group data
async function getGroupData(groupId) {
  if (!dbManager) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return await dbManager.getGroupData(groupId);
}

// Update group data
async function updateGroupData(groupId, updates) {
  if (!dbManager) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return await dbManager.updateGroupData(groupId, updates);
}

// OpenAI integration
async function callOpenAI(prompt, userId = null) {
  if (!config.ai.openai.apiKey) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.ai.openai.model || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant in a WhatsApp bot.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${config.ai.openai.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    log(`OpenAI API error: ${error.message}`, 'error');
    throw new Error('Failed to get AI response');
  }
}

// Media downloader
async function downloadMedia(message) {
  try {
    if (message.hasMedia) {
      const media = await message.downloadMedia();
      return media;
    }
    return null;
  } catch (error) {
    log(`Media download error: ${error.message}`, 'error');
    return null;
  }
}

// Track user command usage
async function trackUserCommand(userId, commandName) {
  try {
    if (!dbManager) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    const userData = await getUserData(userId);
    await updateUserData(userId, {
      commandCount: (userData.commandCount || 0) + 1,
      lastActive: Date.now()
    });
  } catch (error) {
    log(`Error tracking command for user ${userId}: ${error.message}`, 'error');
  }
}

// Track command and update name if needed
async function trackCommand(userId, name = null) {
  try {
    if (!dbManager) {
      throw new Error('Database not initialized. Call initDatabase() first.');
    }
    const userData = await getUserData(userId, name);
    await updateUserData(userId, {
      commandCount: (userData.commandCount || 0) + 1,
      lastActive: Date.now()
    });
  } catch (error) {
    log(`Error tracking command for user ${userId}: ${error.message}`, 'error');
  }
}

module.exports = {
  log,
  formatUptime,
  initDatabase,
  getUserData,
  updateUserData,
  getGroupData,
  updateGroupData,
  callOpenAI,
  downloadMedia,
  trackUserCommand,
  trackCommand
};
