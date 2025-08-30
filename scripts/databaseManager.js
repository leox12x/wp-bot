const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Database = require('better-sqlite3');
const chalk = require('chalk');
const moment = require('moment');

class DatabaseManager {
    constructor(config) {
        this.config = config;
        this.type = config.database.type;
        this.db = null;
        this.isConnected = false;
        this.jsonData = {};
    }

    async init() {
        try {
            switch (this.type) {
                case 'mongodb':
                    await this.initMongoDB();
                    break;
                case 'sqlite':
                    await this.initSQLite();
                    break;
                case 'json':
                default:
                    await this.initJSON();
                    break;
            }
            this.log(`✅ Database (${this.type}) initialized successfully`, 'success');
        } catch (error) {
            this.log(`❌ Database initialization failed: ${error.message}`, 'error');
            throw error;
        }
    }

    async initMongoDB() {
        if (!this.config.database.uri) {
            throw new Error('MongoDB URI not provided in configuration');
        }

        if (!mongoose.connection.readyState) {
            await mongoose.connect(this.config.database.uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        }
        this.isConnected = true;
    }

    async initSQLite() {
        const dbPath = this.config.database.path || './data/database.sqlite';
        const dbDir = path.dirname(dbPath);
        
        // Ensure directory exists
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        this.db = new Database(dbPath);
        
        // Create tables if they don't exist
        this.createSQLiteTables();
        this.isConnected = true;
    }

    async initJSON() {
        const jsonPath = this.config.database.path || './data/database.json';
        const jsonDir = path.dirname(jsonPath);
        
        // Ensure directory exists
        if (!fs.existsSync(jsonDir)) {
            fs.mkdirSync(jsonDir, { recursive: true });
        }

        // Load existing data or create new
        if (fs.existsSync(jsonPath)) {
            try {
                const data = fs.readFileSync(jsonPath, 'utf8');
                this.jsonData = JSON.parse(data);
            } catch (error) {
                this.log(`⚠️ Error reading JSON database, creating new: ${error.message}`, 'warning');
                this.jsonData = { users: {}, groups: {} };
            }
        } else {
            this.jsonData = { users: {}, groups: {} };
        }
        
        this.isConnected = true;
        this.saveJSON(); // Save initial structure
    }

    createSQLiteTables() {
        // Users table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT DEFAULT '',
                coins INTEGER DEFAULT 0,
                exp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 1,
                lastActive INTEGER DEFAULT 0,
                commandCount INTEGER DEFAULT 0,
                lastDailyReward TEXT DEFAULT NULL,
                joinDate INTEGER DEFAULT 0
            )
        `);

        // Groups table
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS groups (
                id TEXT PRIMARY KEY,
                settings TEXT DEFAULT '{}',
                commandCount INTEGER DEFAULT 0,
                members TEXT DEFAULT '[]'
            )
        `);
    }

    saveJSON() {
        if (this.type === 'json' && this.config.database.autoSync !== false) {
            const jsonPath = this.config.database.path || './data/database.json';
            try {
                fs.writeFileSync(jsonPath, JSON.stringify(this.jsonData, null, 2));
            } catch (error) {
                this.log(`❌ Error saving JSON database: ${error.message}`, 'error');
            }
        }
    }

    // User operations
    async getUserData(userId, name = null) {
        switch (this.type) {
            case 'mongodb':
                return await this.getMongoUser(userId, name);
            case 'sqlite':
                return await this.getSQLiteUser(userId, name);
            case 'json':
            default:
                return await this.getJSONUser(userId, name);
        }
    }

    async updateUserData(userId, updates) {
        switch (this.type) {
            case 'mongodb':
                return await this.updateMongoUser(userId, updates);
            case 'sqlite':
                return await this.updateSQLiteUser(userId, updates);
            case 'json':
            default:
                return await this.updateJSONUser(userId, updates);
        }
    }

    // Group operations
    async getGroupData(groupId) {
        switch (this.type) {
            case 'mongodb':
                return await this.getMongoGroup(groupId);
            case 'sqlite':
                return await this.getSQLiteGroup(groupId);
            case 'json':
            default:
                return await this.getJSONGroup(groupId);
        }
    }

    async updateGroupData(groupId, updates) {
        switch (this.type) {
            case 'mongodb':
                return await this.updateMongoGroup(groupId, updates);
            case 'sqlite':
                return await this.updateSQLiteGroup(groupId, updates);
            case 'json':
            default:
                return await this.updateJSONGroup(groupId, updates);
        }
    }

    // MongoDB implementations
    async getMongoUser(userId, name = null) {
        const User = require('../models/User');
        let user = await User.findOne({ id: userId });
        if (!user) {
            user = new User({
                id: userId,
                name: name || "",
                coins: 0,
                exp: 0,
                level: 1,
                lastActive: Date.now(),
                commandCount: 0,
                lastDailyReward: null,
                joinDate: Date.now()
            });
            await user.save();
        } else if (name && name !== user.name) {
            user.name = name;
            await user.save();
        }
        return user;
    }

    async updateMongoUser(userId, updates) {
        const User = require('../models/User');
        return await User.findOneAndUpdate(
            { id: userId },
            { $set: updates },
            { new: true, upsert: true }
        );
    }

    async getMongoGroup(groupId) {
        const Group = require('../models/Group');
        let group = await Group.findOne({ id: groupId });
        if (!group) {
            group = new Group({
                id: groupId,
                settings: {
                    welcomeDisabled: false,
                    welcomeMessage: null,
                    goodbyeDisabled: false
                },
                commandCount: 0,
                members: []
            });
            await group.save();
        }
        return group;
    }

    async updateMongoGroup(groupId, updates) {
        const Group = require('../models/Group');
        return await Group.findOneAndUpdate(
            { id: groupId },
            { $set: updates },
            { new: true, upsert: true }
        );
    }

    // SQLite implementations
    async getSQLiteUser(userId, name = null) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        let user = stmt.get(userId);
        
        if (!user) {
            const insertStmt = this.db.prepare(`
                INSERT INTO users (id, name, coins, exp, level, lastActive, commandCount, lastDailyReward, joinDate)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            const now = Date.now();
            insertStmt.run(userId, name || '', 0, 0, 1, now, 0, null, now);
            user = stmt.get(userId);
        } else if (name && name !== user.name) {
            const updateStmt = this.db.prepare('UPDATE users SET name = ? WHERE id = ?');
            updateStmt.run(name, userId);
            user.name = name;
        }
        
        return user;
    }

    async updateSQLiteUser(userId, updates) {
        const fields = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const stmt = this.db.prepare(`UPDATE users SET ${setClause} WHERE id = ?`);
        stmt.run(...values, userId);
        
        const selectStmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
        return selectStmt.get(userId);
    }

    async getSQLiteGroup(groupId) {
        const stmt = this.db.prepare('SELECT * FROM groups WHERE id = ?');
        let group = stmt.get(groupId);
        
        if (!group) {
            const insertStmt = this.db.prepare(`
                INSERT INTO groups (id, settings, commandCount, members)
                VALUES (?, ?, ?, ?)
            `);
            const defaultSettings = JSON.stringify({
                welcomeDisabled: false,
                welcomeMessage: null,
                goodbyeDisabled: false
            });
            insertStmt.run(groupId, defaultSettings, 0, '[]');
            group = stmt.get(groupId);
        }
        
        // Parse JSON fields
        if (group) {
            group.settings = JSON.parse(group.settings || '{}');
            group.members = JSON.parse(group.members || '[]');
        }
        
        return group;
    }

    async updateSQLiteGroup(groupId, updates) {
        // Handle JSON fields
        const processedUpdates = { ...updates };
        if (processedUpdates.settings) {
            processedUpdates.settings = JSON.stringify(processedUpdates.settings);
        }
        if (processedUpdates.members) {
            processedUpdates.members = JSON.stringify(processedUpdates.members);
        }
        
        const fields = Object.keys(processedUpdates);
        const values = Object.values(processedUpdates);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        const stmt = this.db.prepare(`UPDATE groups SET ${setClause} WHERE id = ?`);
        stmt.run(...values, groupId);
        
        return await this.getSQLiteGroup(groupId);
    }

    // JSON implementations
    async getJSONUser(userId, name = null) {
        if (!this.jsonData.users[userId]) {
            this.jsonData.users[userId] = {
                id: userId,
                name: name || '',
                coins: 0,
                exp: 0,
                level: 1,
                lastActive: Date.now(),
                commandCount: 0,
                lastDailyReward: null,
                joinDate: Date.now()
            };
            this.saveJSON();
        } else if (name && name !== this.jsonData.users[userId].name) {
            this.jsonData.users[userId].name = name;
            this.saveJSON();
        }
        
        return this.jsonData.users[userId];
    }

    async updateJSONUser(userId, updates) {
        if (!this.jsonData.users[userId]) {
            await this.getJSONUser(userId);
        }
        
        Object.assign(this.jsonData.users[userId], updates);
        this.saveJSON();
        return this.jsonData.users[userId];
    }

    async getJSONGroup(groupId) {
        if (!this.jsonData.groups[groupId]) {
            this.jsonData.groups[groupId] = {
                id: groupId,
                settings: {
                    welcomeDisabled: false,
                    welcomeMessage: null,
                    goodbyeDisabled: false
                },
                commandCount: 0,
                members: []
            };
            this.saveJSON();
        }
        
        return this.jsonData.groups[groupId];
    }

    async updateJSONGroup(groupId, updates) {
        if (!this.jsonData.groups[groupId]) {
            await this.getJSONGroup(groupId);
        }
        
        Object.assign(this.jsonData.groups[groupId], updates);
        this.saveJSON();
        return this.jsonData.groups[groupId];
    }

    // Utility methods
    log(message, type = 'info') {
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

    async close() {
        if (this.type === 'mongodb' && mongoose.connection.readyState) {
            await mongoose.connection.close();
        } else if (this.type === 'sqlite' && this.db) {
            this.db.close();
        } else if (this.type === 'json') {
            this.saveJSON();
        }
        this.isConnected = false;
    }

    // Get database statistics
    async getStats() {
        const stats = {
            type: this.type,
            connected: this.isConnected,
            userCount: 0,
            groupCount: 0
        };

        try {
            switch (this.type) {
                case 'mongodb':
                    const User = require('../models/User');
                    const Group = require('../models/Group');
                    stats.userCount = await User.countDocuments();
                    stats.groupCount = await Group.countDocuments();
                    break;
                case 'sqlite':
                    const userCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM users');
                    const groupCountStmt = this.db.prepare('SELECT COUNT(*) as count FROM groups');
                    stats.userCount = userCountStmt.get().count;
                    stats.groupCount = groupCountStmt.get().count;
                    break;
                case 'json':
                    stats.userCount = Object.keys(this.jsonData.users || {}).length;
                    stats.groupCount = Object.keys(this.jsonData.groups || {}).length;
                    break;
            }
        } catch (error) {
            this.log(`Error getting database stats: ${error.message}`, 'error');
        }

        return stats;
    }
}

module.exports = DatabaseManager;