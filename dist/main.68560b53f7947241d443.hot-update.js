"use strict";
self["webpackHotUpdateopensail"]("main",{

/***/ "./src/js/environment.js":
/*!*******************************!*\
  !*** ./src/js/environment.js ***!
  \*******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _utils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils.js */ "./src/js/utils.js");
/* harmony import */ var _water_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./water.js */ "./src/js/water.js");
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
        this.water = new _water_js__WEBPACK_IMPORTED_MODULE_1__["default"]({
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
            const dirRad = _utils_js__WEBPACK_IMPORTED_MODULE_0__.degToRad(wave.direction);
            const dx = position.x * Math.cos(dirRad) + position.z * Math.sin(dirRad);
            
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
}

// Export the Environment class
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Environment); 

/***/ }),

/***/ "./src/js/water.js":
/*!*************************!*\
  !*** ./src/js/water.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * WebGL Water implementation inspired by Evan Wallace's WebGL Water
 * https://madebyevan.com/webgl-water/
 */

class Water {
    /**
     * Create a new WebGL Water simulation
     * @param {Object} options - Water configuration options
     * @param {THREE.Scene} options.scene - Three.js scene to add water to
     * @param {Number} options.width - Width of the water surface
     * @param {Number} options.height - Height of the water surface
     */
    constructor(options = {}) {
        this.scene = options.scene;
        this.width = options.width || 5000;
        this.height = options.height || 5000;
        this.resolution = options.resolution || 256;
        
        // Check if required WebGL extensions are available
        this.checkExtensions();
        
        // Create the water mesh
        this.createWaterMesh();
        
        // Set up textures and framebuffers for water simulation
        this.setupSimulation();
        
        // Set up shaders
        this.setupShaders();
    }
    
    /**
     * Check if required WebGL extensions are available
     */
    checkExtensions() {
        const gl = this.getGLContext();
        if (!gl) return;
        
        // Check for floating point texture support
        this.hasFloatTextures = !!gl.getExtension('OES_texture_float');
        this.hasFloatTextureLinear = !!gl.getExtension('OES_texture_float_linear');
        this.hasHalfFloatTextures = !!gl.getExtension('OES_texture_half_float');
        this.hasHalfFloatTextureLinear = !!gl.getExtension('OES_texture_half_float_linear');
        
        if (!this.hasFloatTextures && !this.hasHalfFloatTextures) {
            console.warn('This water simulation requires floating point texture support.');
        }
    }
    
    /**
     * Get the WebGL context
     * @returns {WebGLRenderingContext} The WebGL context
     */
    getGLContext() {
        if (!this.renderer) {
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(1, 1); // Minimal size for context
        }
        return this.renderer.getContext();
    }
    
