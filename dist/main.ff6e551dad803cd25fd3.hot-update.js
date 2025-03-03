"use strict";
self["webpackHotUpdateopensail"]("main",{

/***/ "./src/js/environment.js":
/*!*******************************!*\
  !*** ./src/js/environment.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/* harmony import */ var _water_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./water.js */ "./src/js/water.js");
/**
 * Environment class to handle wind and waves simulation
 */
 // Import all utility functions as Utils namespace
 // Import our new WebGL Water implementation

class Environment {
    /**
     * Create a new Environment
     * @param {Object} options - Environment configuration options
     * @param {THREE.Scene} options.scene - Three.js scene to add environment elements
     */
    constructor(options = {}) {
        this.scene = options.scene;
        
        // Wind properties
        this.wind = {
            direction: 0, // degrees (0 = from north, 90 = from east)
            speed: 5, // m/s
            x: 0, // x component
            y: 0, // y component
            z: 0, // z component
            gustFactor: 0.2, // How much gusts affect wind speed
            changeRate: 0.02 // How quickly wind changes direction/speed
        };
        
        // Update wind vector components
        this.updateWindVector();
        
        // Wave properties
        this.waves = {
            isActive: true,
            amplitude: 0.5, // meters
            frequency: 0.2, // cycles per meter
            direction: 0, // degrees (same as wind initially)
            speed: 1, // wave movement speed
            steepness: 0.5, // wave steepness factor (0-1)
            components: [] // Will store multiple wave components for more realism
        };
        
        // Initialize random wave components for more realistic ocean
        this.initWaveComponents();
        
        // Create water and sky in the scene
        if (this.scene) {
            this.createWater();
            this.createSky();
        }
    }
    
    /**
     * Initialize multiple wave components for more realistic ocean waves
     */
    initWaveComponents() {
        // Create 5 wave components with varying parameters
        for (let i = 0; i < 5; i++) {
            const directionVariation = _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(-20, 20);
            this.waves.components.push({
                amplitude: this.waves.amplitude * _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(0.2, 1),
                frequency: this.waves.frequency * _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(0.5, 2),
                direction: _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(this.waves.direction + directionVariation),
                phase: _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(0, Math.PI * 2),
                speed: this.waves.speed * _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(0.8, 1.2)
            });
        }
    }
    
    /**
     * Create water surface in the scene
     */
    createWater() {
        // Create the new WebGL water simulation
        this.water = new _water_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
            scene: this.scene,
            width: 5000,
            height: 5000,
            resolution: 256
        });
        
        // Store reference to the water mesh
        this.waterMesh = this.water.waterMesh;
        
        // Add a simple reflection on the water
        const waterLight = new THREE.DirectionalLight(0xffffbb, 0.5);
        waterLight.position.set(0, 100, 0);
        this.scene.add(waterLight);
        
        // Create some initial water disturbance
        this.createInitialWaves();
    }
    
    /**
     * Create initial wave disturbances
     */
    createInitialWaves() {
        // Add some initial drops to create waves
        for (let i = 0; i < 5; i++) {
            const x = Math.random();
            const y = Math.random();
            const radius = 0.03 + Math.random() * 0.02;
            const strength = 0.5 + Math.random() * 0.5;
            
            this.water.addDrop(x, y, radius, strength);
        }
    }
    
    /**
     * Create sky in the scene
     */
    createSky() {
        // Simple sky using a large sphere
        const skyGeometry = new THREE.SphereGeometry(2000, 32, 32);
        // Reverse the normals to make them point inward
        skyGeometry.scale(-1, 1, 1); 
        
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x87ceeb, // Sky blue
            side: THREE.BackSide
        });
        
        this.skyMesh = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(this.skyMesh);
    }
    
    /**
     * Update the wind vector components based on direction and speed
     */
    updateWindVector() {
        const directionRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.wind.direction);
        this.wind.x = -Math.sin(directionRad) * this.wind.speed;
        this.wind.z = -Math.cos(directionRad) * this.wind.speed;
        this.wind.y = 0; // No vertical wind component
    }
    
    /**
     * Update the environment simulation
     * @param {number} deltaTime - Time step in seconds
     * @param {Boat} localBoat - Reference to the player's boat for wake effects
     */
    update(deltaTime, localBoat) {
        this.updateWind(deltaTime);
        this.updateWaves(deltaTime);
        
        // Update water mesh vertices to simulate waves
        this.updateWaterMesh();
        
        // Create boat wake effects if a boat is provided
        if (localBoat && this.water) {
            this.createBoatWake(localBoat);
        }
        
        // Return environment data for networking/physics
        return {
            wind: {
                direction: this.wind.direction,
                speed: this.wind.speed,
                x: this.wind.x,
                y: this.wind.y,
                z: this.wind.z
            },
            waves: {
                isActive: this.waves.isActive,
                amplitude: this.waves.amplitude,
                frequency: this.waves.frequency,
                direction: this.waves.direction,
                speed: this.waves.speed,
                components: this.waves.components
            }
        };
    }
    
    /**
     * Update wind parameters
     * @param {number} deltaTime - Time step in seconds
     */
    updateWind(deltaTime) {
        // Occasionally change wind parameters for realism
        if (Math.random() < this.wind.changeRate * deltaTime) {
            // Gradually shift wind direction
            this.wind.direction += _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(-5, 5);
            this.wind.direction = _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(this.wind.direction);
            
            // Gradually change wind speed
            const speedChange = _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(-0.5, 0.5);
            this.wind.speed = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(this.wind.speed + speedChange, 1, 15);
            
            // Update components
            this.updateWindVector();
            
            // Gradually align wave direction with wind (with some delay)
            this.waves.direction += (this.wind.direction - this.waves.direction) * 0.01;
        }
        
        // Add gusts to wind speed
        if (Math.random() < 0.1 * deltaTime) {
            const gust = _utils_js__WEBPACK_IMPORTED_MODULE_0__.randomRange(-this.wind.gustFactor, this.wind.gustFactor) 
                        * this.wind.speed;
            this.wind.speed = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(this.wind.speed + gust, 1, 15);
            this.updateWindVector();
        }
    }
    
    /**
     * Update wave parameters
     * @param {number} deltaTime - Time step in seconds
     */
    updateWaves(deltaTime) {
        // Gradually adjust wave height based on wind speed
        const targetAmplitude = this.wind.speed * 0.1;
        this.waves.amplitude += (targetAmplitude - this.waves.amplitude) * 0.01;
        
        // Update each wave component
        this.waves.components.forEach(component => {
            // Adjust phase based on speed
            component.phase += component.speed * deltaTime;
            
            // Gradually align with main wave direction (with variation)
            component.direction += (this.waves.direction - component.direction) * 0.01;
        });
    }
    
    /**
     * Update water mesh vertices to create wave effect
     */
    updateWaterMesh() {
        // If we're using the new WebGL water, update it
        if (this.water) {
            // Update the WebGL water simulation
            this.water.update(1/60, this.scene.getObjectByProperty('isCamera', true));
            
            // Add occasional drops based on wind speed
            if (Math.random() < 0.05 * (this.wind.speed / 15)) {
                const x = Math.random();
                const y = Math.random();
                const radius = 0.02 + Math.random() * 0.03;
                const strength = 0.3 + Math.random() * 0.7 * (this.wind.speed / 15);
                
                this.water.addDrop(x, y, radius, strength);
            }
            
            return;
        }
        
        // Original water update code (fallback)
        if (!this.waterMesh) return;
        
        const now = Date.now() / 1000;
        const geometry = this.waterMesh.geometry;
        const position = geometry.attributes.position;
        
        // For each vertex in the water geometry
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const z = position.getZ(i);
            
            // Calculate height for this vertex
            let height = 0;
            
            // Sum heights from all wave components
            this.waves.components.forEach(wave => {
                const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(wave.direction);
                const dx = x * Math.cos(dirRad) + z * Math.sin(dirRad);
                
                // Simple sine wave
                height += wave.amplitude * 
                          Math.sin(dx * wave.frequency + now * wave.speed + wave.phase);
            });
            
            // Set the vertex height
            position.setY(i, height);
        }
        
        // Mark attributes as needing update
        position.needsUpdate = true;
        
        // Update normals for proper lighting
        geometry.computeVertexNormals();
    }
    
    /**
     * Set wind parameters manually (e.g., from server or scenario)
     * @param {Object} windParams - Wind parameters
     */
    setWind(windParams) {
        if (windParams.direction !== undefined) {
            this.wind.direction = _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(windParams.direction);
        }
        
        if (windParams.speed !== undefined) {
            this.wind.speed = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(windParams.speed, 0, 30);
        }
        
        // Update wind vector
        this.updateWindVector();
    }
    
    /**
     * Set wave parameters manually (e.g., from server or scenario)
     * @param {Object} waveParams - Wave parameters
     */
    setWaves(waveParams) {
        if (waveParams.isActive !== undefined) {
            this.waves.isActive = waveParams.isActive;
        }
        
        if (waveParams.amplitude !== undefined) {
            this.waves.amplitude = waveParams.amplitude;
        }
        
        if (waveParams.frequency !== undefined) {
            this.waves.frequency = waveParams.frequency;
        }
        
        if (waveParams.direction !== undefined) {
            this.waves.direction = _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(waveParams.direction);
        }
        
        if (waveParams.speed !== undefined) {
            this.waves.speed = waveParams.speed;
        }
        
        // Update wave components to match new parameters
        if (waveParams.components) {
            this.waves.components = waveParams.components;
        } else {
            // Reinitialize components with the new parameters
            this.waves.components = [];
            this.initWaveComponents();
        }
    }
    
    /**
     * Handle server update for environment synchronization
     * @param {Object} environmentState - Environment state from server
     */
    handleServerUpdate(environmentState) {
        if (environmentState.wind) {
            this.setWind(environmentState.wind);
        }
        
        if (environmentState.waves) {
            this.setWaves(environmentState.waves);
        }
    }
    
    /**
     * Calculate wave height at a specific position
     * @param {THREE.Vector3} position - Position to get wave height for
     * @param {number} time - Current time in seconds
     * @returns {number} Wave height at the position
     */
    getWaveHeight(position, time) {
        // If we're using the new WebGL water, use its height calculation
        if (this.water) {
            return this.water.getHeightAt(position);
        }
        
        // Original wave height calculation
        let height = 0;
        
        // Skip calculation if waves are disabled
        if (!this.waves.isActive) return height;
        
        // Sum heights from all wave components
        this.waves.components.forEach(wave => {
            const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(wave.direction);
            const dx = position.x * Math.cos(dirRad) + position.z * Math.sin(dirRad);
            
            // Simple sine wave
            height += wave.amplitude * 
                     Math.sin(dx * wave.frequency + time * wave.speed + wave.phase);
        });
        
        return height;
    }
    
    /**
     * Dispose of environment resources
     */
    dispose() {
        // Clean up WebGL water
        if (this.water) {
            this.water.dispose();
            this.water = null;
        }
        
        // Original cleanup
        if (this.waterMesh) {
            this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
            this.waterMesh = null;
        }
        
        if (this.skyMesh) {
            this.scene.remove(this.skyMesh);
            this.skyMesh.geometry.dispose();
            this.skyMesh.material.dispose();
            this.skyMesh = null;
        }
    }
    
    /**
     * Create wake effects from boat movement
     * @param {Boat} boat - The boat to create wake for
     */
    createBoatWake(boat) {
        if (!this.water || !boat) return;
        
        // Only create wake if boat is moving fast enough
        if (boat.speed < 1) return;
        
        // Get boat position in water UV space (0-1)
        const halfWidth = this.water.width / 2;
        const halfHeight = this.water.height / 2;
        
        const x = (boat.position.x + halfWidth) / this.water.width;
        const y = (boat.position.z + halfHeight) / this.water.height;
        
        // Check if position is within water bounds
        if (x < 0 || x > 1 || y < 0 || y > 1) return;
        
        // Create wake strength based on boat speed
        const strength = Math.min(1.0, boat.speed / 10);
        const radius = 0.02 + (boat.speed / 20) * 0.03;
        
        // Add drop at boat position
        this.water.addDrop(x, y, radius, strength);
        
        // Add smaller drops behind boat for wake effect
        if (boat.speed > 5) {
            // Get boat's backward direction
            const direction = new THREE.Vector3(0, 0, 1);
            direction.applyQuaternion(boat.orientation);
            direction.normalize();
            
            // Create wake behind boat
            for (let i = 1; i <= 2; i++) {
                const wakeX = x - direction.x * i * 0.02;
                const wakeY = y - direction.z * i * 0.02;
                
                if (wakeX >= 0 && wakeX <= 1 && wakeY >= 0 && wakeY <= 1) {
                    this.water.addDrop(
                        wakeX, 
                        wakeY, 
                        radius * 0.7, 
                        strength * 0.5
                    );
                }
            }
        }
    }
}

