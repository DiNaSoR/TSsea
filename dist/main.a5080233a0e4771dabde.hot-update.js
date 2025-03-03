"use strict";
self["webpackHotUpdateopensail"]("main",{

/***/ "./src/js/renderer.js":
/*!****************************!*\
  !*** ./src/js/renderer.js ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Renderer class to handle Three.js scene and rendering
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
        if (this.controls && this.controls instanceof THREE.OrbitControls) {
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
/******/ 	__webpack_require__.h = () => ("7183e86a77683881f753")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.a5080233a0e4771dabde.hot-update.js.map