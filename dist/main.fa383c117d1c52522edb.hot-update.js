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
        
        // If we have valid water texture data, sample it
        if (this.textureA && this.textureA.texture) {
            // Create a temporary canvas to read pixel data
            if (!this.canvas) {
                this.canvas = document.createElement('canvas');
                this.canvas.width = 1;
                this.canvas.height = 1;
                this.context = this.canvas.getContext('2d');
            }
            
            // This would ideally use a WebGL shader to sample the texture
            // For simplicity, we'll approximate with a sine wave based on the position
            const time = Date.now() / 1000;
            const waveHeight = Math.sin(position.x * 0.02 + time) * 0.5 + 
                               Math.cos(position.z * 0.03 + time * 0.7) * 0.3;
            
            return waveHeight;
        }
        
        return 0;
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Water); 

/***/ })

},
/******/ function(__webpack_require__) { // webpackRuntimeModules
/******/ /* webpack/runtime/getFullHash */
/******/ (() => {
/******/ 	__webpack_require__.h = () => ("11d7aab6137bfd4d59ac")
/******/ })();
/******/ 
/******/ }
);
//# sourceMappingURL=main.fa383c117d1c52522edb.hot-update.js.map