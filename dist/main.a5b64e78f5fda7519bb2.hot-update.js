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
                
            // Create boat wake
            this.createBoatWake();
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
        
        // Create water splash effects when the boat is moving fast enough
        if (this.speed > 2 && Math.random() < 0.05) {
            // Create a new splash effect at random intervals
            if (!this.splashParticles) {
                this.createWaterSplash();
            }
        }
        
        // Update existing water splash
        if (this.splashParticles) {
            this.updateWaterSplash(deltaTime);
        }
        
        // Update boat wake
        this.updateBoatWake();
        
        // Apply wave effects on boat position and rotation
        this.applyWaveEffects(waves, deltaTime);
        
        // Update 3D model if it exists
        this.updateMesh();
        
        // Return state for networking
        return {
            id: this.id,
            position: this.position.clone(),
            orientation: this.orientation.clone(),
            velocity: this.velocity.clone(),
            angularVelocity: this.angularVelocity.clone(),
            rudderAngle: this.rudderAngle,
            sailAngle: this.sailAngle,
            heading: this.heading,
            speed: this.speed
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
    
    /**
     * Create a water splash effect
     */
    createWaterSplash() {
        if (!this.scene) return;
        
        // Create a splash particle system
        const splashGeometry = new THREE.BufferGeometry();
        const splashMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        // Create particles
        const particleCount = 50;
        const positions = new Float32Array(particleCount * 3);
        
        // Initialize particles at the boat position
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            positions[i3] = this.position.x + (Math.random() - 0.5) * this.width * 0.5;
            positions[i3 + 1] = 0; // At water level
            positions[i3 + 2] = this.position.z + (Math.random() - 0.5) * this.length * 0.5;
        }
        
        splashGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create the particle system
        this.splashParticles = new THREE.Points(splashGeometry, splashMaterial);
        this.scene.add(this.splashParticles);
        
        // Store particle velocities
        this.splashVelocities = [];
        for (let i = 0; i < particleCount; i++) {
            this.splashVelocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: Math.random() * 0.2,
                z: (Math.random() - 0.5) * 0.1
            });
        }
        
        // Set splash lifetime
        this.splashLifetime = 1; // seconds
        this.splashTimer = 0;
    }
    
    /**
     * Update the water splash effect
     * @param {number} deltaTime - Time since last update in seconds
     */
    updateWaterSplash(deltaTime) {
        if (!this.splashParticles) return;
        
        // Increment splash timer
        this.splashTimer += deltaTime;
        
        // If the splash has lived its lifetime, remove it
        if (this.splashTimer >= this.splashLifetime) {
            this.scene.remove(this.splashParticles);
            this.splashParticles.geometry.dispose();
            this.splashParticles.material.dispose();
            this.splashParticles = null;
            this.splashVelocities = null;
            return;
        }
        
        // Update particle positions based on velocity
        const positions = this.splashParticles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Update position based on velocity
            positions[i3] += this.splashVelocities[i].x;
            positions[i3 + 1] += this.splashVelocities[i].y;
            positions[i3 + 2] += this.splashVelocities[i].z;
            
            // Apply gravity to y velocity
            this.splashVelocities[i].y -= 0.01;
        }
        
        // Update particle opacity based on lifetime
        const progress = this.splashTimer / this.splashLifetime;
        this.splashParticles.material.opacity = 0.8 * (1 - progress);
        
        // Mark the attribute as needing an update
        this.splashParticles.geometry.attributes.position.needsUpdate = true;
    }
    
    /**
     * Create a wake trail behind the boat
     */
    createBoatWake() {
        if (!this.scene) return;
        
        // Create a curved wake trail using a simple mesh
        const wakeWidth = this.width * 1.5;
        const wakeLength = this.length * 4;
        
        // Create wake geometry
        const wakeGeometry = new THREE.PlaneGeometry(wakeWidth, wakeLength, 8, 16);
        
        // Create wake material with transparency
        const wakeMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        // Create wake mesh
        this.wakeMesh = new THREE.Mesh(wakeGeometry, wakeMaterial);
        
        // Position wake behind the boat at water level
        this.wakeMesh.position.y = 0.05; // Slightly above water to avoid z-fighting
        this.wakeMesh.rotation.x = Math.PI / 2; // Lay flat on water
        
        // Add to scene
        this.scene.add(this.wakeMesh);
    }
    
    /**
     * Update the boat wake
     */
    updateBoatWake() {
        if (!this.wakeMesh) return;
        
        // Position wake behind the boat
        const boatPosition = this.position.clone();
        const boatDirection = new THREE.Vector3(0, 0, -1);
        boatDirection.applyQuaternion(this.orientation);
        
        // Offset wake behind the boat
        const wakeOffset = boatDirection.clone().multiplyScalar(-this.length);
        this.wakeMesh.position.copy(boatPosition.clone().add(wakeOffset));
        this.wakeMesh.position.y = 0.05; // Keep at water level
        
        // Orient wake to match boat direction
        this.wakeMesh.quaternion.copy(this.orientation);
        this.wakeMesh.rotation.x = Math.PI / 2; // Make sure it stays flat
        
        // Adjust opacity based on speed
        const maxOpacity = 0.3;
        const speedFactor = Math.min(this.speed / 10, 1); // Max opacity at 10 knots
        this.wakeMesh.material.opacity = maxOpacity * speedFactor;
    }
}

