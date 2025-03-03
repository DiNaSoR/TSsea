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
/* harmony import */ var three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! three/examples/jsm/controls/OrbitControls.js */ "./node_modules/three/examples/jsm/controls/OrbitControls.js");
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
        
        // Set up camera to follow the player's boat
        this.renderer.setupBoatCamera(this.localBoat);
        
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
     * Update game state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        if (!this.state.isRunning || this.state.isPaused) return;
        
        // Scale delta time to limit physics issues on slow framerates
        const scaledDeltaTime = Math.min(deltaTime, 0.033);
        
        // Update controls
        this.controls.update(scaledDeltaTime);
        
        // Update environment
        const environmentState = this.environment.update(scaledDeltaTime);
        
        // Update all boats
        this.boats.forEach(boat => {
            boat.update(environmentState, scaledDeltaTime);
        });
        
        // Check boat position against course markers
        if (this.localBoat && this.course) {
            this.checkCourseProgress();
        }
        
        // Update camera if following a boat
        this.renderer.updateBoatCamera();
        
        // Special handling for first-person view
        if (this.currentCameraView === 'first-person' && this.localBoat && this.localBoat.mesh) {
            this.updateFirstPersonCamera();
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
     * Update the first-person camera position and rotation
     */
    updateFirstPersonCamera() {
        if (!this.localBoat || !this.localBoat.mesh) return;
        
        const boatPosition = this.localBoat.position.clone();
        const boatQuaternion = this.localBoat.orientation.clone();
        const boatEuler = new THREE.Euler().setFromQuaternion(boatQuaternion);
        
        // Position camera at the boat's helm position
        const cameraOffset = new THREE.Vector3(0, 2, 1); // Slightly forward and above
        cameraOffset.applyEuler(boatEuler);
        
        this.renderer.camera.position.copy(boatPosition.clone().add(cameraOffset));
        
        // Look forward
        const lookAtOffset = new THREE.Vector3(0, 2, 10); // Look forward
        lookAtOffset.applyEuler(boatEuler);
        this.renderer.camera.lookAt(boatPosition.clone().add(lookAtOffset));
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
     * Send local boat updates to the server
     */
    sendUpdatesToServer() {
        if (!this.multiplayer.socket || !this.localBoat) return;
        
        // Get boat state
        const boatState = this.localBoat.update(
            this.environment.update(0), // Get current environment without updating
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
        
        // Handle camera view changes
        if (controls.cameraView && this.currentCameraView !== controls.cameraView) {
            this.setCameraView(controls.cameraView);
            console.log(`Camera view changed to: ${controls.cameraView}`);
        }
    }
    
    /**
     * Set the camera view
     * @param {string} view - Camera view type ('follow', 'overhead', 'first-person')
     */
    setCameraView(view) {
        if (!this.renderer || !this.localBoat) return;
        
        // Store the current camera view
        this.currentCameraView = view;
        
        switch (view) {
            case 'follow':
                this.renderer.setupBoatCamera(this.localBoat);
                this.renderer.followBoatMode = true;
                break;
                
            case 'overhead':
                // Reset to orbit controls
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                }
                
                // Use OrbitControls directly (not through THREE namespace)
                this.renderer.controls = new three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_5__.OrbitControls(
                    this.renderer.camera,
                    this.renderer.canvas
                );
                this.renderer.followBoatMode = false;
                
                // Set the camera position high above
                this.renderer.camera.position.set(0, 100, 0);
                this.renderer.camera.lookAt(0, 0, 0);
                
                // Update controls immediately
                this.renderer.controls.update();
                break;
                
            case 'first-person':
                this.renderer.setupBoatCamera(this.localBoat);
                this.renderer.followBoatMode = false;
                
                // Adjust camera position for first-person view
                if (this.localBoat && this.localBoat.mesh) {
                    const boatPosition = this.localBoat.position.clone();
                    const boatQuaternion = this.localBoat.orientation.clone();
                    const boatEuler = new THREE.Euler().setFromQuaternion(boatQuaternion);
                    
                    // Position camera at the boat's helm position
                    const cameraOffset = new THREE.Vector3(0, 2, 1); // Slightly forward and above
                    cameraOffset.applyEuler(boatEuler);
                    
                    this.renderer.camera.position.copy(boatPosition.clone().add(cameraOffset));
                    
                    // Look forward
                    const lookAtOffset = new THREE.Vector3(0, 2, 10); // Look forward
                    lookAtOffset.applyEuler(boatEuler);
                    this.renderer.camera.lookAt(boatPosition.clone().add(lookAtOffset));
                }
                break;

            case 'orbit':
                // Set up OrbitControls centered on the boat
                if (this.renderer.controls) {
                    this.renderer.controls.dispose();
                }
                
                // Use OrbitControls directly (not through THREE namespace)
                this.renderer.controls = new three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_5__.OrbitControls(
                    this.renderer.camera,
                    this.renderer.canvas
                );
                
                // Prevent the context menu on right-click
                this.renderer.canvas.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                }, false);
                
                // Configure the orbit controls for a boat-centric view
                this.renderer.controls.enableDamping = true;
                this.renderer.controls.dampingFactor = 0.1;
                this.renderer.controls.rotateSpeed = 0.7;
                this.renderer.controls.minDistance = 5;
                this.renderer.controls.maxDistance = 50;
                this.renderer.followBoatMode = true;
                
                // Set initial camera position relative to the boat
                const boatPosition = this.localBoat.position.clone();
                this.renderer.camera.position.set(
                    boatPosition.x - 10,
                    boatPosition.y + 8,
                    boatPosition.z - 10
                );
                
                // Set target to the boat
                this.renderer.controls.target.copy(boatPosition);
                
                // Make sure controls are updated immediately
                this.renderer.controls.update();
                break;
        }
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
        
        if (headingElement && this.localBoat) {
            headingElement.textContent = `Heading: ${Math.round(this.localBoat.heading)}°`;
        }
        
        if (speedElement && this.localBoat) {
            speedElement.textContent = `Speed: ${this.localBoat.speed.toFixed(1)} knots`;
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
/******/ 	__webpack_require__.h = () => ("fbccf153e00e2e2db542")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.e54e40ef5eeb0aa367bf.hot-update.js.map