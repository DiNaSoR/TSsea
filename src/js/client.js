/**
 * Main client entry point for the OpenSail game
 */
// Import the Game class
import Game from './game.js';

document.addEventListener('DOMContentLoaded', () => {
    console.log('OpenSail initializing...');
    
    // Get the canvas element
    const canvas = document.getElementById('game-canvas');
    
    // Check if WebGL is available
    if (!isWebGLAvailable()) {
        showWebGLError();
        return;
    }
    
    // Create and initialize the game
    const game = new Game({
        canvas: canvas,
        debug: false, // Set to true for development/debugging
    });
    
    // Store game instance in window for debugging (remove in production)
    window.game = game;
    
    // Handle window events
    setupWindowEvents(game);
});

/**
 * Check if WebGL is available in the browser
 * @returns {boolean} Whether WebGL is available
 */
function isWebGLAvailable() {
    try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && 
            (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
        return false;
    }
}

/**
 * Show error message when WebGL is not available
 */
function showWebGLError() {
    const container = document.getElementById('game-container');
    
    if (container) {
        // Remove canvas
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.remove();
        }
        
        // Hide other UI elements
        const uiOverlay = document.getElementById('ui-overlay');
        const gameMenu = document.getElementById('game-menu');
        const loadingScreen = document.getElementById('loading-screen');
        
        if (uiOverlay) uiOverlay.style.display = 'none';
        if (gameMenu) gameMenu.style.display = 'none';
        if (loadingScreen) loadingScreen.style.display = 'none';
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'webgl-error';
        errorDiv.innerHTML = `
            <h2>WebGL Not Available</h2>
            <p>Your browser does not support WebGL, which is required to run this game.</p>
            <p>Please try using a modern browser like Chrome, Firefox, or Edge.</p>
        `;
        
        container.appendChild(errorDiv);
        
        // Add error styles
        const style = document.createElement('style');
        style.textContent = `
            .webgl-error {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                text-align: center;
                color: #fff;
                background-color: rgba(0, 0, 0, 0.8);
                padding: 2rem;
                border-radius: 5px;
                max-width: 90%;
            }
            
            .webgl-error h2 {
                color: #e94560;
                margin-bottom: 1rem;
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * Set up global window events
 * @param {Game} game - Game instance
 */
function setupWindowEvents(game) {
    // Handle window resize
    window.addEventListener('resize', () => {
        // The renderer's handleResize method is already called via its own event listener
    });
    
    // Handle visibility change (pause game when tab is not visible)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            game.pause();
        } else {
            game.resume();
        }
    });
    
    // Handle beforeunload to warn about leaving during a game
    window.addEventListener('beforeunload', (event) => {
        if (game.state.isRunning && !game.state.isPaused) {
            // This will prompt a confirmation dialog in most browsers
            event.preventDefault();
            event.returnValue = '';
        }
    });
    
    // Handle keyboard shortcuts
    document.addEventListener('keydown', (event) => {
        // Pause/unpause on Escape key
        if (event.key === 'Escape') {
            if (game.state.isPaused) {
                game.resume();
            } else if (game.state.isRunning) {
                game.pause();
            }
        }
    });
} 