// Export the Environment class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Environment); 

/***/ }),

/***/ "./src/js/game.js":
/*!************************!*\
  !*** ./src/js/game.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _environment_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./environment.js */ "./src/js/environment.js");
/* harmony import */ var _renderer_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./renderer.js */ "./src/js/renderer.js");
/* harmony import */ var _controls_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./controls.js */ "./src/js/controls.js");
/* harmony import */ var _boat_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./boat.js */ "./src/js/boat.js");
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/**
 * Game class to manage the overall game state and coordinate components
 */




 // Import all utility functions as Utils namespace


class Game {
    /**
     * Create a new Game
     * @param {Object} options - Game configuration options
     * @param {HTMLCanvasElement} options.canvas - Canvas element for rendering
     * @param {boolean} options.debug - Enable debug features
     */
    constructor(options = {}) {
        this.canvas = options.canvas;
        this.debug = options.debug || false;
        
        // Game objects
        this.renderer = null;
        this.environment = null;
        this.boats = new Map(); // Map of boat id to boat object
        this.localBoat = null; // Reference to the player's boat
        this.controls = null;
        this.course = null; // Will store race course data
        
        // Game state
        this.state = {
            isRunning: false,
            isPaused: false,
            raceStarted: false,
            raceFinished: false,
            raceTime: 0,
            timeOfDay: 12, // Noon by default
        };
        
        // Game configuration
        this.config = {
            boatCount: 1, // Number of boats (default single player)
            initialPosition: new THREE.Vector3(0, 0, 0),
            timeScale: 1, // For speeding up or slowing down physics
        };
        
        // Multiplayer settings
        this.multiplayer = {
            enabled: false,
            socket: null,
            playerId: null,
            serverUpdateRate: 20, // Hz
            interpolation: true,
            playerName: 'Player',
        };
        
        // Initialize components
        this.init();
    }
    