// Export the Boat class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Boat); 

/***/ }),

/***/ "./src/js/controls.js":
/*!****************************!*\
  !*** ./src/js/controls.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/**
 * Controls class to handle user input
 */
 // Import all utility functions as Utils namespace

class Controls {
    /**
     * Create a new Controls instance
     * @param {Object} options - Controls configuration options
     * @param {Function} options.onControlsChange - Callback for control changes
     */
    constructor(options = {}) {
        // Control state
        this.state = {
            rudderAngle: 0, // -45 to 45 degrees
            sailAngle: 0, // -90 to 90 degrees
            throttle: 0, // 0 to 1 (for motor, if implemented)
            cameraView: 'orbit', // Only orbit mode is now used
            trim: 0, // Auto-trim control (0-1)
        };
        
        // Control sensitivity
        this.rudderSensitivity = 5; // Degrees per keypress/update
        this.sailSensitivity = 10; // Degrees per keypress/update
        
        // Keys currently pressed
        this.keys = {};
        
        // Callback when controls change
        this.onControlsChange = options.onControlsChange || (() => {});
        
        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.update = this.update.bind(this);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    /**
     * Set up event listeners for keyboard and touch
     */
    setupEventListeners() {
        // Keyboard events
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);
        
        // We could add touch/gamepad controls later
    }
    
    /**
     * Handle key down events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyDown(event) {
        this.keys[event.key] = true;
        
        // Prevent default for game control keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
            event.preventDefault();
        }
        
        // Camera view changes - removed since we only use orbit mode now
    }
    
    /**
     * Handle key up events
     * @param {KeyboardEvent} event - Keyboard event
     */
    handleKeyUp(event) {
        this.keys[event.key] = false;
    }
    
    /**
     * Update controls based on current key state
     * @param {number} deltaTime - Time since last update in seconds
     */
    update(deltaTime) {
        let controlsChanged = false;
        
        // Calculate rudder input from keyboard
        let rudderInput = 0;
        if (this.keys['ArrowLeft'] || this.keys['a']) rudderInput -= 1;
        if (this.keys['ArrowRight'] || this.keys['d']) rudderInput += 1;
        
        // Apply rudder input
        if (rudderInput !== 0) {
            const newRudderAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(
                this.state.rudderAngle + rudderInput * this.rudderSensitivity,
                -45,
                45
            );
            
            if (newRudderAngle !== this.state.rudderAngle) {
                this.state.rudderAngle = newRudderAngle;
                controlsChanged = true;
            }
        } else {
            // Return rudder to center when not actively turning
            if (this.state.rudderAngle !== 0) {
                const returnRate = 15 * deltaTime; // Degrees per second
                
                if (Math.abs(this.state.rudderAngle) < returnRate) {
                    this.state.rudderAngle = 0;
                } else if (this.state.rudderAngle > 0) {
                    this.state.rudderAngle -= returnRate;
                } else {
                    this.state.rudderAngle += returnRate;
                }
                
                controlsChanged = true;
            }
        }
        
        // Calculate sail input from keyboard
        let sailInput = 0;
        if (this.keys['ArrowUp'] || this.keys['w']) sailInput -= 1; // Tighten sail
        if (this.keys['ArrowDown'] || this.keys['s']) sailInput += 1; // Loosen sail
        
        // Apply sail input
        if (sailInput !== 0) {
            const newSailAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(
                this.state.sailAngle + sailInput * this.sailSensitivity,
                -90,
                90
            );
            
            if (newSailAngle !== this.state.sailAngle) {
                this.state.sailAngle = newSailAngle;
                controlsChanged = true;
            }
        }
        
        // Notify if controls changed
        if (controlsChanged) {
            this.notifyControlChange();
        }
    }
    
