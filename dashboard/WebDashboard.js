const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

class WebDashboard {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server);
        this.dataCallback = null;
    }

    initialize(dataCallback) {
        this.dataCallback = dataCallback;
        this.setupExpress();
        this.setupSocketIO();
        this.startServer();
    }

    setupExpress() {
        // Serve static files from public directory if it exists
        const publicDir = path.join(process.cwd(), 'public');
        this.app.use(express.static(publicDir));
        this.app.use(express.json());

        // Main dashboard route
        this.app.get('/', (req, res) => {
            res.send(this.getDashboardHTML());
        });

        // API route for dashboard data
        this.app.get('/api/status', (req, res) => {
            if (this.dataCallback) {
                res.json(this.dataCallback());
            } else {
                res.json({ error: 'No data available' });
            }
        });
    }

    setupSocketIO() {
        this.io.on('connection', (socket) => {
            console.log('Dashboard client connected');

            // Send initial status
            this.sendStatus(socket);

            // Send updates every 5 seconds
            const interval = setInterval(() => {
                this.sendStatus(socket);
            }, 5000);

            socket.on('disconnect', () => {
                console.log('Dashboard client disconnected');
                clearInterval(interval);
            });
        });
    }

    sendStatus(socket = null) {
        if (!this.dataCallback) return;

        const data = this.dataCallback();
        const target = socket || this.io;
        target.emit('status', data);
    }

    startServer() {
        this.server.listen(this.port, () => {
            console.log(`📊 Web Dashboard running on http://localhost:${this.port}`);
        });
    }

    // Methods to emit specific events from the bot
    emitQR(qrCodeDataURL) {
        this.io.emit('qr', {
            qrCode: qrCodeDataURL,
            message: 'Scan this QR code with WhatsApp to authenticate'
        });
    }

    emitAuthenticated(data) {
        this.io.emit('authenticated', {
            status: 'connected',
            user: data.user,
            message: data.message
        });
    }

    emitAuthStatus(data) {
        this.io.emit('auth_status', data);
    }

    getDashboardHTML() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WhatsApp Bot Dashboard</title>
    <script src="/socket.io/socket.io.js"></script>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🤖</text></svg>">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            margin-bottom: 40px;
        }

        .header h1 {
            font-size: 3em;
            margin-bottom: 10px;
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
            animation: fadeInDown 1s ease-out;
        }

        .header p {
            font-size: 1.2em;
            opacity: 0.9;
            animation: fadeInUp 1s ease-out 0.2s both;
        }

        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
            margin-bottom: 30px;
        }

        .card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 20px;
            padding: 25px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            animation: fadeInUp 1s ease-out;
        }

        .card:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
        }

        .card h3 {
            font-size: 1.5em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .card-content {
            font-size: 1.1em;
            line-height: 1.6;
        }

        .qr-section {
            grid-column: 1 / -1;
            text-align: center;
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 40px;
            border-radius: 25px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            animation: fadeInScale 1s ease-out;
        }

        .qr-section.hidden {
            display: none;
        }

        .qr-section h2 {
            font-size: 2em;
            margin-bottom: 20px;
            color: #2c3e50;
        }

        .qr-code {
            max-width: 280px;
            border-radius: 15px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            margin: 20px 0;
            transition: transform 0.3s ease;
        }

        .qr-code:hover {
            transform: scale(1.05);
        }

        .qr-instructions {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 15px;
            margin-top: 20px;
            color: #6c757d;
            font-size: 0.95em;
        }

        .auth-section {
            grid-column: 1 / -1;
            text-align: center;
            padding: 30px;
            border-radius: 20px;
            animation: fadeInScale 1s ease-out;
        }

        .auth-section.hidden {
            display: none;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 10px;
            animation: pulse 2s infinite;
        }

        .status-connected { background-color: #4CAF50; }
        .status-disconnected { background-color: #f44336; }
        .status-authenticating { background-color: #ff9800; }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }

        .stat-item {
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 12px;
            text-align: center;
        }

        .stat-value {
            display: block;
            font-size: 1.8em;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s linear infinite;
        }

        .success-message {
            background: rgba(76, 175, 80, 0.2);
            border: 1px solid rgba(76, 175, 80, 0.5);
            color: #4CAF50;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            font-size: 1.2em;
        }

        .error-message {
            background: rgba(244, 67, 54, 0.2);
            border: 1px solid rgba(244, 67, 54, 0.5);
            color: #f44336;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            font-size: 1.2em;
        }

        .warning-message {
            background: rgba(255, 152, 0, 0.2);
            border: 1px solid rgba(255, 152, 0, 0.5);
            color: #ff9800;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
            font-size: 1.2em;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            opacity: 0.7;
            font-size: 0.9em;
        }

        /* Animations */
        @keyframes fadeInDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes fadeInScale {
            from {
                opacity: 0;
                transform: scale(0.9);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }
            100% {
                transform: rotate(360deg);
            }
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .container {
                padding: 15px;
            }
            
            .header h1 {
                font-size: 2.2em;
            }
            
            .dashboard-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            
            .card {
                padding: 20px;
            }
            
            .qr-section {
                padding: 25px;
            }
            
            .qr-code {
                max-width: 240px;
            }
            
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 480px) {
            .header h1 {
                font-size: 1.8em;
            }
            
            .header p {
                font-size: 1em;
            }
            
            .qr-section {
                padding: 20px;
            }
            
            .qr-code {
                max-width: 200px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 WhatsApp Bot Dashboard</h1>
            <p>Real-time monitoring and management interface</p>
        </div>

        <!-- QR Code Section -->
        <div id="qr-section" class="card qr-section hidden">
            <h2>📱 WhatsApp Authentication Required</h2>
            <p>Please scan the QR code below with your WhatsApp mobile app to authenticate the bot:</p>
            <div id="qr-display">
                <div class="loading"></div>
                <p>Generating QR code...</p>
            </div>
            <div class="qr-instructions">
                <strong>How to scan:</strong><br>
                1. Open WhatsApp on your phone<br>
                2. Go to Settings → Linked Devices<br>
                3. Tap "Link a Device"<br>
                4. Point your camera at the QR code above
            </div>
        </div>

        <!-- Authentication Status Section -->
        <div id="auth-section" class="card auth-section hidden">
            <div id="auth-status"></div>
        </div>

        <!-- Dashboard Cards -->
        <div class="dashboard-grid">
            <!-- Bot Status Card -->
            <div class="card">
                <h3>🤖 Bot Status</h3>
                <div class="card-content">
                    <div id="status">
                        <span class="status-indicator status-disconnected"></span>
                        <span class="loading"></span> Initializing...
                    </div>
                </div>
            </div>

            <!-- Uptime Card -->
            <div class="card">
                <h3>⏰ System Uptime</h3>
                <div class="card-content">
                    <div id="uptime">
                        <span class="loading"></span> Starting...
                    </div>
                </div>
            </div>

            <!-- Commands Card -->
            <div class="card">
                <h3>📋 Available Commands</h3>
                <div class="card-content">
                    <div id="commands">
                        <span class="loading"></span> Loading commands...
                    </div>
                </div>
            </div>

            <!-- Rate Limiter Card -->
            <div class="card">
                <h3>🔄 Rate Limiter Status</h3>
                <div class="card-content">
                    <div id="rateLimiter">
                        <span class="loading"></span> Initializing...
                    </div>
                    <div id="rate-limiter-stats" class="stats-grid" style="display: none;">
                        <div class="stat-item">
                            <span id="queue-count" class="stat-value">0</span>
                            <span class="stat-label">Queued</span>
                        </div>
                        <div class="stat-item">
                            <span id="active-count" class="stat-value">0</span>
                            <span class="stat-label">Active</span>
                        </div>
                        <div class="stat-item">
                            <span id="processing-status" class="stat-value">No</span>
                            <span class="stat-label">Processing</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>WhatsApp Bot Dashboard &copy; <span id="currentYear"></span> | Created by <strong>Rahaman Leon</strong> | Powered by Node.js & Socket.IO</p>
            <p style="font-size: 0.8em; margin-top: 5px; opacity: 0.6;">Licensed under MIT | All rights reserved</p>
        </div>
    </div>

    <script>
        // Initialize Socket.IO connection
        const socket = io();
        
        // Connection status
        socket.on('connect', () => {
            console.log('Connected to dashboard server');
            updateConnectionStatus(true);
            clearConnectionError();
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from dashboard server');
            updateConnectionStatus(false);
        });
        
        // Handle connection errors
        socket.on('connect_error', (error) => {
            console.log('Connection error:', error);
            displayConnectionError(error.message);
            updateConnectionStatus(false);
        });
        
        // Function to update connection status in UI
        function updateConnectionStatus(isConnected) {
            const statusElement = document.getElementById('status');
            if (!statusElement) return;
            
            const indicatorClass = isConnected ? 'status-connected' : 'status-disconnected';
            const statusText = isConnected ? '🟢 Connected' : '🔴 Disconnected';
            
            let statusHTML = '<span class="status-indicator ' + indicatorClass + '"></span>' + statusText;
            
            // Add QR refresh button when disconnected
            if (!isConnected) {
                statusHTML += '<div style="margin-top: 15px;">' +
                    '<button onclick="refreshQRCode()" style="' +
                    'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' +
                    'color: white;' +
                    'border: none;' +
                    'padding: 10px 20px;' +
                    'border-radius: 8px;' +
                    'cursor: pointer;' +
                    'font-size: 0.9em;' +
                    'font-weight: bold;' +
                    'transition: all 0.3s ease;' +
                    'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);' +
                    '" onmouseover="this.style.transform=\"translateY(-2px)\"; this.style.boxShadow=\"0 6px 16px rgba(0, 0, 0, 0.3)\"" onmouseout="this.style.transform=\"translateY(0)\"; this.style.boxShadow=\"0 4px 12px rgba(0, 0, 0, 0.2)\"">' +
                    '🔄 Refresh QR Code' +
                    '</button>' +
                    '</div>';
            }
            
            statusElement.innerHTML = statusHTML;
        }
        
        // Function to display connection errors
        function displayConnectionError(errorMessage) {
            const statusElement = document.getElementById('status');
            if (!statusElement) return;
            
            const errorHTML = '<span class="status-indicator status-disconnected"></span>' +
                '🔴 Disconnected' +
                '<div class="error-message" style="margin-top: 15px; font-size: 0.9em; text-align: left;">' +
                '<strong>Connection Error:</strong><br>' +
                '<code style="background: rgba(0,0,0,0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace; word-break: break-all;">' +
                'net::ERR_CONNECTION_REFUSED http://localhost:3000/socket.io/?EIO=4&transport=polling&t=m5eq1shh' +
                '</code>' +
                '</div>' +
                '<div style="margin-top: 15px;">' +
                '<button onclick="refreshQRCode()" style="' +
                'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);' +
                'color: white;' +
                'border: none;' +
                'padding: 10px 20px;' +
                'border-radius: 8px;' +
                'cursor: pointer;' +
                'font-size: 0.9em;' +
                'font-weight: bold;' +
                'transition: all 0.3s ease;' +
                'box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);' +
                '" onmouseover="this.style.transform=\"translateY(-2px)\"; this.style.boxShadow=\"0 6px 16px rgba(0, 0, 0, 0.3)\"" onmouseout="this.style.transform=\"translateY(0)\"; this.style.boxShadow=\"0 4px 12px rgba(0, 0, 0, 0.2)\"">' +
                '🔄 Refresh QR Code' +
                '</button>' +
                '</div>';
            
            statusElement.innerHTML = errorHTML;
        }
        
        // Function to clear connection errors
        function clearConnectionError() {
            // This will be handled by updateConnectionStatus when connected
        }
        
        // Function to refresh QR code
        function refreshQRCode() {
            const qrSection = document.getElementById('qr-section');
            const qrDisplay = document.getElementById('qr-display');
            const authSection = document.getElementById('auth-section');
            
            // Show QR section and hide auth section
            qrSection.classList.remove('hidden');
            authSection.classList.add('hidden');
            
            // Show loading state
            qrDisplay.innerHTML = '<div class="loading"></div>' +
                '<p style="margin-top: 15px; font-weight: bold; color: #2c3e50;">Generating new QR code...</p>';
            
            // Emit request for new QR code
            socket.emit('request_qr');
            
            // Show feedback
            const statusElement = document.getElementById('status');
            const currentHTML = statusElement.innerHTML;
            statusElement.innerHTML = currentHTML.replace('🔄 Refresh QR Code', '⏳ Refreshing...');
            
            setTimeout(() => {
                if (statusElement.innerHTML.includes('⏳ Refreshing...')) {
                    statusElement.innerHTML = currentHTML;
                }
            }, 3000);
        }

        // Handle QR code display
        socket.on('qr', (data) => {
            console.log('QR code received');
            const qrSection = document.getElementById('qr-section');
            const qrDisplay = document.getElementById('qr-display');
            const authSection = document.getElementById('auth-section');
            
            qrDisplay.innerHTML = '<img src="' + data.qrCode + '" alt="WhatsApp QR Code" class="qr-code">' +
                '<p style="margin-top: 15px; font-weight: bold; color: #2c3e50;">' + data.message + '</p>';
            
            qrSection.classList.remove('hidden');
            authSection.classList.add('hidden');
        });

        // Handle successful authentication
        socket.on('authenticated', (data) => {
            console.log('Bot authenticated successfully');
            const qrSection = document.getElementById('qr-section');
            const authSection = document.getElementById('auth-section');
            const authStatus = document.getElementById('auth-status');
            
            qrSection.classList.add('hidden');
            authSection.classList.remove('hidden');
            
            authStatus.innerHTML = '<div class="success-message">' +
                '<div style="font-size: 2em; margin-bottom: 15px;">✅</div>' +
                '<div style="font-size: 1.5em; font-weight: bold; margin-bottom: 10px;">' +
                'Successfully Connected!' +
                '</div>' +
                '<p>Connected as: <strong>' + data.user + '</strong></p>' +
                '<p>' + data.message + '</p>' +
                '</div>';
        });

        // Handle authentication status updates
        socket.on('auth_status', (data) => {
            console.log('Auth status update:', data.status);
            const authSection = document.getElementById('auth-section');
            const authStatus = document.getElementById('auth-status');
            
            let statusColor = 'warning-message';
            let statusIcon = '⚠️';
            let statusTitle = 'Authentication Status';
            
            if (data.status === 'authenticated') {
                statusColor = 'success-message';
                statusIcon = '✅';
                statusTitle = 'Authentication Successful';
            } else if (data.status === 'auth_failure') {
                statusColor = 'error-message';
                statusIcon = '❌';
                statusTitle = 'Authentication Failed';
            } else if (data.status === 'disconnected') {
                statusColor = 'error-message';
                statusIcon = '📴';
                statusTitle = 'Connection Lost';
            }
            
            authSection.classList.remove('hidden');
            authStatus.innerHTML = '<div class="' + statusColor + '">' +
                '<div style="font-size: 2em; margin-bottom: 15px;">' + statusIcon + '</div>' +
                '<div style="font-size: 1.3em; font-weight: bold; margin-bottom: 10px;">' +
                statusTitle +
                '</div>' +
                '<p>' + data.message + '</p>' +
                '</div>';
        });

        // Handle general status updates
        socket.on('status', (data) => {
            updateDashboardStatus(data);
        });

        function updateDashboardStatus(data) {
            // Update bot status
            const statusElement = document.getElementById('status');
            const isConnected = data.status && data.status.includes('Connected');
            const indicatorClass = isConnected ? 'status-connected' : 'status-disconnected';
            
            statusElement.innerHTML = '<span class="status-indicator ' + indicatorClass + '"></span>' +
                (data.status || 'Unknown Status');
            
            // Update uptime
            document.getElementById('uptime').textContent = data.uptime || 'Unknown';
            
            // Update commands count
            const commandsElement = document.getElementById('commands');
            commandsElement.innerHTML = '<div style="font-size: 2em; font-weight: bold; color: #4CAF50;">' +
                (data.commandCount || 0) +
                '</div>' +
                '<div style="margin-top: 5px;">Commands Loaded</div>';
            
            // Update rate limiter
            if (data.rateLimiter) {
                const rl = data.rateLimiter;
                const rateLimiterElement = document.getElementById('rateLimiter');
                const statsElement = document.getElementById('rate-limiter-stats');
                
                rateLimiterElement.innerHTML = '<div>Queue: ' + rl.queuedRequests + ' | Active: ' + rl.activeRequests + '</div>' +
                    '<div style="margin-top: 5px;">Processing: ' + (rl.isProcessing ? 'Yes' : 'No') + '</div>';
                
                // Update individual stats
                if (document.getElementById('queue-count')) {
                    document.getElementById('queue-count').textContent = rl.queuedRequests;
                    document.getElementById('active-count').textContent = rl.activeRequests;
                    document.getElementById('processing-status').textContent = rl.isProcessing ? 'Yes' : 'No';
                }
            }
        }

        // Set current year in footer
        document.getElementById('currentYear').innerText = new Date().getFullYear();
    </script>
</body>
</html>
        `;
    }
}

module.exports = WebDashboard;
