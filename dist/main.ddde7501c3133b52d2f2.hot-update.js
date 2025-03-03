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
     * Create water in the scene
     */
    createWater() {
        try {
            // Create the WebGL water simulation
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
        } catch (error) {
            console.error("Failed to initialize WebGL water simulation:", error);
            console.log("Falling back to basic water mesh...");
            
            // Create a basic water plane as fallback
            this.createBasicWaterMesh();
        }
    }
    
    /**
     * Create a basic water mesh as fallback when WebGL water fails
     */
    createBasicWaterMesh() {
        // Create a simple plane for water
        const waterGeometry = new THREE.PlaneGeometry(5000, 5000, 32, 32);
        waterGeometry.rotateX(-Math.PI / 2);
        
        // Material with simple wave animation
        const waterMaterial = new THREE.MeshStandardMaterial({
            color: 0x0099ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
            flatShading: false,
            metalness: 0.1,
            roughness: 0.3,
        });
        
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.waterMesh.receiveShadow = true;
        this.scene.add(this.waterMesh);
        
        // Make vertices wavy for basic animation
        this.initWaveComponents(); // Ensure we have wave components
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
        if (this.water && !this.water.useFallbackTextures) {
            try {
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
            } catch (e) {
                console.warn("Error updating water:", e);
                // Continue with fallback if error occurs
            }
        }
        
        // Original/fallback water update code
        if (!this.waterMesh) return;
        
        const now = Date.now() / 1000;
        const geometry = this.waterMesh.geometry;
        const position = geometry.attributes.position;
        
        // Loop through vertices
        for (let i = 0; i < position.count; i++) {
            const x = position.getX(i);
            const z = position.getZ(i);
            
            // Skip if this is one of the edges (keep edges flat)
            if (Math.abs(x) > 2400 || Math.abs(z) > 2400) continue;
            
            // Calculate height based on wave components
            let height = 0;
            
            // Sum the heights from all wave components
            for (const wave of this.waves.components) {
                // Direction in radians
                const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(wave.direction);
                
                // Project the position onto the wave direction vector
                const projectedPos = x * Math.sin(dirRad) + z * Math.cos(dirRad);
                
                // Add this wave's contribution
                height += wave.amplitude * Math.sin(
                    wave.frequency * projectedPos + wave.phase
                );
            }
            
            // Update the vertex Y position
            position.setY(i, height);
        }
        
        // Flag geometry for update
        geometry.attributes.position.needsUpdate = true;
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
     * Get the wave height at a specific position at a specific time
     * @param {THREE.Vector3} position - Position to get height at
     * @param {number} time - Time to get height at
     * @returns {number} Wave height at the position
     */
    getWaveHeight(position, time) {
        // If new WebGL water is being used, get height from there
        if (this.water) {
            try {
                return this.water.getHeightAt(position);
            } catch (e) {
                console.warn("Error getting water height, falling back to wave components", e);
                // Continue with fallback if error occurs
            }
        }
        
        // Fallback to using wave components for height calculation
        let height = 0;
        
        // Sum heights from all wave components
        for (const wave of this.waves.components) {
            const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(wave.direction);
            
            // Project position onto wave direction
            const projectedPos = position.x * Math.sin(dirRad) + position.z * Math.cos(dirRad);
            
            // Add this wave's contribution at the given time
            const phaseOffset = time !== undefined ? time * wave.speed : wave.phase;
            height += wave.amplitude * Math.sin(wave.frequency * projectedPos + phaseOffset);
        }
        
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
     * Create wake effects as the boat moves through water
     * @param {Boat} boat - The boat to create wake for
     */
    createBoatWake(boat) {
        // Check if water exists and the boat exists
        if (!this.water || !boat || this.wakeCreationDisabled) return;
        
        try {
            // Only create wake if boat is moving fast enough
            const speed = boat.velocity ? boat.velocity.length() : 0;
            if (speed > 1) {
                // Get boat position relative to water
                const boatPos = boat.position ? boat.position.clone() : (boat.object ? boat.object.position.clone() : null);
                if (!boatPos) return;
                
                // Convert to water's UV space (0-1)
                const waterSize = 5000; // Must match water width/height
                const x = (boatPos.x + waterSize/2) / waterSize;
                const y = (boatPos.z + waterSize/2) / waterSize;
                
                // Check if boat is within water bounds
                if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
                    // Strength based on speed
                    const strength = Math.min(0.8, speed * 0.05);
                    const radius = 0.02;
                    
                    // Add drop at boat position
                    this.water.addDrop(x, y, radius, strength);
                    
                    // If going fast enough, create wake behind boat
                    if (speed > 5) {
                        // Calculate backward direction of boat
                        const direction = boat.object ? 
                            boat.object.getWorldDirection(new THREE.Vector3()) : 
                            new THREE.Vector3(0, 0, -1).applyQuaternion(boat.orientation || new THREE.Quaternion());
                        
                        const backward = direction.multiplyScalar(-1);
                        
                        // Create several smaller drops behind the boat
                        const dropCount = 3;
                        
                        for (let i = 1; i <= dropCount; i++) {
                            // Position behind boat
                            const distance = (i * 0.015);
                            
                            const wakeX = x + backward.x * distance;
                            const wakeY = y + backward.z * distance;
                            
                            // Only add if within bounds
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
        } catch (e) {
            console.warn("Error creating boat wake:", e);
            // Disable wake creation if we encounter errors
            this.wakeCreationDisabled = true;
        }
    }
}

// Export the Environment class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Environment); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("64ffae079f1f5e841733")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.ddde7501c3133b52d2f2.hot-update.js.map