"use strict";
self["webpackHotUpdateopensail"]("main",{

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
        
        // Output debug information
        console.log("Game components:", {
            renderer: !!this.renderer,
            environment: !!this.environment,
            localBoat: !!this.localBoat,
            controls: !!this.controls,
            course: !!this.course,
            state: this.state
        });
        
        if (this.localBoat) {
            console.log("Boat initial state:", {
                position: this.localBoat.position,
                velocity: this.localBoat.velocity,
                rudderAngle: this.localBoat.rudderAngle,
                throttle: this.localBoat.throttle,
                mesh: !!this.localBoat.mesh
            });
        }
        
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
            // Make sure we're passing a valid environment state
            const validEnvironmentState = environmentState || {
                wind: { direction: 0, speed: 0 },
                waves: { isActive: true, amplitude: 0.5, frequency: 0.2, direction: 0, speed: 1 }
            };
            
            boat.update(validEnvironmentState, scaledDeltaTime);
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
            this.localBoat.setControls({
                rudderAngle: controls.rudderAngle,
                throttle: controls.throttle
            });
            
            // Add debug output to verify controls are changing
            console.log("Controls updated:", controls.rudderAngle, controls.throttle);
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
/******/ 	__webpack_require__.h = () => ("753401aab3f1aba0cf6a")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.4786c1d770f6619e1887.hot-update.js.map