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
        console.log("Creating new boat with options:", {
            id: options.id,
            playerName: options.playerName,
            position: options.position ? options.position.toArray() : null,
            hasScene: !!options.scene
        });
        
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
        console.log("Initializing boat mesh...");
        console.log("Scene available:", !!this.scene);
        console.log("window.ASSET_PATH:", window.ASSET_PATH);
        
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
                    console.log("Fetch response for boat model:", response.status, response.statusText);
                    
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
        console.log(`Loading boat model using GLTFLoader with path: ${modelPath}`);
        console.log(`Scene available for boat model: ${this.hasScene}`);

        // Add a timeout to handle the case where the model might not load
        const modelLoadTimeout = setTimeout(() => {
            console.log('Boat model loading timed out. Creating fallback mesh.');
            this.createFallbackMesh();
        }, 10000); // 10 seconds timeout

        if (!this.hasScene) {
            console.error('Cannot load model without a scene');
            clearTimeout(modelLoadTimeout);
            this.createFallbackMesh();
            return;
        }

        const loader = new GLTFLoader();

        // Progress tracking function for debugging
        const onProgress = (xhr) => {
            console.log(`Loaded ${xhr.loaded} bytes`);
        };

        loader.load(
            modelPath,
            (gltf) => {
                clearTimeout(modelLoadTimeout);
                console.log('Boat model loaded successfully', gltf);
                this.processMesh(gltf.scene);
            },
            onProgress,
            (error) => {
                clearTimeout(modelLoadTimeout);
                console.error('Error loading boat model:', error);
                this.createFallbackMesh();
            }
        );
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
        // Log controls for debugging
        console.log(`Boat update - Controls: ${this.rudderAngle} ${this.throttle}`);
        console.log(`Boat update - Environment:`, environment);
        
        // Ensure rudderAngle and throttle have valid defaults if they're undefined
        if (this.rudderAngle === undefined) this.rudderAngle = 0;
        if (this.throttle === undefined) this.throttle = 0;
        
        // Apply physics forces
        this.applyPhysics(environment, deltaTime);
        
        // Update the visual mesh to match physics state
        this.updateMesh();
        
        // If this is a local player boat and game has a network system
        if (this.isLocalPlayer && typeof this.onPositionChanged === 'function') {
            this.onPositionChanged(this.getState());
        }
    }
    
    /**
     * Calculate forces acting on the boat
     * @param {Object} wind - Wind information
     * @param {Object} waves - Wave information
     * @returns {THREE.Vector3} - Net force in newtons
     */
    calculateForces(wind, waves) {
        console.log("Calculating forces with throttle:", this.throttle, "rudderAngle:", this.rudderAngle);
        
        // Direction the boat is facing
        const boatDirection = new THREE.Vector3(0, 0, 1);
        boatDirection.applyQuaternion(this.orientation);
        console.log("Boat direction:", boatDirection.toArray().map(v => v.toFixed(2)));
        
        // Engine force
        let engineForce = new THREE.Vector3();
        if (this.throttle !== 0) {
            // Allow for reverse by negating the force
            const forceDirection = this.throttle < 0 ? -1 : 1;
            const throttleValue = Math.abs(this.throttle);
            
            const forceMagnitude = this.enginePowerCoefficient * throttleValue * forceDirection;
            engineForce = boatDirection.clone().multiplyScalar(forceMagnitude);
            
            console.log("Engine force:", 
                "throttle:", this.throttle, 
                "magnitude:", forceMagnitude.toFixed(2), 
                "vector:", engineForce.toArray().map(v => v.toFixed(2)));
            
            // Create engine effects
            this.createEngineEffects();
        } else {
            console.log("No engine force - throttle is zero");
        }
        
        // Rudder force (turning)
        const rudderForce = new THREE.Vector3();
        if (this.rudderAngle !== 0) {
            console.log("Applying rudder force:", this.rudderAngle);
            
            // Calculate rudder direction (perpendicular to boat direction)
            const rudderDirection = new THREE.Vector3(boatDirection.z, 0, -boatDirection.x);
            console.log("Rudder direction:", rudderDirection.toArray().map(v => v.toFixed(2)));
            
            // Calculate boat speed for turning physics
            const speedKnots = this.speed;
            console.log("Current speed (knots):", speedKnots.toFixed(2));
            
            // Modified turning physics for better responsiveness
            // Maintain good turning capability at all speeds
            
            // Improved turn efficiency curve for better responsiveness
            let turnEfficiency = 0;
            
            if (speedKnots < 1) {
                // Better turning at very low speeds
                turnEfficiency = 0.8 + speedKnots * 0.2; // Significantly improved minimum turning (was 0.5)
            } else if (speedKnots < 5) {
                // Increasing effectiveness as speed builds
                turnEfficiency = 1.0 + (speedKnots - 1) * 0.05; // 1.0 to 1.2 range (was 0.8 to 1.0)
            } else if (speedKnots < 10) {
                // Peak turning efficiency at medium speeds (5-10 knots)
                turnEfficiency = 1.2; // Enhanced peak efficiency (was 1.0)
            } else {
                // Less fall-off at higher speeds for better control
                turnEfficiency = 1.2 - Math.min(0.3, (speedKnots - 10) * 0.02); // Slower falloff (was 0.03)
            }
            
            // FIX: Invert rudder angle to fix the inverted controls
            // Negative rudder angle should turn left, positive should turn right
            const correctedRudderAngle = -this.rudderAngle;
            
            // Apply enhanced force scaling based on improved turn efficiency
            const forceMagnitude = this.rudderForceCoefficient * correctedRudderAngle * turnEfficiency;
            
            rudderForce.copy(rudderDirection).multiplyScalar(forceMagnitude);
            
            // Apply angular velocity based on more responsive physics
            // Using reduced moment of inertia for more agile turning
            
            // Further reduced moment of inertia for even better responsiveness
            // Dividing by 3 to simulate a highly maneuverable boat (was divided by 2)
            const momentOfInertia = (1/12) * this.mass * (this.length * this.length + this.width * this.width) / 3;
            
            // Direction is reversed when going backward
            const directionModifier = this.velocity.dot(boatDirection) < 0 ? -1 : 1;
            
            // Calculate torque with increased response
            const torque = correctedRudderAngle * turnEfficiency * directionModifier;
            
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
        try {
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
        } catch (e) {
            console.warn("Error calculating wave height:", e);
            return 0; // Return 0 as a safe fallback
        }
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
        console.log("Updating boat mesh...");
        
        if (!this.mesh) {
            console.warn("Cannot update mesh - mesh is null");
            return;
        }
        
        try {
            // Log current position before update
            console.log("Current position before mesh update:", 
                this.position.toArray().map(v => v.toFixed(2)));
            
            // Update position and orientation
            this.mesh.position.copy(this.position);
            console.log("Mesh position updated:", 
                this.mesh.position.x.toFixed(2), 
                this.mesh.position.y.toFixed(2), 
                this.mesh.position.z.toFixed(2));
            
            // First apply the orientation from physics
            this.mesh.quaternion.copy(this.orientation);
            console.log("Mesh orientation updated");
            
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
        } catch (e) {
            console.error("Error updating mesh:", e);
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
    
    /**
     * Create a simple fallback mesh when the model fails to load
     */
    createFallbackMesh() {
        console.log('Creating fallback boat mesh');
        
        if (!this.hasScene) {
            console.error('Cannot create fallback mesh without a scene');
            return;
        }
        
        // Create a simple boat shape using basic geometries
        const hullGeometry = new THREE.BoxGeometry(2, 0.5, 5);
        const hullMaterial = new THREE.MeshBasicMaterial({ color: 0x3366ff });
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        
        // Add a simple cabin
        const cabinGeometry = new THREE.BoxGeometry(1, 0.7, 2);
        const cabinMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.y = 0.5;
        cabin.position.z = -0.5;
        
        // Create a group to hold the boat parts
        this.mesh = new THREE.Group();
        this.mesh.add(hull);
        this.mesh.add(cabin);
        
        // Scale and position appropriately
        this.mesh.scale.set(1, 1, 1);
        this.mesh.position.copy(this.position);
        
        // Add to scene
        if (this.scene) {
            this.scene.add(this.mesh);
            console.log('Fallback boat mesh added to scene');
        }
    }

    // Add a method to process the loaded mesh
    processMesh(meshScene) {
        console.log('Processing loaded boat mesh');
        
        this.mesh = meshScene;
        
        // Set initial position and orientation
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.orientation);
        console.log("Initial mesh position set:", this.mesh.position.toArray());

        // Rotate the boat model 180 degrees around the Y axis if needed
        this.mesh.rotation.y = Math.PI; // 180 degrees in radians
        console.log("Mesh rotation applied");
        
        // Set a proper scale for the boat
        const scale = 0.5; // Start with a moderate scale, adjust based on model size
        this.mesh.scale.set(scale, scale, scale);
        console.log("Mesh scale set:", scale);
        
        // Lower the boat position to reduce hovering
        this.mesh.position.y -= 0.5; // Adjust this value as needed
        console.log("Adjusted mesh Y position:", this.mesh.position.y);
        
        // Add boat to scene
        if (this.scene) {
            this.scene.add(this.mesh);
            console.log("Boat added to scene successfully");
        } else {
            console.error("Scene not available, cannot add boat mesh");
            return;
        }
        
        // Create player name label if applicable
        if (typeof this.createPlayerLabel === 'function') {
            this.createPlayerLabel();
        }
        
        // Add the sail if applicable
        if (typeof this.addSail === 'function') {
            this.addSail();
        }
        
        // Set up shadows if applicable
        if (typeof this.setupShadows === 'function') {
            this.setupShadows();
        }
        
        console.log(`Boat for ${this.playerName} processed and added to scene`);
    }
}

// Export the Boat class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Boat); 

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
        console.log("Local boat created:", !!this.localBoat);
        
        if (this.localBoat) {
            console.log("Initial boat state:", {
                position: this.localBoat.position,
                rudderAngle: this.localBoat.rudderAngle,
                throttle: this.localBoat.throttle
            });
        }
        
        // Set up camera in orbit mode
        this.setCameraView('orbit');
        console.log("Camera view set to orbit");
        
        // Set up a simple race course
        this.setupRaceCourse();
        console.log("Race course setup");
        
        // Start the game loop
        this.start();
        console.log("Game started");
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
        console.log("Creating local boat...");
        console.log("Initial position:", this.config.initialPosition);
        
        const boat = new _boat_js__WEBPACK_IMPORTED_MODULE_3__["default"]({
            id: 'local_player',
            playerName: this.multiplayer.playerName,
            position: this.config.initialPosition.clone(),
            orientation: new THREE.Quaternion(),
            scene: this.renderer.scene,
        });
        
        console.log("Boat created:", !!boat);
        if (boat) {
            console.log("Boat details:", {
                id: boat.id,
                position: boat.position,
                mesh: !!boat.mesh
            });
        }
        
        this.boats.set(boat.id, boat);
        this.localBoat = boat;
        
        console.log("Boat added to game boats collection");
        console.log("Local boat reference set:", !!this.localBoat);
        
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
        // Skip update if game is not running or is paused
        if (!this.state.isRunning || this.state.isPaused) {
            return;
        }

        // Optional debug output to reduce spam, only log every 60 frames
        if (this.frameCount % 60 === 0) {
            console.log(`Game update: deltaTime=${deltaTime.toFixed(4)}, running=${this.state.isRunning}`);
        }
        this.frameCount++;

        // Make sure we have valid controls and localBoat
        if (this.controls && this.localBoat) {
            // First, update controls based on user input
            this.controls.update(deltaTime);
            
            // Then apply the control values to the boat
            // Make sure we're using default values of 0 if controls are undefined
            this.localBoat.rudderAngle = this.controls.rudderAngle || 0;
            this.localBoat.throttle = this.controls.throttle || 0;
            
            console.log(`Applied controls to boat: {rudderAngle: ${this.localBoat.rudderAngle}, throttle: ${this.localBoat.throttle}}`);
        }

        // Update environment
        this.environment.update(deltaTime, this.localBoat);
        
        // Update all boats
        this.boats.forEach(boat => {
            // Make sure we're passing a valid environment state
            const validEnvironmentState = this.environment.update(deltaTime, boat) || {
                wind: { direction: 0, speed: 0 },
                waves: { isActive: true, amplitude: 0.5, frequency: 0.2, direction: 0, speed: 1 }
            };
            
            boat.update(validEnvironmentState, deltaTime);
            
            // Debug boat update (only for local boat to avoid spam)
            if (boat === this.localBoat && Math.floor(Date.now() / 1000) % 3 === 0) {
                console.log("Boat updated with environment:", validEnvironmentState);
            }
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
/******/ 	__webpack_require__.h = () => ("fa383c117d1c52522edb")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.7f3ea4a433b4692d4a0d.hot-update.js.map