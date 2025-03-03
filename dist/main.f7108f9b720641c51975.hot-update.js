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
        this.throttle = 0; // 0 to 1 for engine power
        
        // Boat state
        this.heading = 0; // degrees, 0-359
        this.speed = 0; // knots
        
        // Physics constants (will be tuned)
        this.mass = 1000; // kg
        this.dragCoefficient = 0.05;
        this.enginePowerCoefficient = 2000; // Force in newtons at full throttle
        this.rudderForceCoefficient = 15;
        this.lateralResistanceCoefficient = 50;
        
        // 3D model properties
        this.mesh = null;
        this.scene = options.scene;
        
        // Initialize the 3D model
        this.initMesh();
        
        // Engine effects
        this.engineSound = null;
        this.engineParticles = null;
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
        
        // Apply angular velocity with realistic damping
        // Real boats have significant rotational inertia
        const rotationAxis = new THREE.Vector3(0, 1, 0);
        const rotationAngle = this.angularVelocity.y * deltaTime;
        const rotationQuaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, rotationAngle);
        this.orientation.premultiply(rotationQuaternion);
        this.orientation.normalize();
        
        // Apply water resistance to angular velocity
        // Water creates substantial resistance to rotation
        this.angularVelocity.multiplyScalar(0.97);
        
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
        
        // Update engine effects if throttle is active
        if (this.throttle > 0) {
            this.createEngineEffects();
        } else if (this.engineParticles) {
            // Fade out engine particles when throttle is zero
            this.updateEngineEffects();
            if (this.engineParticles.system.material.opacity <= 0.05) {
                // Remove particles when fully faded
                this.scene.remove(this.engineParticles.system);
                this.engineParticles.system.geometry.dispose();
                this.engineParticles.system.material.dispose();
                this.engineParticles = null;
            }
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
            throttle: this.throttle,
            heading: this.heading,
            speed: this.speed
        };
    }
    
    /**
     * Calculate forces acting on the boat
     * @param {Object} wind - Wind information
     * @param {Object} waves - Wave information
     * @returns {THREE.Vector3} - Net force in newtons
     */
    calculateForces(wind, waves) {
        // Direction the boat is facing
        const boatDirection = new THREE.Vector3(0, 0, 1);
        boatDirection.applyQuaternion(this.orientation);
        
        // Engine force
        let engineForce = new THREE.Vector3();
        if (this.throttle !== 0) {
            // Allow for reverse by negating the force
            const forceDirection = this.throttle < 0 ? -1 : 1;
            const throttleValue = Math.abs(this.throttle);
            
            const forceMagnitude = this.enginePowerCoefficient * throttleValue * forceDirection;
            engineForce = boatDirection.clone().multiplyScalar(forceMagnitude);
            
            // Create engine effects
            this.createEngineEffects();
        }
        
        // Rudder force (turning)
        const rudderForce = new THREE.Vector3();
        if (this.rudderAngle !== 0) {
            // Calculate rudder direction (perpendicular to boat direction)
            const rudderDirection = new THREE.Vector3(boatDirection.z, 0, -boatDirection.x);
            
            // Calculate boat speed for turning physics
            const speedKnots = this.speed;
            
            // Modified turning physics for better responsiveness
            // Maintain good turning capability at all speeds
            
            // Improved turn efficiency curve for better responsiveness
            let turnEfficiency = 0;
            
            if (speedKnots < 1) {
                // Better turning at very low speeds
                turnEfficiency = 0.5 + speedKnots * 0.3; // Minimum 0.5 even when nearly stopped
            } else if (speedKnots < 5) {
                // Increasing effectiveness as speed builds
                turnEfficiency = 0.8 + (speedKnots - 1) * 0.05; // 0.8 to 1.0 range
            } else if (speedKnots < 10) {
                // Peak turning efficiency at medium speeds (5-10 knots)
                turnEfficiency = 1.0;
            } else {
                // Less fall-off at higher speeds for better control
                turnEfficiency = 1.0 - Math.min(0.3, (speedKnots - 10) * 0.03);
            }
            
            // Apply enhanced force scaling based on improved turn efficiency
            const forceMagnitude = this.rudderForceCoefficient * this.rudderAngle * turnEfficiency;
            
            rudderForce.copy(rudderDirection).multiplyScalar(forceMagnitude);
            
            // Apply angular velocity based on more responsive physics
            // Using reduced moment of inertia for more agile turning
            
            // Reduced moment of inertia for better responsiveness
            // Dividing by 2 to simulate a more maneuverable boat
            const momentOfInertia = (1/12) * this.mass * (this.length * this.length + this.width * this.width) / 2;
            
            // Direction is reversed when going backward
            const directionModifier = this.velocity.dot(boatDirection) < 0 ? -1 : 1;
            
            // Calculate torque with increased response
            const torque = this.rudderAngle * turnEfficiency * directionModifier;
            
            // Angular acceleration with increased factor for more responsive turning
            const angularAcceleration = torque / momentOfInertia * 0.05; // Increased from 0.02
            
            // Apply angular acceleration over time - more responsive than before
            this.angularVelocity.y += angularAcceleration;
            
            // Increased maximum angular velocity for faster turning
            const maxAngularVelocity = 1.0; // Increased from 0.5 - allows for faster turning
            this.angularVelocity.y = THREE.MathUtils.clamp(
                this.angularVelocity.y, 
                -maxAngularVelocity, 
                maxAngularVelocity
            );
        } else {
            // Reduced deceleration for angular velocity - stays turning longer
            this.angularVelocity.y *= 0.98; // Changed from 0.97 - slower decay when not turning
        }
        
        // Drag forces (opposite to velocity)
        const dragForce = new THREE.Vector3();
        if (this.velocity.lengthSq() > 0) {
            const velocityMagnitude = this.velocity.length();
            
            // Realistic drag increases with the square of velocity
            const dragCoefficient = this.dragCoefficient * (1 + velocityMagnitude * 0.05);
            
            const dragMagnitude = dragCoefficient * velocityMagnitude * velocityMagnitude;
            dragForce.copy(this.velocity).normalize().multiplyScalar(-dragMagnitude);
        }
        
        // Sum all forces
        return engineForce.add(rudderForce).add(dragForce);
    }
    
    /**
     * Create engine effects (particles and sound)
     */
    createEngineEffects() {
        if (!this.scene) return;
        
        // Create engine particles if they don't exist yet
        if (!this.engineParticles) {
            // Create particle system for engine exhaust
            const particleGeometry = new THREE.BufferGeometry();
            const particleMaterial = new THREE.PointsMaterial({
                color: 0x888888,
                size: 0.1,
                transparent: true,
                opacity: 0.6
            });
            
            // Create initial particles at the rear of the boat
            const particleCount = 30;
            const positions = new Float32Array(particleCount * 3);
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] = 0; // Will be set in updateEngineEffects
                positions[i3 + 1] = 0; 
                positions[i3 + 2] = 0;
            }
            
            particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            // Create the particle system
            this.engineParticles = {
                system: new THREE.Points(particleGeometry, particleMaterial),
                velocities: [],
                lifetime: 2, // seconds
                timer: 0
            };
            
            // Initialize particle velocities
            for (let i = 0; i < particleCount; i++) {
                this.engineParticles.velocities.push({
                    x: (Math.random() - 0.5) * 0.05,
                    y: Math.random() * 0.1 + 0.05,
                    z: -Math.random() * 0.2 - 0.1  // Mostly backward
                });
            }
            
            this.scene.add(this.engineParticles.system);
        }
        
        // Update engine effects
        this.updateEngineEffects();
    }
    
    /**
     * Update engine particle effects
     */
    updateEngineEffects() {
        if (!this.engineParticles) return;
        
        // The boat direction
        const boatDirection = new THREE.Vector3(0, 0, 1);
        boatDirection.applyQuaternion(this.orientation);
        
        // Position at the back of the boat
        const enginePosition = this.position.clone().sub(
            boatDirection.clone().multiplyScalar(this.length * 0.45)
        );
        enginePosition.y += 0.5; // Slightly above water level
        
        // Get particle positions
        const positions = this.engineParticles.system.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        
        // Create new particles at the engine position based on throttle
        const emissionRate = Math.ceil(Math.abs(this.throttle) * 2); // More particles at higher throttle
        
        for (let i = 0; i < emissionRate; i++) {
            // Find an "expired" particle to reuse, or use a random one
            let particleIndex = Math.floor(Math.random() * particleCount);
            
            const i3 = particleIndex * 3;
            
            // Reset position to engine
            positions[i3] = enginePosition.x + (Math.random() - 0.5) * 0.1;
            positions[i3 + 1] = enginePosition.y + (Math.random() - 0.5) * 0.1;
            positions[i3 + 2] = enginePosition.z + (Math.random() - 0.5) * 0.1;
            
            // Determine emission direction based on throttle
            // When in reverse, emit particles from the front of the boat
            const isReverse = this.throttle < 0;
            let particleDirection;
            
            if (isReverse) {
                // When in reverse, emit from front of boat
                particleDirection = boatDirection.clone();
                // Position adjustment for reverse
                const frontPosition = this.position.clone().add(
                    boatDirection.clone().multiplyScalar(this.length * 0.45)
                );
                positions[i3] = frontPosition.x + (Math.random() - 0.5) * 0.1;
                positions[i3 + 2] = frontPosition.z + (Math.random() - 0.5) * 0.1;
            } else {
                // Normal forward emission from rear
                particleDirection = boatDirection.clone().negate();
            }
            
            // Reset velocity - direction depends on boat orientation and throttle
            const velocity = new THREE.Vector3(
                (Math.random() - 0.5) * 0.05 + particleDirection.x * 0.1,
                Math.random() * 0.1 + 0.05,
                (Math.random() - 0.5) * 0.05 + particleDirection.z * 0.1
            );
            
            this.engineParticles.velocities[particleIndex] = {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            };
        }
        
        // Update all particles
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Update position based on velocity
            positions[i3] += this.engineParticles.velocities[i].x;
            positions[i3 + 1] += this.engineParticles.velocities[i].y;
            positions[i3 + 2] += this.engineParticles.velocities[i].z;
            
            // Apply gravity and fade to particles
            this.engineParticles.velocities[i].y -= 0.001;
        }
        
        // Adjust opacity based on throttle
        this.engineParticles.system.material.opacity = 0.6 * Math.abs(this.throttle);
        
        // Mark positions for update
        this.engineParticles.system.geometry.attributes.position.needsUpdate = true;
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
        
        // First apply the orientation from physics
        this.mesh.quaternion.copy(this.orientation);
        
        // Then apply a fixed 180-degree rotation to show the back of the boat
        // Create a rotation quaternion for 180 degrees around Y axis
        const rotationY = new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            Math.PI  // 180 degrees in radians
        );
        
        // Apply the rotation after the orientation
        this.mesh.quaternion.multiply(rotationY);
        
        // Update sail rotation if we have a sail object
        if (this.sail) {
            this.sail.rotation.y = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(this.rudderAngle);
        }
    }
    
    /**
     * Set boat controls
     * @param {Object} controls - Control inputs
     * @param {number} controls.rudderAngle - Rudder angle (-45 to 45 degrees)
     * @param {number} controls.throttle - Throttle (0 to 1)
     */
    setControls(controls) {
        if (controls.rudderAngle !== undefined) {
            this.rudderAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(controls.rudderAngle, -45, 45);
        }
        
        if (controls.throttle !== undefined) {
            this.throttle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(controls.throttle, 0, 1);
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
        this.rudderAngle = state.rudderAngle;
        this.throttle = state.throttle;
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
        // We don't add sails anymore because this is an engine boat
        console.log("This is an engine boat - no sail needed");
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

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("e79c1ceacd077dd6afea")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.f7108f9b720641c51975.hot-update.js.map