    /**
     * Notify callback about control changes
     */
    notifyControlChange() {
        this.onControlsChange({
            rudderAngle: this.state.rudderAngle,
            sailAngle: this.state.sailAngle,
            throttle: this.state.throttle,
            cameraView: this.state.cameraView,
            trim: this.state.trim,
        });
    }
    
    /**
     * Reset controls to default state
     */
    reset() {
        this.state = {
            rudderAngle: 0,
            sailAngle: 0,
            throttle: 0,
            cameraView: 'orbit',
            trim: 0,
        };
        
        this.notifyControlChange();
    }
    
    /**
     * Clean up by removing event listeners
     */
    dispose() {
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
    }
}

// Export the Controls class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Controls); 

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
        
        // We no longer need to handle camera view changes since we only use orbit mode
    }
    
    /**
     * Set camera view
     * @param {string} view - Camera view type
     */
    setCameraView(view) {
        if (!this.renderer || !this.localBoat) return;
        
        // We only support orbit mode now
        this.currentCameraView = 'orbit';
        
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

/***/ }),

/***/ "./src/js/renderer.js":
/*!****************************!*\
  !*** ./src/js/renderer.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/* harmony import */ var three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! three/examples/jsm/controls/OrbitControls.js */ "./node_modules/three/examples/jsm/controls/OrbitControls.js");
/**
 * Renderer class to handle THREE.js setup and rendering
 */
 // Import all utility functions as Utils namespace


/**
 * Renderer class to handle all rendering and camera logic
 */
class Renderer {
    /**
     * Create a new Renderer
     * @param {Object} options - Renderer configuration options
     * @param {HTMLCanvasElement} options.canvas - Canvas element to render to
     */
    constructor(options = {}) {
        this.canvas = options.canvas || document.createElement('canvas');
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        
        // Create the Three.js scene
        this.scene = new THREE.Scene();
        
        // Create the camera
        this.camera = new THREE.PerspectiveCamera(
            75, // Field of view
            this.width / this.height, // Aspect ratio
            0.1, // Near plane
            5000 // Far plane
        );
        
        // Set initial camera position
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);
        
        // Create the WebGL renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Add basic lighting
        this.setupLighting();
        
        // Add controls for camera movement
        this.setupControls();
        
        // Add a grid helper for development
        if (options.debug) {
            const gridHelper = new THREE.GridHelper(1000, 100);
            this.scene.add(gridHelper);
            
            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Animation frame request ID
        this.animationFrameId = null;
        
        // Track performance with stats if in debug mode
        if (options.debug && window.Stats) {
            this.stats = new Stats();
            document.body.appendChild(this.stats.dom);
        }
    }
    