    /**
     * Create the water mesh
     */
    createWaterMesh() {
        // Create a plane for the water surface
        const geometry = new THREE.PlaneGeometry(this.width, this.height, 1, 1);
        geometry.rotateX(-Math.PI / 2); // Make it horizontal
        
        // Create water material with custom shader
        this.waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterTexture: { value: null },
                sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0) },
                camera: { value: new THREE.Vector3() },
                waterColor: { value: new THREE.Color(0x0099ff) },
            },
            vertexShader: this.getWaterVertexShader(),
            fragmentShader: this.getWaterFragmentShader(),
            transparent: true,
            side: THREE.DoubleSide,
        });
        
        // Create the mesh and add it to the scene
        this.waterMesh = new THREE.Mesh(geometry, this.waterMaterial);
        this.waterMesh.receiveShadow = true;
        if (this.scene) {
            this.scene.add(this.waterMesh);
        }
    }
    
    /**
     * Set up textures and framebuffers for water simulation
     */
    setupSimulation() {
        const gl = this.getGLContext();
        if (!gl) return;
        
        // Determine texture type based on available extensions
        const textureType = this.hasFloatTextures ? THREE.FloatType : 
                           (this.hasHalfFloatTextures ? THREE.HalfFloatType : THREE.UnsignedByteType);
        const filter = (this.hasFloatTextureLinear || this.hasHalfFloatTextureLinear) ? 
                      THREE.LinearFilter : THREE.NearestFilter;
        
        // Create textures for water simulation
        this.textureA = new THREE.WebGLRenderTarget(
            this.resolution, 
            this.resolution, 
            {
                type: textureType,
                minFilter: filter,
                magFilter: filter,
                format: THREE.RGBAFormat,
                stencilBuffer: false,
                depthBuffer: false,
            }
        );
        
        this.textureB = this.textureA.clone();
        
        // Initialize the textures with calm water
        this.initializeTextures();
    }
    
    /**
     * Initialize the water textures
     */
    initializeTextures() {
        // Initialize with a flat water surface
        // This would be implemented using a shader to fill the texture with initial values
    }
    
    /**
     * Set up shaders for water simulation
     */
    setupShaders() {
        // Create drop shader (for adding water drops)
        this.dropShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { value: null },
                center: { value: new THREE.Vector2(0, 0) },
                radius: { value: 0.05 },
                strength: { value: 0.5 },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getDropFragmentShader(),
        });
        
        // Create update shader (for water physics)
        this.updateShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { value: null },
                delta: { value: new THREE.Vector2(1/this.resolution, 1/this.resolution) },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getUpdateFragmentShader(),
        });
        
        // Create normal shader (for calculating water normals)
        this.normalShader = new THREE.ShaderMaterial({
            uniforms: {
                texture: { value: null },
                delta: { value: new THREE.Vector2(1/this.resolution, 1/this.resolution) },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getNormalFragmentShader(),
        });
    }
    
    /**
     * Get the basic vertex shader for the simulation
     */
    getVertexShader() {
        return `
            varying vec2 coord;
            void main() {
                coord = gl_Vertex.xy * 0.5 + 0.5;
                gl_Position = vec4(gl_Vertex.xyz, 1.0);
            }
        `;
    }
    
    /**
     * Get the drop fragment shader
     */
    getDropFragmentShader() {
        return `
            const float PI = 3.141592653589793;
            uniform sampler2D texture;
            uniform vec2 center;
            uniform float radius;
            uniform float strength;
            varying vec2 coord;
            void main() {
                /* get vertex info */
                vec4 info = texture2D(texture, coord);
                
                /* add the drop to the height */
                float drop = max(0.0, 1.0 - length(center * 0.5 + 0.5 - coord) / radius);
                drop = 0.5 - cos(drop * PI) * 0.5;
                info.r += drop * strength;
                
                gl_FragColor = info;
            }
        `;
    }
    
    /**
     * Get the update fragment shader
     */
    getUpdateFragmentShader() {
        return `
            uniform sampler2D texture;
            uniform vec2 delta;
            varying vec2 coord;
            void main() {
                /* get vertex info */
                vec4 info = texture2D(texture, coord);
                
                /* calculate average neighbor height */
                vec2 dx = vec2(delta.x, 0.0);
                vec2 dy = vec2(0.0, delta.y);
                float average = (
                    texture2D(texture, coord - dx).r +
                    texture2D(texture, coord - dy).r +
                    texture2D(texture, coord + dx).r +
                    texture2D(texture, coord + dy).r
                ) * 0.25;
                
                /* change the velocity to move toward the average */
                info.g += (average - info.r) * 2.0;
                
                /* attenuate the velocity a little so waves do not last forever */
                info.g *= 0.995;
                
                /* move the vertex along the velocity */
                info.r += info.g;
                
                gl_FragColor = info;
            }
        `;
    }
    
    /**
     * Get the normal fragment shader
     */
    getNormalFragmentShader() {
        return `
            uniform sampler2D texture;
            uniform vec2 delta;
            varying vec2 coord;
            void main() {
                /* get vertex info */
                vec4 info = texture2D(texture, coord);
                
                /* update the normal */
                vec3 dx = vec3(delta.x, texture2D(texture, vec2(coord.x + delta.x, coord.y)).r - info.r, 0.0);
                vec3 dy = vec3(0.0, texture2D(texture, vec2(coord.x, coord.y + delta.y)).r - info.r, delta.y);
                info.ba = normalize(cross(dy, dx)).xz;
                
                gl_FragColor = info;
            }
        `;
    }
    
    /**
     * Get the water vertex shader
     */
    getWaterVertexShader() {
        return `
            uniform sampler2D waterTexture;
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                vUv = uv;
                
                // Sample water height from texture
                vec4 waterInfo = texture2D(waterTexture, uv);
                
                // Get vertex position with water height
                vec3 pos = position;
                pos.y += waterInfo.r * 5.0; // Scale the wave height
                
                // Get water normal from texture
                vNormal = normalize(vec3(waterInfo.b, 1.0, waterInfo.a));
                
                // Transform position to world space
                vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                
                // Standard transformation
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }
    
    /**
     * Get the water fragment shader
     */
    getWaterFragmentShader() {
        return `
            uniform vec3 waterColor;
            uniform vec3 sunDirection;
            uniform vec3 camera;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                // Calculate view direction
                vec3 viewDirection = normalize(camera - vPosition);
                
                // Calculate reflection
                float fresnel = 0.02 + 0.98 * pow(1.0 - dot(viewDirection, vNormal), 5.0);
                
                // Calculate sun reflection
                float sunReflection = pow(max(0.0, dot(reflect(-viewDirection, vNormal), sunDirection)), 100.0);
                
                // Final color
                vec3 color = waterColor;
                color += sunReflection * 0.5;
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
    }
    
    /**
     * Add a water drop at the specified position
     * @param {number} x - Normalized x coordinate (0-1)
     * @param {number} y - Normalized y coordinate (0-1)
     * @param {number} radius - Radius of the drop
     * @param {number} strength - Strength of the drop
     */
    addDrop(x, y, radius, strength) {
        // Swap textures to update the simulation
        let temp = this.textureA;
        this.textureA = this.textureB;
        this.textureB = temp;
        
        // Render drop effect to texture
        const renderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.textureA);
        
        this.dropShader.uniforms.texture.value = this.textureB.texture;
        this.dropShader.uniforms.center.value.set(x, y);
        this.dropShader.uniforms.radius.value = radius;
        this.dropShader.uniforms.strength.value = strength;
        
        this.renderQuad(this.dropShader);
        
        this.renderer.setRenderTarget(renderTarget);
    }
    
    /**
     * Update the water simulation
     */
    stepSimulation() {
        // Swap textures to update the simulation
        let temp = this.textureA;
        this.textureA = this.textureB;
        this.textureB = temp;
        
        // Render update effect to texture
        const renderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.textureA);
        
        this.updateShader.uniforms.texture.value = this.textureB.texture;
        this.renderQuad(this.updateShader);
        
        this.renderer.setRenderTarget(renderTarget);
    }
    
    /**
     * Update water normals
     */
    updateNormals() {
        // Swap textures to update the simulation
        let temp = this.textureA;
        this.textureA = this.textureB;
        this.textureB = temp;
        
        // Render normal calculation to texture
        const renderTarget = this.renderer.getRenderTarget();
        this.renderer.setRenderTarget(this.textureA);
        
        this.normalShader.uniforms.texture.value = this.textureB.texture;
        this.renderQuad(this.normalShader);
        
        this.renderer.setRenderTarget(renderTarget);
    }
    
    /**
     * Render a quad with the given shader material
     * @param {THREE.ShaderMaterial} material - Shader material to use
     */
    renderQuad(material) {
        if (!this.quad) {
            this.quad = new THREE.Mesh(
                new THREE.PlaneGeometry(2, 2),
                material
            );
            this.quadScene = new THREE.Scene();
            this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
            this.quadScene.add(this.quad);
        } else {
            this.quad.material = material;
        }
        
        this.renderer.render(this.quadScene, this.quadCamera);
    }
    
    /**
     * Update the water simulation and rendering
     * @param {number} deltaTime - Time step in seconds
     * @param {THREE.Camera} camera - Camera for reflections
     */
    update(deltaTime, camera) {
        // Update water physics
        this.stepSimulation();
        this.updateNormals();
        
        // Update water material uniforms
        if (this.waterMaterial && camera) {
            this.waterMaterial.uniforms.time.value += deltaTime;
            this.waterMaterial.uniforms.waterTexture.value = this.textureA.texture;
            this.waterMaterial.uniforms.camera.value.copy(camera.position);
        }
    }
    
    /**
     * Dispose of water resources
     */
    dispose() {
        if (this.textureA) this.textureA.dispose();
        if (this.textureB) this.textureB.dispose();
        
        if (this.waterMesh) {
            if (this.scene) this.scene.remove(this.waterMesh);
            this.waterMesh.geometry.dispose();
            this.waterMesh.material.dispose();
        }
        
        if (this.quad) {
            this.quad.geometry.dispose();
            this.quad.material.dispose();
            this.quadScene.remove(this.quad);
        }
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Water); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("99554484c32f7daedcd8")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.68560b53f7947241d443.hot-update.js.map