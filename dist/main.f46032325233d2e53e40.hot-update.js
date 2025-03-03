"use strict";
self["webpackHotUpdateopensail"]("main",{

/***/ "./src/js/boat.js":
/*!************************!*\
  !*** ./src/js/boat.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/**
 * Boat class to handle boat physics and visualization
 */
 // Import all utility functions as Utils namespace

/**
 * Boat class representing a sailboat in the game
 */
class Boat {
    /**
     * Create a new Boat
     * @param {Object} options - Boat configuration options
     * @param {string} options.id - Unique identifier for the boat
     * @param {string} options.playerName - Name of the player controlling the boat
     * @param {THREE.Vector3} options.position - Initial position
     * @param {THREE.Quaternion} options.orientation - Initial orientation
     * @param {number} options.length - Boat length in meters
     * @param {number} options.width - Boat width in meters
     * @param {THREE.Scene} options.scene - Three.js scene to add the boat to
     */
    constructor(options) {
        this.id = options.id || 'boat_' + Math.random().toString(36).substr(2, 9);
        this.playerName = options.playerName || 'Player';
        
        // Physics properties
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.orientation = options.orientation || new THREE.Quaternion();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.angularVelocity = new THREE.Vector3(0, 0, 0);
        
        // Boat dimensions
        this.length = options.length || 6; // meters
        this.width = options.width || 2; // meters
        this.height = 2.5; // meters
        
        // Control properties
        this.rudderAngle = 0; // degrees, -45 to 45
        this.sailAngle = 0; // degrees, -90 to 90
        
        // Boat state
        this.heading = 0; // degrees, 0-359
        this.speed = 0; // knots
        
        // Physics constants (will be tuned)
        this.mass = 1000; // kg
        this.dragCoefficient = 0.05;
        this.sailForceCoefficient = 30;
        this.rudderForceCoefficient = 15;
        this.lateralResistanceCoefficient = 50;
        
        // 3D model properties
        this.mesh = null;
        this.scene = options.scene;
        
        // Initialize the 3D model
        this.initMesh();
    }
    
    /**
     * Initialize the 3D mesh for the boat
     */
    initMesh() {
        try {
            // Use GLTFLoader for loading .glb models
            const loader = new GLTFLoader();
            
            // Try with multiple path formats
            const modelPaths = [
                window.ASSET_PATH.models + 'boat.glb',     // Using configured path
                '/assets/models/boat.glb',                 // Absolute path from root
                'assets/models/boat.glb',                  // No leading slash
                './assets/models/boat.glb'                 // Relative path with dot
            ];
            
            console.log("Attempting to load boat model with paths:", modelPaths);
            
            // First check if the file exists using fetch
            fetch(modelPaths[0])
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`File not accessible (status ${response.status})`);
                    }
                    console.log("boat.glb is accessible via fetch at:", modelPaths[0]);
                    // File exists, proceed with GLTFLoader
                    return this.loadModelWithLoader(modelPaths[0]);
                })
                .catch(error => {
                    console.error("Fetch failed:", error);
                    console.log("Trying alternate loading methods...");
                    this.tryNextPath(modelPaths, 1);
                });
        } catch (e) {
            console.error("Exception in initMesh:", e);
            this.createFallbackBoat();
        }
    }
    
    /**
     * Load model with GLTFLoader
     */
    loadModelWithLoader(modelPath) {
        const loader = new GLTFLoader();
        console.log("Loading boat model using GLTFLoader with path:", modelPath);
        
        return new Promise((resolve, reject) => {
            loader.load(
                modelPath,
                (gltf) => {
                    console.log("Boat model loaded successfully with path:", modelPath);
                    this.mesh = gltf.scene;
                    
                    // Log the loaded model structure to help with debugging
                    console.log("GLTF model structure:", gltf);
                    
                    // Set initial position and orientation
                    this.mesh.position.copy(this.position);
                    this.mesh.quaternion.copy(this.orientation);
                    
                    // Rotate the boat model 180 degrees around the Y axis
                    this.mesh.rotation.y = Math.PI; // 180 degrees in radians
                    
                    // Set a proper scale for the boat
                    const scale = 0.5; // Start with a moderate scale, adjust based on model size
                    this.mesh.scale.set(scale, scale, scale);
                    
                    // Lower the boat position to reduce hovering
                    this.mesh.position.y -= 0.5; // Adjust this value as needed
                    
                    // Add boat to scene
                    if (this.scene) {
                        this.scene.add(this.mesh);
                        console.log("Boat added to scene successfully");
                    } else {
                        console.error("Scene not available, cannot add boat mesh");
                    }
                    
                    // Create player name label
                    this.createPlayerLabel();
                    
                    // Add the sail
                    this.addSail();
                    
                    // Set up shadows
                    this.setupShadows();
                    
                    // Log success
                    console.log(`Boat for ${this.playerName} loaded`);
                    resolve(this.mesh);
                },
                // onProgress callback
                (xhr) => {
                    if (xhr.total && xhr.total > 0) {
                        console.log((xhr.loaded / xhr.total * 100) + '% of boat model loaded');
                    } else {
                        console.log(`Loaded ${xhr.loaded} bytes`);
                    }
                },
                // onError callback
                (error) => {
                    console.error("GLTFLoader failed with path:", modelPath, error);
                    reject(error);
                }
            );
        });
    }
    
    /**
     * Try loading the model with the next available path
     */
    tryNextPath(paths, index) {
        if (index >= paths.length) {
            console.error("All paths failed, creating fallback boat");
            this.createFallbackBoat();
            return;
        }
        
        const modelPath = paths[index];
        console.log("Trying alternate path:", modelPath);
        
        const loader = new GLTFLoader();
        loader.load(
            modelPath,
            (gltf) => {
                console.log("Boat model loaded successfully with alternate path:", modelPath);
                this.mesh = gltf.scene;
                
                // Set initial position and orientation
                this.mesh.position.copy(this.position);
                this.mesh.quaternion.copy(this.orientation);
                
                // Rotate the boat model 180 degrees around the Y axis
                this.mesh.rotation.y = Math.PI; // 180 degrees in radians
                
                // Set a proper scale for the boat
                const scale = 0.5; // Adjusted scale for better visibility
                this.mesh.scale.set(scale, scale, scale);
                
                // Lower the boat position to reduce hovering
                this.mesh.position.y -= 0.5; // Adjust this value as needed
                
                // Add to scene
                if (this.scene) {
                    this.scene.add(this.mesh);
                    console.log("Boat added to scene with alternate path");
                } else {
                    console.error("Scene not available for alternate path loading");
                }
                
                // Create player name label
                this.createPlayerLabel();
                
                // Add the sail
                this.addSail();
                
                // Set up shadows
                this.setupShadows();
                
                // Log success
                console.log(`Boat for ${this.playerName} loaded with alternate path`);
            },
            // onProgress callback
            (xhr) => {
                if (xhr.total && xhr.total > 0) {
                    console.log((xhr.loaded / xhr.total * 100) + '% of boat model loaded (alternate path)');
                }
            },
            // onError callback
            (error) => {
                console.error(`Error loading boat model with path ${modelPath}:`, error);
                // Try the next path
                this.tryNextPath(paths, index + 1);
            }
        );
    }
    
    /**
     * Load the boat texture (now handled by GLTFLoader for glb files)
     */
    loadTexture() {
        // GLB files already include textures, so this method is not needed
        // We'll keep it as a placeholder in case custom textures are needed later
        console.log("Using textures embedded in the GLB file");
    }
    
    /**
     * Create a simple fallback mesh if the model fails to load
     */
    createFallbackBoat() {
        // Create a simple boat shape using primitive geometries
        const boatGroup = new THREE.Group();
        
        // Hull
        const hullGeometry = new THREE.BoxGeometry(this.length, this.height / 2, this.width);
        const hullMaterial = new THREE.MeshPhongMaterial({ color: 0x3366ff });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = -this.height / 4;
        boatGroup.add(hull);
        
        // Cabin
        const cabinGeometry = new THREE.BoxGeometry(this.length / 3, this.height / 2, this.width * 0.8);
        const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(0, this.height / 4, 0);
        boatGroup.add(cabin);
        
        // Mast
        const mastGeometry = new THREE.CylinderGeometry(0.05, 0.05, this.height * 2, 8);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x999999 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(0, this.height, 0);
        boatGroup.add(mast);
        
        // Sail
        this.sail = new THREE.Group();
        const sailGeometry = new THREE.PlaneGeometry(this.length * 0.7, this.height * 1.5);
        const sailMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        const sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
        sailMesh.position.set(this.length * 0.2, 0, 0);
        sailMesh.rotation.y = Math.PI / 2;
        this.sail.add(sailMesh);
        this.sail.position.set(0, this.height * 0.75, 0);
        boatGroup.add(this.sail);
        
        // Center the boat
        boatGroup.position.copy(this.position);
        boatGroup.quaternion.copy(this.orientation);
        
        // Set as the boat mesh
        this.mesh = boatGroup;
        
        // Add to scene
        if (this.scene) {
            this.scene.add(this.mesh);
        }
        
        // Create player name label
        this.createPlayerLabel();
        
        console.log(`Fallback boat for ${this.playerName} created`);
    }
    
    /**
     * Create a text label showing the player name
     */
    createPlayerLabel() {
        // This would typically use a sprite with a dynamically generated texture
        // For simplicity, we'll omit the actual implementation for now
    }
    
    /**
     * Update the boat physics
     * @param {Object} environment - Environment information including wind and waves
     * @param {number} deltaTime - Time step in seconds
     */
    update(environment, deltaTime) {
        // Skip physics if deltaTime is too large (e.g., after pausing)
        if (deltaTime > 0.1) deltaTime = 0.1;
        
        // Get environment info
        const { wind, waves } = environment;
        
        // Calculate forces
        const forces = this.calculateForces(wind, waves);
        
        // Apply acceleration based on forces
        const acceleration = forces.clone().divideScalar(this.mass);
        
        // Update velocity (v = v0 + a * t)
        this.velocity.add(acceleration.clone().multiplyScalar(deltaTime));
        
        // Apply drag (simplified)
        this.velocity.multiplyScalar(1 - this.dragCoefficient * deltaTime);
        
        // Update position (p = p0 + v * t)
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Apply angular velocity
        const rotationAxis = new THREE.Vector3(0, 1, 0);
        const rotationAngle = this.angularVelocity.y * deltaTime;
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
        this.orientation.premultiply(rotationQuaternion);
        this.orientation.normalize();
        
        // Update heading (in degrees)
        const euler = new THREE.Euler().setFromQuaternion(this.orientation);
        this.heading = _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(_utils_js__WEBPACK_IMPORTED_MODULE_0__.radToDeg(euler.y) * -1);
        
        // Calculate speed in knots (1 m/s ≈ 1.94 knots)
        this.speed = this.velocity.length() * 1.94;
        
        // Apply wave effects on boat position and rotation
        this.applyWaveEffects(waves, deltaTime);
        
        // Update 3D model if it exists
        this.updateMesh();
        
        // Return state for networking
        return {
            id: this.id,
            position: this.position.toArray(),
            orientation: [this.orientation.x, this.orientation.y, this.orientation.z, this.orientation.w],
            velocity: this.velocity.toArray(),
            heading: this.heading,
            speed: this.speed,
            sailAngle: this.sailAngle,
            rudderAngle: this.rudderAngle
        };
    }
    
    /**
     * Calculate all forces acting on the boat
     * @param {Object} wind - Wind information
     * @param {Object} waves - Wave information
     * @returns {THREE.Vector3} Net force acting on the boat
     */
    calculateForces(wind, waves) {
        // Convert heading to radians and get direction vector
        const headingRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.heading);
        const boatDirection = new THREE.Vector3(
            Math.sin(headingRad),
            0,
            Math.cos(headingRad)
        );
        
        // Calculate apparent wind (wind relative to boat)
        const apparentWind = _utils_js__WEBPACK_IMPORTED_MODULE_0__.calculateApparentWind(
            new THREE.Vector3(wind.x, wind.y, wind.z),
            this.velocity
        );
        
        // Calculate sail force
        const sailForce = this.calculateSailForce(apparentWind, boatDirection);
        
        // Calculate rudder force
        const rudderForce = this.calculateRudderForce(boatDirection);
        
        // Calculate lateral resistance (keeps boat from sliding sideways)
        const lateralResistanceForce = this.calculateLateralResistance();
        
        // Sum all forces
        const netForce = new THREE.Vector3(0, 0, 0)
            .add(sailForce)
            .add(rudderForce)
            .add(lateralResistanceForce);
            
        return netForce;
    }
    
    /**
     * Calculate force generated by the sail
     * @param {THREE.Vector3} apparentWind - Apparent wind vector
     * @param {THREE.Vector3} boatDirection - Boat's forward direction
     * @returns {THREE.Vector3} Sail force
     */
    calculateSailForce(apparentWind, boatDirection) {
        // Calculate relative angle between wind and boat heading
        const boatAngle = Math.atan2(boatDirection.x, boatDirection.z);
        const windAngle = Math.atan2(apparentWind.x, apparentWind.z);
        const relativeWindAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.normalizeAngle(_utils_js__WEBPACK_IMPORTED_MODULE_0__.radToDeg(windAngle - boatAngle));
        
        // Adjust the sail angle based on relative wind (auto-trim)
        // In a real implementation, the player would control this
        const optimalSailAngle = this.calculateOptimalSailAngle(relativeWindAngle);
        this.sailAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.lerp(this.sailAngle, optimalSailAngle, 0.1);
        
        // Calculate effective sail angle (relative wind angle - sail angle)
        const effectiveSailAngle = Math.abs(relativeWindAngle - this.sailAngle);
        
        // Calculate sail force coefficient (simplified sail physics)
        // Max force at ~45 degrees to the wind, minimal when sailing directly into or away from wind
        let sailForceCoef = Math.sin(_utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(effectiveSailAngle) * 2);
        sailForceCoef = Math.max(0, sailForceCoef); // No negative force
        
        // Scale by wind strength
        const windStrength = apparentWind.length();
        const forceMagnitude = this.sailForceCoefficient * sailForceCoef * windStrength;
        
        // Apply force in boat's forward direction (simplified)
        return boatDirection.clone().multiplyScalar(forceMagnitude);
    }
    
    /**
     * Calculate optimal sail angle for current wind
     * @param {number} relativeWindAngle - Angle between wind and boat heading
     * @returns {number} Optimal sail angle in degrees
     */
    calculateOptimalSailAngle(relativeWindAngle) {
        // Simplified optimal sail angle calculation
        // In a real sailing sim, this would be more complex
        if (relativeWindAngle > 180) {
            // Wind from port side
            return _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(relativeWindAngle - 180, -80, 0);
        } else {
            // Wind from starboard side
            return _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(relativeWindAngle, 0, 80);
        }
    }
    
    /**
     * Calculate force generated by the rudder
     * @param {THREE.Vector3} boatDirection - Boat's forward direction
     * @returns {THREE.Vector3} Rudder torque as a force
     */
    calculateRudderForce(boatDirection) {
        // Rudder effect increases with boat speed
        const rudderEffectiveness = this.speed * 0.1;
        
        // Calculate angular force from rudder
        this.angularVelocity.y = this.rudderAngle * this.rudderForceCoefficient * 
                               rudderEffectiveness * 0.001;
                               
        // Return zero force (rudder affects angular velocity)
        return new THREE.Vector3(0, 0, 0);
    }
    
    /**
     * Calculate lateral resistance force that prevents sideways slipping
     * @returns {THREE.Vector3} Lateral resistance force
     */
    calculateLateralResistance() {
        // Get boat's right vector
        const headingRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.heading);
        const rightVector = new THREE.Vector3(
            -Math.cos(headingRad),
            0,
            Math.sin(headingRad)
        );
        
        // Calculate lateral component of velocity
        const lateralVelocity = rightVector.clone().multiplyScalar(
            rightVector.dot(this.velocity)
        );
        
        // Apply resistance proportional to lateral velocity
        return lateralVelocity.clone().multiplyScalar(-this.lateralResistanceCoefficient);
    }
    
    /**
     * Apply wave effects to the boat
     * @param {Object} waves - Wave information
     * @param {number} deltaTime - Time step in seconds
     */
    applyWaveEffects(waves, deltaTime) {
        if (!waves || !waves.isActive) return;
        
        // Calculate wave height at boat position
        const waveHeight = this.calculateWaveHeight(this.position, waves, Date.now() / 1000);
        
        // Adjust boat position based on wave height
        this.position.y = waveHeight;
        
        // Calculate wave slope at boat position for pitch and roll
        const slopeX = this.calculateWaveSlope(this.position, waves, Date.now() / 1000, 'x');
        const slopeZ = this.calculateWaveSlope(this.position, waves, Date.now() / 1000, 'z');
        
        // Apply pitch and roll based on wave slope
        const targetRotation = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(-slopeZ * 0.5, _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.heading) * -1, slopeX * 0.5)
        );
        
        // Smoothly interpolate rotation
        this.orientation.slerp(targetRotation, 2 * deltaTime);
    }
    
    /**
     * Calculate wave height at a given position
     * @param {THREE.Vector3} position - Position to calculate height at
     * @param {Object} waves - Wave parameters
     * @param {number} time - Current time
     * @returns {number} Wave height
     */
    calculateWaveHeight(position, waves, time) {
        // Simple sin wave function
        // In a real implementation, would use a sum of multiple sine waves
        const x = position.x;
        const z = position.z;
        const amplitude = waves.amplitude || 0.5;
        const frequency = waves.frequency || 0.2;
        const direction = waves.direction || 0;
        const speed = waves.speed || 1;
        
        // Calculate directed coordinates
        const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(direction);
        const dx = x * Math.cos(dirRad) + z * Math.sin(dirRad);
        
        // Calculate height using sin wave
        return amplitude * Math.sin(dx * frequency + time * speed);
    }
    
    /**
     * Calculate wave slope at a given position
     * @param {THREE.Vector3} position - Position to calculate slope at
     * @param {Object} waves - Wave parameters
     * @param {number} time - Current time
     * @param {string} axis - Axis to calculate slope for ('x' or 'z')
     * @returns {number} Wave slope
     */
    calculateWaveSlope(position, waves, time, axis) {
        // Sample height at two nearby points to calculate slope
        const delta = 0.1;
        let pos1 = position.clone();
        let pos2 = position.clone();
        
        if (axis === 'x') {
            pos1.x -= delta;
            pos2.x += delta;
        } else {
            pos1.z -= delta;
            pos2.z += delta;
        }
        
        const height1 = this.calculateWaveHeight(pos1, waves, time);
        const height2 = this.calculateWaveHeight(pos2, waves, time);
        
        return (height2 - height1) / (2 * delta);
    }
    
    /**
     * Update the 3D mesh based on current state
     */
    updateMesh() {
        if (!this.mesh) return;
        
        // Update position and orientation
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.orientation);
        
        // Update sail rotation if we have a sail object
        if (this.sail) {
            this.sail.rotation.y = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.sailAngle);
        }
    }
    
    /**
     * Set boat controls
     * @param {Object} controls - Control inputs
     * @param {number} controls.rudderAngle - Rudder angle (-45 to 45 degrees)
     * @param {number} controls.sailAngle - Sail angle (-90 to 90 degrees)
     */
    setControls(controls) {
        if (controls.rudderAngle !== undefined) {
            this.rudderAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(controls.rudderAngle, -45, 45);
        }
        
        if (controls.sailAngle !== undefined) {
            this.sailAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(controls.sailAngle, -90, 90);
        }
    }
    
    /**
     * Handle server update for client-side interpolation
     * @param {Object} state - Boat state from server
     */
    handleServerUpdate(state) {
        // Update position and orientation for interpolation
        this.serverPosition = new THREE.Vector3().fromArray(state.position);
        this.serverOrientation = new THREE.Quaternion(
            state.orientation[0],
            state.orientation[1],
            state.orientation[2],
            state.orientation[3]
        );
        this.serverVelocity = new THREE.Vector3().fromArray(state.velocity);
        this.heading = state.heading;
        this.speed = state.speed;
        
        // Directly update controls
        this.sailAngle = state.sailAngle;
        this.rudderAngle = state.rudderAngle;
    }
    
    /**
     * Interpolate between current and server state
     * @param {number} alpha - Interpolation factor (0-1)
     */
    interpolate(alpha) {
        if (!this.serverPosition || !this.serverOrientation) return;
        
        // Interpolate position
        this.position.lerp(this.serverPosition, alpha);
        
        // Interpolate orientation
        this.orientation.slerp(this.serverOrientation, alpha);
        
        // Update mesh
        this.updateMesh();
    }
    
    /**
     * Remove boat from scene and clean up resources
     */
    dispose() {
        if (this.mesh && this.scene) {
            this.scene.remove(this.mesh);
            
            // Dispose geometries and materials
            if (this.mesh.traverse) {
                this.mesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) {
                        if (Array.isArray(child.material)) {
                            child.material.forEach(material => material.dispose());
                        } else {
                            child.material.dispose();
                        }
                    }
                });
            }
        }
    }
    
    /**
     * Add a sail to the loaded boat model
     * For GLB models, this is optional as the model may already have a sail
     */
    addSail() {
        // Check if we're using a fallback boat (which already has a sail added in createFallbackBoat)
        if (this.sail) {
            console.log("Sail already exists on the boat");
            return;
        }

        console.log("Adding sail to loaded boat model");
        
        // Create a sail group
        this.sail = new THREE.Group();
        
        // Check if we're using a loaded model or need to create a sail
        if (this.mesh && this.mesh.type === "Group") {
            // For loaded models, we'll first check if it already has a sail
            let existingSail = false;
            this.mesh.traverse(child => {
                // Look for parts that might be a sail based on name or position
                if (child.name && child.name.toLowerCase().includes('sail')) {
                    console.log("Found existing sail in the model:", child.name);
                    existingSail = true;
                }
            });
            
            if (existingSail) {
                console.log("Using existing sail from the 3D model");
                return;
            }
            
            // If no sail found, create a simple one
            const sailGeometry = new THREE.PlaneGeometry(this.length * 0.7, this.height * 1.5);
            const sailMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xffffff,
                side: THREE.DoubleSide
            });
            const sailMesh = new THREE.Mesh(sailGeometry, sailMaterial);
            sailMesh.position.set(0, this.height * 0.75, 0);
            sailMesh.rotation.y = Math.PI / 2;
            this.sail.add(sailMesh);
            
            // Add the sail to the boat mesh
            this.mesh.add(this.sail);
            console.log("Added new sail to the boat model");
        }
    }
    
    /**
     * Set up shadows for the boat
     */
    setupShadows() {
        if (!this.mesh) return;
        
        // Add shadow casting/receiving to all meshes
        this.mesh.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        console.log("Shadows set up for the boat");
    }
}

// Export the Boat class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Boat); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("2ca9d6ece3af7fce45e1")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.f46032325233d2e53e40.hot-update.js.map