    /**
     * Set up scene lighting
     */
    setupLighting() {
        // Add ambient light - increased intensity for better visibility
        const ambientLight = new THREE.AmbientLight(0x404040, 0.7);
        this.scene.add(ambientLight);
        
        // Add directional light (sun)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(50, 100, -50);
        this.sunLight.castShadow = true;
        
        // Configure shadow properties
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        
        this.scene.add(this.sunLight);
        
        // Add a second directional light from the opposite side for fill
        const fillLight = new THREE.DirectionalLight(0xffffcc, 0.5);
        fillLight.position.set(-50, 75, 50);
        this.scene.add(fillLight);
        
        // Set up shadow rendering
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    /**
     * Set up camera controls
     */
    setupControls() {
        // We'll use OrbitControls for development/testing
        if (THREE.OrbitControls) {
            this.controls = new THREE.OrbitControls(this.camera, this.canvas);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 100;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
        }
    }
    
    /**
     * Set up event listeners for window resize
     */
    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        // Prevent context menu on right-click for the entire canvas
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        }, false);
    }
    
    /**
     * Handle window resize
     */
    handleResize() {
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
    }
    
    /**
     * Start the rendering loop
     * @param {Function} updateCallback - Function to call each frame before rendering
     */
    start(updateCallback) {
        if (this.animationFrameId !== null) return;
        
        let lastTime = 0;
        
        const animate = (time) => {
            this.animationFrameId = requestAnimationFrame(animate);
            
            // Calculate delta time in seconds
            const now = time * 0.001; // Convert to seconds
            const deltaTime = Math.min(now - lastTime, 0.1); // Cap at 100ms
            lastTime = now;
            
            // Update stats if available
            if (this.stats) this.stats.begin();
            
            // Run the update callback
            if (updateCallback) updateCallback(deltaTime);
            
            // Update controls if available
            if (this.controls) this.controls.update();
            
            // Render the scene
            this.renderer.render(this.scene, this.camera);
            
            // End stats measurement
            if (this.stats) this.stats.end();
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }
    
    /**
     * Stop the rendering loop
     */
    stop() {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Add an object to the scene
     * @param {THREE.Object3D} object - Object to add to the scene
     */
    addObject(object) {
        this.scene.add(object);
    }
    
    /**
     * Remove an object from the scene
     * @param {THREE.Object3D} object - Object to remove from the scene
     */
    removeObject(object) {
        this.scene.remove(object);
    }
    
    /**
     * Set up a camera to follow a boat
     * @param {Boat} boat - Boat to follow
     */
    setupBoatCamera(boat) {
        this.followBoat = boat;
        
        // Remove orbit controls if they exist
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        
        // By default, set followBoatMode to true
        this.followBoatMode = true;
    }
    
    /**
     * Update the camera to follow a boat if set
     */
    updateBoatCamera() {
        if (!this.followBoat || !this.followBoat.mesh) return;
        
        // If we have orbit controls, update the target to follow the boat
        if (this.controls && this.controls instanceof three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_1__.OrbitControls) {
            // Update the target position to the boat's current position
            this.controls.target.copy(this.followBoat.position);
            // We don't need to do anything else for orbit controls since they're updated in the animation loop
            return;
        }
        
        // Skip the default camera update for first-person mode
        // This is now handled in the setCameraView method
        if (!this.followBoatMode) return;
        
        // Regular boat camera follow logic for 'follow' camera mode
        // Get boat position and orientation
        const boatPosition = this.followBoat.position.clone();
        const boatQuaternion = this.followBoat.orientation.clone();
        const boatEuler = new THREE.Euler().setFromQuaternion(boatQuaternion);
        
        // Calculate camera position: behind and above the boat
        // Adjusted for Tugboat model - higher and further back
        const cameraOffset = new THREE.Vector3(0, 8, -15); // Above and behind
        cameraOffset.applyEuler(boatEuler);
        
        const cameraPosition = boatPosition.clone().add(cameraOffset);
        
        // Smoothly move camera to new position
        this.camera.position.lerp(cameraPosition, 0.1);
        
        // Look at the boat, slightly above its position
        const targetPosition = boatPosition.clone().add(new THREE.Vector3(0, 1.5, 0));
        this.camera.lookAt(targetPosition);
    }
    
    /**
     * Set the time of day affecting lighting
     * @param {number} timeOfDay - Time in hours (0-24)
     */
    setTimeOfDay(timeOfDay) {
        // Normalize time to 0-1 range
        const normalizedTime = (timeOfDay % 24) / 24;
        
        // Calculate sun position based on time
        const sunAngle = normalizedTime * Math.PI * 2 - Math.PI / 2;
        const sunHeight = Math.sin(sunAngle);
        const sunDistance = 100;
        
        this.sunLight.position.set(
            Math.cos(sunAngle) * sunDistance,
            Math.max(0.1, sunHeight) * sunDistance,
            0
        );
        
        // Adjust light intensity based on time
        const dayIntensity = Math.max(0, Math.sin(sunAngle));
        this.sunLight.intensity = 0.5 + dayIntensity * 0.5;
        
        // Adjust ambient light intensity
        const ambientIntensity = 0.2 + dayIntensity * 0.3;
        this.scene.children.forEach(child => {
            if (child instanceof THREE.AmbientLight) {
                child.intensity = ambientIntensity;
            }
        });
        
        // Adjust sky color based on time
        if (this.environment && this.environment.skyMesh) {
            // Blend between night blue and day blue
            const nightColor = new THREE.Color(0x0a1a2a);
            const dayColor = new THREE.Color(0x87ceeb);
            const skyColor = new THREE.Color().lerpColors(
                nightColor,
                dayColor,
                dayIntensity
            );
            
            this.environment.skyMesh.material.color = skyColor;
        }
    }
    
    /**
     * Set the environment object for time of day effects
     * @param {Environment} environment - Environment object
     */
    setEnvironment(environment) {
        this.environment = environment;
    }
    
    /**
     * Clean up resources when no longer needed
     */
    dispose() {
        this.stop();
        
        window.removeEventListener('resize', this.handleResize);
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.stats) {
            document.body.removeChild(this.stats.dom);
        }
        
        // Dispose of the renderer
        this.renderer.dispose();
    }
}

// Export the Renderer class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Renderer); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("0c9da9e92bda942a1dcc")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.a5b64e78f5fda7519bb2.hot-update.js.map