// Import styles
import './styles.css';

// Import Three.js and components
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Import Socket.io client
import { io } from 'socket.io-client';

// Make Three.js components available globally
window.THREE = THREE;
window.GLTFLoader = GLTFLoader;
window.OBJLoader = OBJLoader;
window.OrbitControls = OrbitControls;

// Configure Socket.io to automatically find the correct port
window.io = io;
window.socketConnect = () => {
    // This will connect to the correct port by using relative URL
    return io('/', { 
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
import './js/client.js';

// Import our game classes
import './js/utils.js';
import './js/boat.js';
import './js/environment.js';
import './js/renderer.js';
import './js/controls.js';
import './js/game.js';

// The client.js will initialize the game when the DOM is loaded 