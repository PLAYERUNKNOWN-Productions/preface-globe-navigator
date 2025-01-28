// Copyright (C) 2024 PLAYERUNKNOWN Productions

import * as THREE from 'three';

export class Globe {
    constructor() {
        // Start with a high-resolution cube geometry
        this.geometry = this.createSphereFromCube(128); // Custom geometry creation
        this.material = this.createMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    /**
     * Create a sphere-like geometry from a cube geometry.
     * This method:
     * - Starts with a cube geometry subdivided into a fine grid.
     * - Applies a mathematical mapping (Phil Nowell mapping) to the cube's vertices 
     *   so they form a sphere while preserving the cube's original vertex positions.
     * - Stores the original positions in a separate attribute for cube map texture sampling.
     *   https://mathproofs.blogspot.com/2005/07/mapping-cube-to-sphere.html
     * @param {number} resolution - Determines the number of subdivisions on each cube face.
     * @returns {THREE.BufferGeometry} - A sphere-like geometry derived from a cube.
     */
    
    createSphereFromCube(resolution) {
        const geometry = new THREE.BoxGeometry(2, 2, 2, resolution, resolution, resolution);

        // Positions of all vertices in the geometry
        const positions = geometry.attributes.position.array;

        // Create a separate array to store the original cube vertex positions
        const originalPositions = new Float32Array(positions.length); // To store original positions

        // Iterate through all vertices, adjusting them to form a sphere
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];

            // Save the cube's original position for texture mapping in the fragment shader
            originalPositions[i] = x;
            originalPositions[i + 1] = y;
            originalPositions[i + 2] = z;

            // Phil Nowell mapping formula to transform a cube vertex into a sphere vertex
            const x2 = x * x;
            const y2 = y * y;
            const z2 = z * z;

            // Adjust each coordinate to lie on a spherical surface
            positions[i] = x * Math.sqrt(1.0 - (y2 / 2.0) - (z2 / 2.0) + (y2 * z2 / 3.0));
            positions[i + 1] = y * Math.sqrt(1.0 - (z2 / 2.0) - (x2 / 2.0) + (z2 * x2 / 3.0));
            positions[i + 2] = z * Math.sqrt(1.0 - (x2 / 2.0) - (y2 / 2.0) + (x2 * y2 / 3.0));
        }

        // Store original cube positions as a custom attribute to be used in the shaders
        geometry.setAttribute('originalPosition', new THREE.BufferAttribute(originalPositions, 3));
        geometry.attributes.position.needsUpdate = true;

        return geometry;
    }

    /**
     * Create a shader material for rendering the globe.
     * The material will use a cube texture and apply vertex and fragment shaders
     * to map it correctly onto the spherical geometry.
     *
     * @returns {THREE.ShaderMaterial} - The material configured with custom shaders.
     */
    createMaterial() {
        return new THREE.ShaderMaterial({
            uniforms: {
                tCube: { value: null }, // Cube texture
                lightPosition: { value: new THREE.Vector3(5, 0, 0) }, // Light position in world space
                lightIntensity: { value: 1.0 },
                ambientIntensity: { value: 0.01 } // Ambient light level
            },
            vertexShader: this.getVertexShader(),
            fragmentShader: this.getFragmentShader(),
        });
    }

    /**
     * Vertex shader for passing through original cube positions to the fragment shader.
     * We use 'originalPosition' to determine how to sample the cube texture.
     * The output is 'vCubePosition', which will be read by the fragment shader.
     */
    getVertexShader() {
        return `
            attribute vec3 originalPosition;
            uniform vec3 lightPosition; // Light position in world space
            
            varying vec3 vCubePosition;
            varying vec3 vWorldPosition;
            varying vec3 vWorldLightPosition;

            void main() {
                // Pass original cube positions to fragment shader
                vCubePosition = originalPosition;
                
                // Calculate world position for lighting
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                
                // Transform light position to world space
                vWorldLightPosition = (modelMatrix * vec4(lightPosition, 1.0)).xyz;
                
                // Transform vertex into clip space
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * Fragment shader for applying the cube map texture.
     * It uses normalized cube positions (passed as vCubePosition) to sample from the cube texture.
     * The sampled color is then adjusted from linear to sRGB space for correct brightness.
     */
    getFragmentShader() {
        return `
            uniform samplerCube tCube;
            uniform float lightIntensity;
            uniform float ambientIntensity;
            
            varying vec3 vCubePosition;
            varying vec3 vWorldPosition;
            varying vec3 vWorldLightPosition;

            void main() {
                // Sample base color from cube texture
                vec4 texColor = textureCube(tCube, normalize(vCubePosition));
                
                // Calculate light direction in world space using transformed light position
                vec3 L = normalize(vWorldLightPosition - vWorldPosition);
                
                // Calculate normal in world space (same as normalized position for a sphere)
                vec3 N = normalize(vWorldPosition);
                
                // Calculate diffuse lighting
                float diff = max(dot(N, L), 0.0);
                
                // Calculate if point is in shadow (on dark side of planet)
                float inShadow = step(dot(N, L), 0.0);
                
                // Combine ambient and diffuse lighting
                float lighting = ambientIntensity + (1.0 - inShadow) * diff * lightIntensity;
                
                // Apply lighting to texture color
                vec3 finalColor = texColor.rgb * lighting;
                
                // Convert from linear space to sRGB for correct final appearance
                vec3 sRGBColor = pow(finalColor, vec3(0.4545));
                
                gl_FragColor = vec4(sRGBColor, texColor.a);
            }
        `;
    }

    /**
     * Assign a cube texture to the globe's material, to be used in the shaders.
     * @param {THREE.CubeTexture} cubeTexture - The cube map texture.
     */
    setTexture(cubeTexture) {
        this.material.uniforms.tCube.value = cubeTexture;
    }

    /**
     * Fade in the globe over a specified duration.
     * This modifies the material's opacity value over time, starting from 0 to 1.
     *
     * @param {number} duration - The fade-in duration in milliseconds.
     */
    fadeIn(duration = 2000) {
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update material opacity based on progress
            this.material.opacity = progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    setLightIntensity(intensity) {
        this.material.uniforms.lightIntensity.value = intensity;
    }
} 