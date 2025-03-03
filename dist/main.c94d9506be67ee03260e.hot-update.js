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
        
        // Control sensitivity
        this.rudderSensitivity = 5; // Degrees per keypress/update
        this.throttleSensitivity = 0.1; // Throttle change per keypress/update
        
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
                // Calculate return direction
                const returnDirection = this.state.rudderAngle > 0 ? -1 : 1;
                
                // Calculate new angle
                const newAngle = this.state.rudderAngle + returnDirection * this.rudderSensitivity * 0.5;
                
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
        
        // Calculate throttle input from keyboard
        let throttleInput = 0;
        if (this.keys['w'] || this.keys['ArrowUp']) throttleInput += 1;
        if (this.keys['s'] || this.keys['ArrowDown']) throttleInput -= 1;
        
        // Apply throttle input
        if (throttleInput !== 0) {
            const newThrottle = _utils_js__WEBPACK_IMPORTED_MODULE_0__.clamp(
                this.state.throttle + throttleInput * this.throttleSensitivity,
                0,
                1
            );
            
            if (newThrottle !== this.state.throttle) {
                this.state.throttle = newThrottle;
                controlsChanged = true;
            }
        } else {
            // Auto-decrease throttle when no key is pressed
            if (this.state.throttle > 0) {
                this.state.throttle = Math.max(0, this.state.throttle - this.throttleSensitivity * 0.5);
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
/******/ 	__webpack_require__.h = () => ("f433bad60af91acfdc8d")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.c94d9506be67ee03260e.hot-update.js.map