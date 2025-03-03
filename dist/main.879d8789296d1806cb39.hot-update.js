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
            sailAngle: 0, // -90 to 90 degrees
            throttle: 0, // 0 to 1 (for motor, if implemented)
            cameraView: 'follow', // 'follow', 'overhead', 'first-person'
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
        
        // Camera view changes
        if (event.key === '1') {
            this.state.cameraView = 'follow';
            this.notifyControlChange();
        } else if (event.key === '2') {
            this.state.cameraView = 'overhead';
            this.notifyControlChange();
        } else if (event.key === '3') {
            this.state.cameraView = 'first-person';
            this.notifyControlChange();
        } else if (event.key === '4') {
            this.state.cameraView = 'orbit';
            this.notifyControlChange();
        }
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
            cameraView: 'follow',
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
/******/ 	__webpack_require__.h = () => ("c893fc0748c065847518")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.879d8789296d1806cb39.hot-update.js.map