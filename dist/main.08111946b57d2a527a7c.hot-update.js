"use strict";
self["webpackHotUpdateopensail"]("main",{

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _styles_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./styles.css */ "./src/styles.css");
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var three_examples_jsm_loaders_GLTFLoader_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! three/examples/jsm/loaders/GLTFLoader.js */ "./node_modules/three/examples/jsm/loaders/GLTFLoader.js");
/* harmony import */ var three_examples_jsm_loaders_OBJLoader_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! three/examples/jsm/loaders/OBJLoader.js */ "./node_modules/three/examples/jsm/loaders/OBJLoader.js");
/* harmony import */ var three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! three/examples/jsm/controls/OrbitControls.js */ "./node_modules/three/examples/jsm/controls/OrbitControls.js");
/* harmony import */ var socket_io_client__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! socket.io-client */ "./node_modules/socket.io-client/build/esm/index.js");
/* harmony import */ var _js_client_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./js/client.js */ "./src/js/client.js");
/* harmony import */ var _js_utils_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ./js/utils.js */ "./src/js/utils.js");
/* harmony import */ var _js_boat_js__WEBPACK_IMPORTED_MODULE_8__ = __webpack_require__(/*! ./js/boat.js */ "./src/js/boat.js");
/* harmony import */ var _js_environment_js__WEBPACK_IMPORTED_MODULE_9__ = __webpack_require__(/*! ./js/environment.js */ "./src/js/environment.js");
/* harmony import */ var _js_renderer_js__WEBPACK_IMPORTED_MODULE_10__ = __webpack_require__(/*! ./js/renderer.js */ "./src/js/renderer.js");
/* harmony import */ var _js_controls_js__WEBPACK_IMPORTED_MODULE_11__ = __webpack_require__(/*! ./js/controls.js */ "./src/js/controls.js");
/* harmony import */ var _js_game_js__WEBPACK_IMPORTED_MODULE_12__ = __webpack_require__(/*! ./js/game.js */ "./src/js/game.js");
// Import styles


// Import Three.js and components





// Import Socket.io client


// Make Three.js components available globally
window.THREE = three__WEBPACK_IMPORTED_MODULE_2__;
window.GLTFLoader = three_examples_jsm_loaders_GLTFLoader_js__WEBPACK_IMPORTED_MODULE_3__.GLTFLoader;
window.OBJLoader = three_examples_jsm_loaders_OBJLoader_js__WEBPACK_IMPORTED_MODULE_4__.OBJLoader;
window.OrbitControls = three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_5__.OrbitControls;

// Configure Socket.io to automatically find the correct port
window.io = socket_io_client__WEBPACK_IMPORTED_MODULE_1__.io;
window.socketConnect = () => {
    // This will connect to the correct port by using relative URL
    return (0,socket_io_client__WEBPACK_IMPORTED_MODULE_1__.io)('/', { 
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5
    });
};

// Set paths for assets - use path without duplicating the origin
window.ASSET_PATH = {
    // Use absolute URLs to ensure paths work in all contexts
    models: `${window.location.protocol}//${window.location.host}/assets/models/`,
    textures: `${window.location.protocol}//${window.location.host}/assets/textures/`
};

// Log asset paths to help with debugging
console.log('Asset paths configured:', window.ASSET_PATH);

// Import game modules


// Import our game classes







// The client.js will initialize the game when the DOM is loaded 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("8812746621140ed086bf")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.08111946b57d2a527a7c.hot-update.js.map