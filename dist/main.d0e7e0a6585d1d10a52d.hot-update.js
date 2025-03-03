self["webpackHotUpdateopensail"]("main",{

/***/ "./src/js/environment.js":
/*!*******************************!*\
  !*** ./src/js/environment.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/* harmony import */ var _water_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./water.js */ "./src/js/water.js");
/* harmony import */ var _water_js__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_water_js__WEBPACK_IMPORTED_MODULE_1__);
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
        this.water = new (_water_js__WEBPACK_IMPORTED_MODULE_1___default())({
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

/***/ "./src/js/water.js":
/*!*************************!*\
  !*** ./src/js/water.js ***!
  \*************************/
/***/ (() => {

 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("cdf922cd29da7e53061d")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.d0e7e0a6585d1d10a52d.hot-update.js.map