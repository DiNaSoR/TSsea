"use strict";
self["webpackHotUpdateopensail"]("main",{

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
            throttle: 0, // 0 to 1 (for motor)
            cameraView: 'orbit', // Only orbit mode is now used
        };
        
        // Control sensitivity - adjusted for easier boat handling
        this.rudderSensitivity = 4.5; // Increased for much easier steering (was 2.5)
        this.throttleSensitivity = 0.05; // Reduced for more gradual acceleration (was 0.1)
        
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
        
        // Calculate throttle and steering based on WASD keys
        let throttleInput = 0;
        let rudderInput = 0;
        
        // W/S for forward/backward throttle
        if (this.keys['w']) throttleInput += 1;  // Forward
        if (this.keys['s']) throttleInput -= 1;  // Backward/Brake
        
        // A/D for steering left/right
        if (this.keys['a']) rudderInput -= 1;  // Left
        if (this.keys['d']) rudderInput += 1;  // Right
        
        // Arrow keys as alternative controls
        if (this.keys['ArrowUp']) throttleInput += 1;
        if (this.keys['ArrowDown']) throttleInput -= 1;
        if (this.keys['ArrowLeft']) rudderInput -= 1;
        if (this.keys['ArrowRight']) rudderInput += 1;
        
        // Apply throttle input with realistic acceleration/deceleration
        if (throttleInput !== 0) {
            // Scale throttle sensitivity by deltaTime for consistent behavior
            const adjustedSensitivity = this.throttleSensitivity * (deltaTime / (1/60));
            
            // Acceleration is slower than deceleration (realistic)
            const throttleChangeRate = throttleInput > 0 ? adjustedSensitivity * 0.8 : adjustedSensitivity * 1.2;
            
            const newThrottle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(
                this.state.throttle + throttleInput * throttleChangeRate,
                -0.5,  // Allow some reverse
                1
            );
            
            if (newThrottle !== this.state.throttle) {
                this.state.throttle = newThrottle;
                controlsChanged = true;
            }
        } else {
            // Auto-decrease throttle when no key is pressed (gradual engine deceleration)
            if (this.state.throttle !== 0) {
                // Calculate direction of decrease
                const decreaseDirection = this.state.throttle > 0 ? -1 : 1;
                
                // Deceleration rate based on deltaTime for consistency
                const decreaseAmount = this.throttleSensitivity * 0.15 * (deltaTime / (1/60));
                
                // Move throttle toward zero
                const newThrottle = Math.abs(this.state.throttle) <= decreaseAmount 
                    ? 0 
                    : this.state.throttle + decreaseDirection * decreaseAmount;
                
                this.state.throttle = newThrottle;
                controlsChanged = true;
            }
        }
        
        // Apply rudder input with much more responsive turning
        if (rudderInput !== 0) {
            // Scale rudder sensitivity by deltaTime for consistent behavior
            // Using enhanced sensitivity for easier turning
            const adjustedSensitivity = this.rudderSensitivity * (deltaTime / (1/60)) * 1.5;
            
            // Quick rudder adjustment for more responsive feel
            const newRudderAngle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(
                this.state.rudderAngle + rudderInput * adjustedSensitivity,
                -45, 
                45
            );
            
            if (newRudderAngle !== this.state.rudderAngle) {
                this.state.rudderAngle = newRudderAngle;
                controlsChanged = true;
            }
        } else {
            // Almost no auto-return to center to make steering easier
            // This makes it easier to hold a consistent turning angle
            if (this.state.rudderAngle !== 0) {
                // Calculate return direction
                const returnDirection = this.state.rudderAngle > 0 ? -1 : 1;
                
                // Very slow return rate for better control
                const returnRate = this.rudderSensitivity * 0.05 * (deltaTime / (1/60));
                
                // Calculate new angle
                const newAngle = this.state.rudderAngle + returnDirection * returnRate;
                
                // Check if we've crossed zero
                if ((returnDirection === -1 && newAngle < 0) || 
                    (returnDirection === 1 && newAngle > 0)) {
                    this.state.rudderAngle = 0;
                } else {
                    this.state.rudderAngle = newAngle;
                }
                
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

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("f7108f9b720641c51975")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.20ddd37dc94360b15ac3.hot-update.js.map