    /**
     * Initialize game components
     */
    init() {
        console.log('Initializing game...');
        
        // Create renderer
        this.renderer = new _renderer_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
            canvas: this.canvas,
            debug: this.debug,
        });
        
        // Create environment
        this.environment = new _environment_js__WEBPACK_IMPORTED_MODULE_0__["default"]({
            scene: this.renderer.scene,
        });
        
        // Set environment in renderer for time of day effects
        this.renderer.setEnvironment(this.environment);
        
        // Create controls
        this.controls = new _controls_js__WEBPACK_IMPORTED_MODULE_2__["default"]({
            onControlsChange: (controls) => this.handleControlsChange(controls),
        });
        
        // Set up loading screen
        this.showLoadingScreen();
        
        // Set up menu event listeners
        this.setupMenuListeners();
    }
    
    /**
     * Show the loading screen
     */
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        const loadingBar = document.getElementById('loading-bar');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'flex';
        }
        
        // Simulate loading progress
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += 5;
            if (loadingBar) {
                loadingBar.style.width = `${progress}%`;
            }
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                // Show menu after loading
                this.hideLoadingScreen();
                this.showMenu();
            }
        }, 100);
    }
    
    /**
     * Hide the loading screen
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }
    
    /**
     * Show the game menu
     */
    showMenu() {
        const menu = document.getElementById('game-menu');
        if (menu) {
            menu.style.display = 'flex';
        }
    }
    
    /**
     * Hide the game menu
     */
    hideMenu() {
        const menu = document.getElementById('game-menu');
        if (menu) {
            menu.style.display = 'none';
        }
    }
    
    /**
     * Set up menu button listeners
     */
    setupMenuListeners() {
        const startButton = document.getElementById('start-game');
        if (startButton) {
            startButton.addEventListener('click', () => {
                this.multiplayer.enabled = false;
                this.hideMenu();
                this.startSinglePlayer();
            });
        }
        
        const joinButton = document.getElementById('join-game');
        if (joinButton) {
            joinButton.addEventListener('click', () => {
                this.multiplayer.enabled = true;
                this.hideMenu();
                this.startMultiplayer();
            });
        }
        
        // Update player name when input changes
        const playerNameInput = document.getElementById('player-name');
        if (playerNameInput) {
            playerNameInput.addEventListener('input', (e) => {
                this.multiplayer.playerName = e.target.value || 'Player';
            });
        }
    }
    
    /**
     * Start a single player game
     */
    startSinglePlayer() {
        console.log('Starting single player game...');
        
        // Create a boat for the player
        this.createLocalBoat();
        
        // Set up camera in orbit mode
        this.setCameraView('orbit');
        
        // Set up a simple race course
        this.setupRaceCourse();
        
        // Start the game loop
        this.start();
    }
    
    /**
     * Start a multiplayer game
     */
    startMultiplayer() {
        console.log('Starting multiplayer game...');
        
        // Connect to the server
        this.connectToServer();
        
        // The rest will be handled by the server connection
    }
    
    /**
     * Create the local player's boat
     */
    createLocalBoat() {
        const boat = new _boat_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
            id: 'local_player',
            playerName: this.multiplayer.playerName,
            position: this.config.initialPosition.clone(),
            orientation: new THREE.Quaternion(),
            scene: this.renderer.scene,
        });
        
        this.boats.set(boat.id, boat);
        this.localBoat = boat;
        
        // Update UI with player name
        this.updatePlayerInfo();
    }
    
    /**
     * Set up a basic race course
     */
    setupRaceCourse() {
        // Define a simple triangular course with start/finish line and buoys
        this.course = {
            startPosition: new THREE.Vector3(0, 0, 0),
            buoys: [
                { 
                    position: new THREE.Vector3(100, 0, 0),
                    passed: false,
                    mesh: null
                },
                { 
                    position: new THREE.Vector3(50, 0, 100),
                    passed: false,
                    mesh: null
                },
                { 
                    position: new THREE.Vector3(-50, 0, 50),
                    passed: false,
                    mesh: null
                }
            ],
            finishPosition: new THREE.Vector3(0, 0, 0),
            currentBuoy: 0,
            laps: 1,
            currentLap: 0,
        };
        
        // Create visual markers for the course
        this.createCourseMarkers();
    }
    
    /**
     * Create visual markers for the race course
     */
    createCourseMarkers() {
        // Create buoys
        const buoyGeometry = new THREE.SphereGeometry(2, 16, 16);
        const buoyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        
        this.course.buoys.forEach((buoy, index) => {
            const buoyMesh = new THREE.Mesh(buoyGeometry, buoyMaterial);
            buoyMesh.position.copy(buoy.position);
            buoyMesh.position.y = 2; // Raise above water
            this.renderer.scene.add(buoyMesh);
            
            // Store reference to the mesh
            buoy.mesh = buoyMesh;
            
            // Add a pole
            const poleGeometry = new THREE.CylinderGeometry(0.2, 0.2, 5, 8);
            const poleMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
            const pole = new THREE.Mesh(poleGeometry, poleMaterial);
            pole.position.set(0, -1.5, 0);
            buoyMesh.add(pole);
            
            // Add buoy number
            // In a real implementation, we would add a sprite with text
        });
        
        // Create start/finish line
        const lineGeometry = new THREE.BoxGeometry(20, 0.5, 2);
        const lineMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.7,
        });
        const startLine = new THREE.Mesh(lineGeometry, lineMaterial);
        startLine.position.copy(this.course.startPosition);
        startLine.position.y = 0.3; // Slightly above water
        this.renderer.scene.add(startLine);
    }
    
    /**
     * Connect to multiplayer server
     */
    connectToServer() {
        // Create a socket.io connection using our socketConnect helper
        this.multiplayer.socket = window.socketConnect();
        
        // Set up socket event handlers
        this.setupSocketHandlers();
    }
    
    /**
     * Set up socket.io event handlers
     */
    setupSocketHandlers() {
        const socket = this.multiplayer.socket;
        
        // Handle connection
        socket.on('connect', () => {
            console.log('Connected to server');
            
            // Send player info to server
            socket.emit('player_join', {
                name: this.multiplayer.playerName
            });
        });
        
        // Handle player ID assignment
        socket.on('player_id', (data) => {
            console.log('Received player ID:', data.id);
            this.multiplayer.playerId = data.id;
            
            // Create local boat with assigned ID
            this.createLocalBoat();
            
            // Set up camera to follow the player's boat
            this.renderer.setupBoatCamera(this.localBoat);
        });
        
        // Handle game state update from server
        socket.on('game_state', (data) => {
            // Update game state
            this.state.raceStarted = data.raceStarted;
            this.state.raceFinished = data.raceFinished;
            this.state.raceTime = data.raceTime;
            
            // Update environment
            if (data.environment) {
                this.environment.handleServerUpdate(data.environment);
            }
            
            // Update boats
            if (data.boats) {
                this.updateBoatsFromServer(data.boats);
            }
            
            // Check if the game is now running
            if (!this.state.isRunning && data.raceStarted) {
                this.start();
            }
        });
        
        // Handle disconnection
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
            
            // Handle disconnection (e.g., show a message, return to menu)
            this.stop();
            this.showMenu();
        });
    }
    
    /**
     * Update boats from server data
     * @param {Array} boatData - Array of boat states from server
     */
    updateBoatsFromServer(boatData) {
        // Process each boat in the server data
        boatData.forEach(serverBoat => {
            const boatId = serverBoat.id;
            
            if (boatId === this.multiplayer.playerId) {
                // This is our boat - only update if significant drift
                // Client prediction would normally handle our movement
                if (this.localBoat) {
                    // For now, just apply server state - replace with proper reconciliation later
                    this.localBoat.handleServerUpdate(serverBoat);
                }
            } else {
                // This is another player's boat
                if (this.boats.has(boatId)) {
                    // Update existing boat
                    this.boats.get(boatId).handleServerUpdate(serverBoat);
                } else {
                    // Create new boat
                    const newBoat = new _boat_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
                        id: boatId,
                        playerName: serverBoat.playerName || 'Other Player',
                        scene: this.renderer.scene,
                    });
                    
                    // Apply server state
                    newBoat.handleServerUpdate(serverBoat);
                    
                    // Add to boats collection
                    this.boats.set(boatId, newBoat);
                }
            }
        });
        
        // Check for boats that no longer exist on server (player left)
        this.boats.forEach((boat, id) => {
            const stillExists = boatData.some(serverBoat => serverBoat.id === id);
            
            if (!stillExists && id !== this.multiplayer.playerId) {
                // Remove boat that's no longer on the server
                boat.dispose();
                this.boats.delete(id);
            }
        });
    }
    
    /**
     * Start the game
     */
    start() {
        if (this.state.isRunning) return;
        
        console.log('Starting game...');
        
        // Set game state
        this.state.isRunning = true;
        this.state.isPaused = false;
        
        // Start the renderer
        this.renderer.start((deltaTime) => this.update(deltaTime));
        
        // Hide UI elements
        this.hideMenu();
        
        // Update UI
        this.updateUI();
    }
    
    /**
     * Update game state and all game objects
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.state.isRunning || this.state.isPaused) return;
        
        // Apply time scaling to deltaTime (for slow-mo or speedup effects)
        const scaledDeltaTime = deltaTime * this.config.timeScale;
        
        // Update environment first
        const environmentState = this.environment.update(scaledDeltaTime, this.localBoat);
        
        // Update all boats
        this.boats.forEach(boat => {
            boat.update(environmentState, scaledDeltaTime);
        });
        
        // Check boat position against course markers
        if (this.localBoat && this.course) {
            this.checkCourseProgress();
        }
        
        // Update camera based on view
        if (this.localBoat && this.renderer) {
            switch(this.cameraView) {
                case 'first-person':
                    this.updateFirstPersonCamera();
                    break;
                    
                case '3rd-person':
                    this.update3rdPersonCamera();
                    break;
                    
                case 'orbit':
                    // Orbit controls are updated in the renderer animation loop
                    // We just need to ensure the target is set correctly
                    if (this.renderer.controls) {
                        this.renderer.controls.target.copy(this.localBoat.position);
                    }
                    break;
                    
                // top-down has static camera, no updates needed
            }
        }
        
        // Update UI
        this.updateUI();
        
        // Send updates to server if in multiplayer mode
        if (this.multiplayer.enabled && this.multiplayer.socket && this.localBoat) {
            this.sendUpdatesToServer();
        }
        
        // Update race time if race started
        if (this.state.raceStarted && !this.state.raceFinished) {
            this.state.raceTime += scaledDeltaTime;
        }
    }
    
    /**
     * Check the player's progress on the race course
     */
    checkCourseProgress() {
        if (!this.localBoat || !this.course) return;
        
        // Get the next buoy to pass
        const nextBuoy = this.course.buoys[this.course.currentBuoy];
        
        // Check distance to next buoy
        const distance = this.localBoat.position.distanceTo(nextBuoy.position);
        
        // If close enough to the buoy, mark it as passed
        if (distance < 10 && !nextBuoy.passed) {
            console.log(`Passed buoy ${this.course.currentBuoy + 1}`);
            nextBuoy.passed = true;
            
            // Change buoy color to green to indicate it's been passed
            if (nextBuoy.mesh) {
                nextBuoy.mesh.material.color.set(0x00ff00);
            }
            
            // Move to next buoy
            this.course.currentBuoy = (this.course.currentBuoy + 1) % this.course.buoys.length;
            
            // If we've completed a lap
            if (this.course.currentBuoy === 0) {
                this.course.currentLap++;
                console.log(`Completed lap ${this.course.currentLap} of ${this.course.laps}`);
                
                // Reset buoys for next lap
                if (this.course.currentLap < this.course.laps) {
                    this.course.buoys.forEach(buoy => {
                        buoy.passed = false;
                        if (buoy.mesh) {
                            buoy.mesh.material.color.set(0xff0000);
                        }
                    });
                } else {
                    // Race finished
                    this.finishRace();
                }
            }
            
            // Update UI
            this.updateCourseInfo();
        }
    }
    
    /**
     * Handle race finish
     */
    finishRace() {
        console.log('Race finished!');
        this.state.raceFinished = true;
        
        // Show race results
        this.showRaceResults();
    }
    
    /**
     * Show race results
     */
    showRaceResults() {
        // In a real implementation, this would display a UI with race results
        alert(`Race Finished! Time: ${_utils_js__WEBPACK_IMPORTED_MODULE_4__.formatTime(this.state.raceTime)}`);
    }
    
    /**
     * Send updates to the server
     */
    sendUpdatesToServer() {
        if (!this.multiplayer.enabled || !this.multiplayer.socket || !this.localBoat) return;
        
        // Get current boat state
        const boatState = this.localBoat.update(
            this.environment.update(0, null), // Get current environment without updating
            0 // Don't update physics again
        );
        
        // Send boat state to server
        this.multiplayer.socket.emit('boat_update', boatState);
    }
    
    /**
     * Handle controls changes from the Controls class
     * @param {Object} controls - Current control state
     */
    handleControlsChange(controls) {
        // Apply controls to local boat
        if (this.localBoat) {
            this.localBoat.rudderAngle = controls.rudderAngle;
            this.localBoat.sailAngle = controls.sailAngle;
            this.localBoat.throttle = controls.throttle;
        }
        
        // We no longer need to handle camera view changes since we only use orbit mode
    }
    
    /**
     * Set camera view mode
     * @param {string} view - Camera view mode ('orbit', 'first-person', 'top-down', '3rd-person')
     */
    setCameraView(view) {
        if (!this.renderer) return;
        
        // Store the current view
        this.cameraView = view;
        
        // Prevent the context menu on right-click for better camera control
        // Apply this globally regardless of camera mode
        this.renderer.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        switch(view) {
            case 'top-down':
                // Clean up any existing controls
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                    this.renderer.controls = null;
                }
                
                // Set the camera position high above
                this.renderer.camera.position.set(0, 100, 0);
                this.renderer.camera.lookAt(0, 0, 0);
                break;
                
            case 'first-person':
                // Clean up any existing controls
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                    this.renderer.controls = null;
                }
                
                this.renderer.setupBoatCamera(this.localBoat);
                this.renderer.followBoatMode = true;
                break;

            case 'orbit':
                // Set up OrbitControls centered on the boat
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                }
                
                // Set the boat as follow target to ensure camera follows it
                this.renderer.setupControls();
                this.renderer.followBoat = this.localBoat;
                this.renderer.followBoatMode = true;
                break;
                
            case '3rd-person':
                // Clean up any existing controls
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                    this.renderer.controls = null;
                }
                
                this.renderer.followBoat = this.localBoat;
                this.renderer.followBoatMode = true;
                break;
        }
    }
    
    /**
     * Update the 3rd person camera position
     */
    update3rdPersonCamera() {
        if (!this.localBoat || !this.renderer) return;
        
        const boat = this.localBoat;
        const camera = this.renderer.camera;
        
        // Get boat's position and direction
        const boatPosition = boat.position.clone();
        const boatDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(boat.orientation);
        
        // Calculate camera position: behind and above the boat
        // Adjust these values to get the desired camera position
        const distanceBehind = 10; // Distance behind the boat
        const heightAbove = 5;    // Height above the boat
        
        // Calculate the position behind the boat using its direction
        const cameraOffset = boatDirection.clone().multiplyScalar(-distanceBehind);
        cameraOffset.y = heightAbove;
        
        // Set camera position
        const targetCameraPosition = boatPosition.clone().add(cameraOffset);
        
        // Smoothly interpolate current camera position to target position
        camera.position.lerp(targetCameraPosition, 0.05);
        
        // Look at a point slightly ahead of the boat
        const lookAtOffset = boatDirection.clone().multiplyScalar(5);
        const lookAtPosition = boatPosition.clone().add(lookAtOffset);
        lookAtPosition.y += 1; // Look slightly above the boat
        
        camera.lookAt(lookAtPosition);
    }
    
    /**
     * Update the UI with current game state
     */
    updateUI() {
        this.updateWindIndicator();
        this.updateBoatInfo();
        this.updateRaceInfo();
    }
    
    /**
     * Update the wind indicator in the UI
     */
    updateWindIndicator() {
        const windArrow = document.getElementById('wind-arrow');
        const windSpeed = document.getElementById('wind-speed');
        
        if (windArrow && this.environment) {
            // Rotate arrow to point in wind direction
            windArrow.style.transform = `rotate(${this.environment.wind.direction}deg)`;
        }
        
        if (windSpeed && this.environment) {
            // Display wind speed in knots (1 m/s ≈ 1.94 knots)
            const knotsSpeed = (this.environment.wind.speed * 1.94).toFixed(1);
            windSpeed.textContent = `${knotsSpeed} knots`;
        }
    }
    
    /**
     * Update boat information in the UI
     */
    updateBoatInfo() {
        const headingElement = document.getElementById('heading');
        const speedElement = document.getElementById('speed');
        const throttleElement = document.getElementById('throttle');
        const rudderElement = document.getElementById('rudder');
        
        if (headingElement && this.localBoat) {
            headingElement.textContent = `Heading: ${Math.round(this.localBoat.heading)}°`;
        }
        
        if (speedElement && this.localBoat) {
            speedElement.textContent = `Speed: ${this.localBoat.speed.toFixed(1)} knots`;
        }
        
        if (throttleElement && this.localBoat) {
            // Convert throttle from -0.5 to 1 range to percentage display
            let throttlePercent;
            if (this.localBoat.throttle >= 0) {
                // Forward throttle: 0-100%
                throttlePercent = Math.round(this.localBoat.throttle * 100);
                throttleElement.textContent = `Throttle: ${throttlePercent}% Forward`;
            } else {
                // Reverse throttle: 0-50%
                throttlePercent = Math.round(Math.abs(this.localBoat.throttle) * 100);
                throttleElement.textContent = `Throttle: ${throttlePercent}% Reverse`;
            }
        }
        
        if (rudderElement && this.localBoat) {
            const rudderAngle = Math.round(this.localBoat.rudderAngle);
            let turnDirection = "";
            
            if (rudderAngle < 0) {
                turnDirection = " Left";
            } else if (rudderAngle > 0) {
                turnDirection = " Right";
            }
            
            rudderElement.textContent = `Rudder: ${Math.abs(rudderAngle)}°${turnDirection}`;
        }
    }
    
    /**
     * Update race information in the UI
     */
    updateRaceInfo() {
        const positionElement = document.getElementById('position');
        const timerElement = document.getElementById('timer');
        
        if (positionElement) {
            // In multiplayer, this would show race position
            positionElement.textContent = 'Position: 1/1';
        }
        
        if (timerElement) {
            timerElement.textContent = _utils_js__WEBPACK_IMPORTED_MODULE_4__.formatTime(this.state.raceTime);
        }
    }
    
    /**
     * Update course information in the UI
     */
    updateCourseInfo() {
        const positionElement = document.getElementById('position');
        
        if (positionElement && this.course) {
            positionElement.textContent = `Buoy: ${this.course.currentBuoy + 1}/${this.course.buoys.length} - Lap: ${this.course.currentLap + 1}/${this.course.laps}`;
        }
    }
    
    /**
     * Update player information in the UI
     */
    updatePlayerInfo() {
        // In a real implementation, this would update player-specific UI elements
    }
    
    /**
     * Stop the game
     */
    stop() {
        if (!this.state.isRunning) return;
        
        console.log('Stopping game...');
        
        // Stop the renderer
        this.renderer.stop();
        
        // Set game state
        this.state.isRunning = false;
        
        // Disconnect multiplayer if active
        if (this.multiplayer.enabled && this.multiplayer.socket) {
            this.multiplayer.socket.disconnect();
        }
    }
    
    /**
     * Pause the game
     */
    pause() {
        if (!this.state.isRunning || this.state.isPaused) return;
        
        console.log('Pausing game...');
        this.state.isPaused = true;
    }
    
    /**
     * Resume the game
     */
    resume() {
        if (!this.state.isRunning || !this.state.isPaused) return;
        
        console.log('Resuming game...');
        this.state.isPaused = false;
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        this.stop();
        
        // Clean up all boats
        this.boats.forEach(boat => boat.dispose());
        this.boats.clear();
        
        // Clean up environment
        if (this.environment) {
            this.environment.dispose();
        }
        
        // Clean up renderer
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clean up controls
        if (this.controls) {
            this.controls.dispose();
        }
    }
}

// Export the Game class for use in other modules
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Game); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("2808e648c15689f5f7dd")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.ff6e551dad803cd25fd3.hot-update.js.map