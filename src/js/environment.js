/**
 * Environment class to handle wind and waves simulation
 */
import * as Utils from './utils.js'; // Import all utility functions as Utils namespace

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
            const directionVariation = Utils.randomRange(-20, 20);
            this.waves.components.push({
                amplitude: this.waves.amplitude * Utils.randomRange(0.2, 1),
                frequency: this.waves.frequency * Utils.randomRange(0.5, 2),
                direction: Utils.normalizeAngle(this.waves.direction + directionVariation),
                phase: Utils.randomRange(0, Math.PI * 2),
                speed: this.waves.speed * Utils.randomRange(0.8, 1.2)
            });
        }
    }
    
    /**
     * Create water surface in the scene
     */
    createWater() {
        // Create a large plane for the water
        const waterGeometry = new THREE.PlaneGeometry(5000, 5000, 100, 100);
        
        // Rotate to be horizontal
        waterGeometry.rotateX(-Math.PI / 2);
        
        // Create water material - in a full implementation this would use custom shaders
        // for more realistic water effects
        const waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x2a96e5, // Lighter blue for better contrast with the boat
            transparent: true,
            opacity: 0.7,
            flatShading: false,
            shininess: 30 // Add some shininess for reflections
        });
        
        // Create the water mesh
        this.waterMesh = new THREE.Mesh(waterGeometry, waterMaterial);
        this.scene.add(this.waterMesh);
        
        // Add a simple reflection on the water
        const waterLight = new THREE.DirectionalLight(0xffffbb, 0.5);
        waterLight.position.set(0, 100, 0);
        this.scene.add(waterLight);
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
        const directionRad = Utils.degToRad(this.wind.direction);
        this.wind.x = -Math.sin(directionRad) * this.wind.speed;
        this.wind.z = -Math.cos(directionRad) * this.wind.speed;
        this.wind.y = 0; // No vertical wind component
    }
    
    /**
     * Update the environment simulation
     * @param {number} deltaTime - Time step in seconds
     */
    update(deltaTime) {
        this.updateWind(deltaTime);
        this.updateWaves(deltaTime);
        
        // Update water mesh vertices to simulate waves
        this.updateWaterMesh();
        
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
            this.wind.direction += Utils.randomRange(-5, 5);
            this.wind.direction = Utils.normalizeAngle(this.wind.direction);
            
            // Gradually change wind speed
            const speedChange = Utils.randomRange(-0.5, 0.5);
            this.wind.speed = Utils.clamp(this.wind.speed + speedChange, 1, 15);
            
            // Update components
            this.updateWindVector();
            
            // Gradually align wave direction with wind (with some delay)
            this.waves.direction += (this.wind.direction - this.waves.direction) * 0.01;
        }
        
        // Add gusts to wind speed
        if (Math.random() < 0.1 * deltaTime) {
            const gust = Utils.randomRange(-this.wind.gustFactor, this.wind.gustFactor) 
                        * this.wind.speed;
            this.wind.speed = Utils.clamp(this.wind.speed + gust, 1, 15);
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
                const dirRad = Utils.degToRad(wave.direction);
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
            this.wind.direction = Utils.normalizeAngle(windParams.direction);
        }
        
        if (windParams.speed !== undefined) {
            this.wind.speed = Utils.clamp(windParams.speed, 0, 30);
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
            this.waves.direction = Utils.normalizeAngle(waveParams.direction);
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
     * Calculate wave height at a specific world position
     * @param {THREE.Vector3} position - World position
     * @param {number} time - Current time
     * @returns {number} Wave height at the position
     */
    getWaveHeight(position, time) {
        if (!this.waves.isActive) return 0;
        
        time = time || Date.now() / 1000;
        let height = 0;
        
        // Sum heights from all wave components
        this.waves.components.forEach(wave => {
            const dirRad = Utils.degToRad(wave.direction);
            const dx = position.x * Math.cos(dirRad) + position.z * Math.sin(dirRad);
            
            height += wave.amplitude * 
                      Math.sin(dx * wave.frequency + time * wave.speed + wave.phase);
        });
        
        return height;
    }
    
    /**
     * Remove environment elements from scene and clean up resources
     */
    dispose() {
        if (this.scene) {
            if (this.waterMesh) {
                this.scene.remove(this.waterMesh);
                this.waterMesh.geometry.dispose();
                this.waterMesh.material.dispose();
            }
            
            if (this.skyMesh) {
                this.scene.remove(this.skyMesh);
                this.skyMesh.geometry.dispose();
                this.skyMesh.material.dispose();
            }
        }
    }
}

// Export the Environment class
export default Environment; 