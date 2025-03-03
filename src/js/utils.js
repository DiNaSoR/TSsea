/**
 * Utility functions for the OpenSail game
 */

/**
 * Convert degrees to radians
 * @param {number} degrees - Angle in degrees
 * @returns {number} Angle in radians
 */
export function degToRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Convert radians to degrees
 * @param {number} radians - Angle in radians
 * @returns {number} Angle in degrees
 */
export function radToDeg(radians) {
    return radians * 180 / Math.PI;
}

/**
 * Normalize an angle to be between 0 and 360 degrees
 * @param {number} degrees - Angle in degrees
 * @returns {number} Normalized angle in degrees
 */
export function normalizeAngle(degrees) {
    return ((degrees % 360) + 360) % 360;
}

/**
 * Calculate distance between two 3D points
 * @param {THREE.Vector3} point1 - First point
 * @param {THREE.Vector3} point2 - Second point
 * @returns {number} Distance between points
 */
export function distance(point1, point2) {
    return point1.distanceTo(point2);
}

/**
 * Linear interpolation between two values
 * @param {number} a - Start value
 * @param {number} b - End value
 * @param {number} t - Interpolation factor (0-1)
 * @returns {number} Interpolated value
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Calculate the apparent wind based on true wind and boat velocity
 * @param {THREE.Vector3} trueWind - True wind vector
 * @param {THREE.Vector3} boatVelocity - Boat velocity vector
 * @returns {THREE.Vector3} Apparent wind vector
 */
export function calculateApparentWind(trueWind, boatVelocity) {
    // Apparent wind = true wind - boat velocity
    return new THREE.Vector3().subVectors(trueWind, boatVelocity);
}

/**
 * Get a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function randomRange(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Format time in seconds to MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
export function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Export the entire Utils object as well for backward compatibility
export default {
    degToRad,
    radToDeg,
    normalizeAngle,
    distance,
    lerp,
    calculateApparentWind,
    randomRange,
    clamp,
    formatTime,
}; 