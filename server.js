/**
 * OpenSail - Simple multiplayer server
 */
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the dist directory (Webpack output)
app.use(express.static(path.join(__dirname, 'dist')));

// For any other routes, serve the index.html (for client-side routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Game state
const gameState = {
    players: new Map(), // Map of socket ID to player data
    boats: [], // Array of boat states
    environment: {
        wind: {
            direction: 0,
            speed: 5,
            x: 0,
            y: 0,
            z: -5 // Initial wind from north (negative z)
        },
        waves: {
            isActive: true,
            amplitude: 0.5,
            frequency: 0.2,
            direction: 0,
            speed: 1
        }
    },
    raceStarted: false,
    raceFinished: false,
    raceTime: 0,
    lastUpdateTime: Date.now()
};

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // Handle player joining
    socket.on('player_join', (data) => {
        const playerName = data.name || 'Player';
        console.log(`Player joined: ${playerName} (${socket.id})`);
        
        // Add player to game state
        gameState.players.set(socket.id, {
            id: socket.id,
            name: playerName,
            boat: null
        });
        
        // Send player ID back to client
        socket.emit('player_id', { id: socket.id });
        
        // If we have enough players (2+), start the race
        if (gameState.players.size >= 2 && !gameState.raceStarted) {
            startRace();
        }
    });
    
    // Handle boat updates from clients
    socket.on('boat_update', (boatState) => {
        // Find the boat in our array
        const boatIndex = gameState.boats.findIndex(boat => boat.id === socket.id);
        
        if (boatIndex !== -1) {
            // Update the boat state with client data
            gameState.boats[boatIndex] = {
                ...boatState,
                id: socket.id,
                playerName: gameState.players.get(socket.id)?.name || 'Player'
            };
        } else {
            // Add new boat if it doesn't exist
            gameState.boats.push({
                ...boatState,
                id: socket.id,
                playerName: gameState.players.get(socket.id)?.name || 'Player'
            });
        }
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        
        // Remove player from game state
        gameState.players.delete(socket.id);
        
        // Remove player's boat
        const boatIndex = gameState.boats.findIndex(boat => boat.id === socket.id);
        if (boatIndex !== -1) {
            gameState.boats.splice(boatIndex, 1);
        }
        
        // If no players left, reset race
        if (gameState.players.size === 0) {
            resetRace();
        }
    });
});

/**
 * Start the multiplayer race
 */
function startRace() {
    console.log('Starting race...');
    
    gameState.raceStarted = true;
    gameState.raceFinished = false;
    gameState.raceTime = 0;
    gameState.lastUpdateTime = Date.now();
    
    // Initialize random wind
    updateWind();
    
    // Broadcast race start
    broadcastGameState();
}

/**
 * Reset the race
 */
function resetRace() {
    console.log('Resetting race...');
    
    gameState.raceStarted = false;
    gameState.raceFinished = false;
    gameState.raceTime = 0;
    gameState.boats = [];
}

/**
 * Update wind parameters occasionally
 */
function updateWind() {
    if (Math.random() < 0.05) { // 5% chance each update
        const wind = gameState.environment.wind;
        
        // Gradually change wind direction
        wind.direction += (Math.random() - 0.5) * 10; // +/- 5 degrees
        wind.direction = ((wind.direction % 360) + 360) % 360; // Normalize to 0-359
        
        // Gradually change wind speed
        wind.speed += (Math.random() - 0.5) * 2; // +/- 1 m/s
        wind.speed = Math.max(1, Math.min(15, wind.speed)); // Clamp between 1-15 m/s
        
        // Update vector components
        const directionRad = wind.direction * Math.PI / 180;
        wind.x = -Math.sin(directionRad) * wind.speed;
        wind.z = -Math.cos(directionRad) * wind.speed;
    }
}

/**
 * Update game state and broadcast to all clients
 */
function updateGameState() {
    if (!gameState.raceStarted || gameState.raceFinished) return;
    
    // Calculate delta time
    const now = Date.now();
    const deltaTime = (now - gameState.lastUpdateTime) / 1000; // in seconds
    gameState.lastUpdateTime = now;
    
    // Update race time
    gameState.raceTime += deltaTime;
    
    // Update environment
    updateWind();
    
    // Broadcast updated state to all clients
    broadcastGameState();
}

/**
 * Broadcast current game state to all connected clients
 */
function broadcastGameState() {
    io.emit('game_state', {
        boats: gameState.boats,
        environment: gameState.environment,
        raceStarted: gameState.raceStarted,
        raceFinished: gameState.raceFinished,
        raceTime: gameState.raceTime
    });
}

// Set up game state update interval (20 Hz)
const updateInterval = setInterval(updateGameState, 50);

// Start the server with port fallback mechanism
const startServer = (port) => {
  server.listen(port)
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is busy, trying port ${port + 1}...`);
        startServer(port + 1);
      } else {
        console.error('Server error:', err);
      }
    })
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`OpenSail server running on port ${actualPort}`);
    });
};

const PORT = process.env.PORT || 3000;
startServer(PORT);

// Handle server shutdown
process.on('SIGINT', () => {
    console.log('Server shutting down...');
    clearInterval(updateInterval);
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
}); 