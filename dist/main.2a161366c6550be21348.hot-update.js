"use strict";
self["webpackHotUpdateopensail"]("main",{

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
        
        // Get the renderer from the scene
        if (this.scene && this.scene.renderer) {
            this.renderer = this.scene.renderer;
        }
        
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
        
        // Check for floating point texture support (with fallbacks)
        this.hasFloatTextures = !!gl.getExtension('OES_texture_float');
        this.hasFloatTextureLinear = !!gl.getExtension('OES_texture_float_linear');
        this.hasHalfFloatTextures = !!gl.getExtension('OES_texture_half_float');
        this.hasHalfFloatTextureLinear = !!gl.getExtension('OES_texture_half_float_linear');
        
        // Enable additional extensions that might help
        gl.getExtension('WEBGL_color_buffer_float');
        gl.getExtension('EXT_color_buffer_float');
        gl.getExtension('EXT_color_buffer_half_float');
        
        if (!this.hasFloatTextures && !this.hasHalfFloatTextures) {
            console.warn('This water simulation requires floating point texture support.');
            // Fall back to use standard texture formats
            this.useFallbackTextures = true;
        }
    }
    
    /**
     * Get the WebGL context
     * @returns {WebGLRenderingContext} The WebGL context
     */
    getGLContext() {
        if (!this.renderer) {
            // Create a temporary renderer if one doesn't exist
            this.renderer = new THREE.WebGLRenderer({ antialias: true });
            this.renderer.setSize(1, 1); // Minimal size for context
            this.isTemporaryRenderer = true;
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
        
        // Create a placeholder texture for initialization
        const placeholderTexture = new THREE.DataTexture(
            new Float32Array([0, 0, 0, 1]), // Single pixel RGBA
            1, 1, 
            THREE.RGBAFormat, 
            THREE.FloatType
        );
        placeholderTexture.needsUpdate = true;
        
        // Create water material with custom shader
        this.waterMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                waterTexture: { value: placeholderTexture },
                sunDirection: { value: new THREE.Vector3(0.5, 0.5, 0).normalize() },
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
        let textureType = THREE.UnsignedByteType;
        let filter = THREE.LinearFilter;
        
        if (!this.useFallbackTextures) {
            if (this.hasFloatTextures) {
                textureType = THREE.FloatType;
                filter = this.hasFloatTextureLinear ? THREE.LinearFilter : THREE.NearestFilter;
            } else if (this.hasHalfFloatTextures) {
                textureType = THREE.HalfFloatType;
                filter = this.hasHalfFloatTextureLinear ? THREE.LinearFilter : THREE.NearestFilter;
            }
        }
        
        // Create render targets with appropriate settings
        const rtOptions = {
            type: textureType,
            minFilter: filter,
            magFilter: filter,
            format: THREE.RGBAFormat,
            stencilBuffer: false,
            depthBuffer: false,
            generateMipmaps: false
        };
        
        // Create textures for water simulation
        this.textureA = new THREE.WebGLRenderTarget(
            this.resolution, 
            this.resolution, 
            rtOptions
        );
        
        this.textureB = this.textureA.clone();
        
        // Initialize the textures with calm water
        this.initializeTextures();
    }
    
    /**
     * Initialize the water textures
     */
    initializeTextures() {
        // Create a simple shader to initialize the water texture
        const initShader = new THREE.ShaderMaterial({
            uniforms: {},
            vertexShader: this.getVertexShader(),
            fragmentShader: `
                void main() {
                    // Initialize with still water (r=height, g=velocity, ba=normal)
                    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
                }
            `
        });
        
        // Render to both textures to initialize them
        const renderTarget = this.renderer.getRenderTarget();
        
        this.renderer.setRenderTarget(this.textureA);
        this.renderQuad(initShader);
        
        this.renderer.setRenderTarget(this.textureB);
        this.renderQuad(initShader);
        
        this.renderer.setRenderTarget(renderTarget);
    }
    
    /**
     * Set up shaders for water simulation
     */
    setupShaders() {
        // Create drop shader (for adding water drops)
        this.dropShader = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { value: null },
                center: { value: new THREE.Vector2(0, 0) },
                radius: { value: 0.05 },
                strength: { value: 0.5 },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getDropFragmentShader(),
            glslVersion: THREE.GLSL1
        });
        
        // Create update shader (for water physics)
        this.updateShader = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { value: null },
                delta: { value: new THREE.Vector2(1/this.resolution, 1/this.resolution) },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getUpdateFragmentShader(),
            glslVersion: THREE.GLSL1
        });
        
        // Create normal shader (for calculating water normals)
        this.normalShader = new THREE.RawShaderMaterial({
            uniforms: {
                texture: { value: null },
                delta: { value: new THREE.Vector2(1/this.resolution, 1/this.resolution) },
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getNormalFragmentShader(),
            glslVersion: THREE.GLSL1
        });
    }
    
    /**
     * Get the basic vertex shader for the simulation
     */
    getVertexShader() {
        return `
            precision mediump float;
            varying vec2 coord;
            void main() {
                // Convert vertices to texture coordinates
                coord = position.xy * 0.5 + 0.5;
                gl_Position = vec4(position.xyz, 1.0);
            }
        `;
    }
    
    /**
     * Get the drop fragment shader
     */
    getDropFragmentShader() {
        return `
            precision mediump float;
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
            precision mediump float;
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
            precision mediump float;
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
            precision mediump float;
            uniform sampler2D waterTexture;
            uniform float time;
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            // Simplified wave function
            float waveHeight(vec2 position, float time) {
                float x = position.x * 0.02;
                float z = position.y * 0.03;
                
                float height = 0.0;
                height += sin(x + time * 1.0) * 0.5;
                height += cos(z + time * 0.7) * 0.3;
                height += sin(x * 3.0 + time * 0.8) * 0.2;
                height += cos(z * 2.5 + time * 0.6) * 0.1;
                
                return height * 0.5;
            }
            
            // Calculate normal from height field
            vec3 calculateNormal(vec2 position, float time) {
                float eps = 0.1;
                
                float h = waveHeight(position, time);
                float hx1 = waveHeight(position + vec2(eps, 0.0), time);
                float hx2 = waveHeight(position - vec2(eps, 0.0), time);
                float hz1 = waveHeight(position + vec2(0.0, eps), time);
                float hz2 = waveHeight(position - vec2(0.0, eps), time);
                
                vec3 normal = vec3(hx2 - hx1, 2.0 * eps, hz2 - hz1);
                return normalize(normal);
            }
            
            void main() {
                vUv = uv;
                
                // Start with base position
                vec3 pos = position;
                
                // Calculate wave height
                float height = waveHeight(uv, time);
                pos.y += height * 5.0;
                
                // Calculate normal
                vNormal = calculateNormal(uv, time);
                
                // Pass position to fragment shader
                vPosition = (modelMatrix * vec4(pos, 1.0)).xyz;
                
                // Final position
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;
    }
    
    /**
     * Get the water fragment shader
     */
    getWaterFragmentShader() {
        return `
            precision mediump float;
            
            uniform vec3 waterColor;
            uniform vec3 sunDirection;
            uniform vec3 camera;
            uniform float time;
            
            varying vec2 vUv;
            varying vec3 vPosition;
            varying vec3 vNormal;
            
            void main() {
                // Basic water color with simple lighting
                vec3 color = waterColor;
                
                // Add simple detail
                float detail = sin(vPosition.x * 0.1 + vPosition.z * 0.1 + time) * 0.1 + 0.9;
                color = color * detail;
                
                // Add simple sun reflection
                float sunLight = max(0.0, dot(normalize(vNormal), normalize(sunDirection))) * 0.3;
                color += vec3(sunLight);
                
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
        try {
            // Only run full simulation if WebGL extensions are supported
            if (!this.useFallbackTextures) {
                // Update water physics
                this.stepSimulation();
                this.updateNormals();
            } else {
                // Update time for the fallback animation
                this.currentTime = (this.currentTime || 0) + deltaTime;
            }
            
            // Update water material uniforms
            if (this.waterMaterial && camera) {
                this.waterMaterial.uniforms.time.value += deltaTime;
                
                // Only use the texture if we have valid float textures
                if (!this.useFallbackTextures) {
                    this.waterMaterial.uniforms.waterTexture.value = this.textureA.texture;
                }
                
                this.waterMaterial.uniforms.camera.value.copy(camera.position);
            }
        } catch (e) {
            console.error("Error updating water simulation:", e);
            // Mark as fallback for future updates
            this.useFallbackTextures = true;
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
    
    /**
     * Get the water height at a specific position in world space
     * @param {THREE.Vector3} position - Position to get height at
     * @returns {number} Water height at the position
     */
    getHeightAt(position) {
        // Convert world position to normalized UV coordinates
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        // Convert world XZ position to UV (0-1) coordinates
        const u = (position.x + halfWidth) / this.width;
        const v = (position.z + halfHeight) / this.height;
        
        // Check if position is within water bounds
        if (u < 0 || u > 1 || v < 0 || v > 1) {
            return 0; // Return 0 for positions outside the water
        }
        
        // If texture-based height sampling is available, use it
        if (this.textureA && this.textureA.texture && !this.useFallbackTextures) {
            try {
                // This would ideally use a WebGL readPixels call to get the exact height
                // But this requires complex WebGL operations to read from floating point textures
                // For now, we'll use the fallback method that produces similar results
                return this.getFallbackHeightAt(position);
            } catch (e) {
                console.warn("Error sampling water height, using fallback", e);
                return this.getFallbackHeightAt(position);
            }
        }
        
        // Use the fallback method
        return this.getFallbackHeightAt(position);
    }
    
    /**
     * Fallback method to calculate water height using mathematical waves
     * @param {THREE.Vector3} position - Position to get height at
     * @returns {number} Calculated water height
     */
    getFallbackHeightAt(position) {
        const time = Date.now() / 1000;
        
        // Create a composite wave using multiple sine/cosine waves
        let height = 0;
        
        // Main waves
        height += Math.sin(position.x * 0.02 + time) * 0.5;
        height += Math.cos(position.z * 0.03 + time * 0.7) * 0.3;
        
        // Add some smaller details
        height += Math.sin(position.x * 0.06 + time * 1.3) * 0.2;
        height += Math.cos(position.z * 0.08 + time * 0.8) * 0.1;
        
        // Scale the height to match the desired amplitude
        return height * 0.5;
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Water); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("ec543a481bc9cb4ff095")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.2a161366c6550be21348.hot-update.js.map