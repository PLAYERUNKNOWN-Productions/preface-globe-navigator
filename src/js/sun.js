import * as THREE from 'three';

/**
 * Represents a sun object with volumetric effects and particle systems
 */
export class Sun {
    // Configuration constants
    static CONFIG = {
        PLANE: {
            COUNT: 3,
            SIZE: 0.6,
        },
        PARTICLES: {
            COUNT: 100,
            BASE_RADIUS: 0.005,
            RADIUS_VARIANCE: 0.0025,
            BASE_SIZE: 0.01,
            SIZE_VARIANCE: 0.0005,
            BASE_SPEED: 0.001,
            SPEED_VARIANCE: 0.002,
            SPAWN_RADIUS: 0.15,
            PARTICLE_COLOR: 0xffcc66,
            PARTICLE_SIZE: 0.5,
            PARTICLE_OPACITY: 0.4
        },
        TEXTURE: {
            SIZE: 32,
            GRADIENT: {
                INNER: { STOP: 0, COLOR: 'rgba(255, 255, 255, 0.8)' },
                MIDDLE: { STOP: 0.3, COLOR: 'rgba(255, 230, 150, 0.3)' },
                OUTER: { STOP: 1, COLOR: 'rgba(255, 200, 100, 0)' }
            }
        }
    };

    /**
     * Creates a new Sun instance
     */
    constructor() {
        this.group = new THREE.Group();
        this.createSun();
    }

    /**
     * Initializes the sun's visual components
     * @private
     */
    createSun() {
        // Create multiple planes for volumetric effect
        for (let i = 0; i < Sun.CONFIG.PLANE.COUNT; i++) {
            const sunMesh = this.createSunPlane();
            sunMesh.rotation.y = (Math.PI / Sun.CONFIG.PLANE.COUNT) * i;
            this.group.add(sunMesh);
        }
        
        // Add particles
        this.particles = this.createParticles();
        this.group.add(this.particles);
    }

    /**
     * Creates a single plane for the sun's volumetric effect
     * @private
     * @returns {THREE.Mesh} The created sun plane
     */
    createSunPlane() {
        const geometry = new THREE.PlaneGeometry(
            Sun.CONFIG.PLANE.SIZE,
            Sun.CONFIG.PLANE.SIZE
        );
        const material = new THREE.ShaderMaterial({
            vertexShader: Sun.vertexShader,
            fragmentShader: Sun.fragmentShader,
            uniforms: {
                time: { value: 0 }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.renderOrder = 1;
        return mesh;
    }

    /**
     * Creates the particle system for the sun's corona effect
     * @private
     * @returns {THREE.Points} The particle system
     */
    createParticles() {
        const { COUNT, BASE_SIZE, SIZE_VARIANCE } = Sun.CONFIG.PARTICLES;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(COUNT * 3);
        const velocities = new Float32Array(COUNT * 3);
        const lifetimes = new Float32Array(COUNT);
        const sizes = new Float32Array(COUNT);
        
        // Initialize particles
        for (let i = 0; i < COUNT; i++) {
            const { pos, vel } = this.createSphericalParticle(Sun.CONFIG.PARTICLES.BASE_RADIUS);
            
            const idx = i * 3;
            positions[idx] = pos.x;
            positions[idx + 1] = pos.y;
            positions[idx + 2] = pos.z;
            
            velocities[idx] = vel.x;
            velocities[idx + 1] = vel.y;
            velocities[idx + 2] = vel.z;
            
            lifetimes[i] = Math.random();
            sizes[i] = BASE_SIZE + Math.random() * SIZE_VARIANCE;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            color: Sun.CONFIG.PARTICLES.PARTICLE_COLOR,
            size: Sun.CONFIG.PARTICLES.PARTICLE_SIZE,
            transparent: true,
            opacity: Sun.CONFIG.PARTICLES.PARTICLE_OPACITY,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
            map: this.createParticleTexture()
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.velocities = velocities;
        particles.userData.lifetimes = lifetimes;
        particles.userData.sizes = sizes;
        
        return particles;
    }

    /**
     * Creates a particle with spherical distribution
     * @private
     * @param {number} baseRadius - The base radius for particle positioning
     * @returns {{pos: {x: number, y: number, z: number}, vel: {x: number, y: number, z: number}}}
     */
    createSphericalParticle(baseRadius) {
        const { RADIUS_VARIANCE, BASE_SPEED, SPEED_VARIANCE } = Sun.CONFIG.PARTICLES;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.random() * Math.PI;
        const radius = baseRadius + Math.random() * RADIUS_VARIANCE;
        
        const pos = {
            x: radius * Math.sin(theta) * Math.cos(phi),
            y: radius * Math.sin(theta) * Math.sin(phi),
            z: radius * Math.sin(theta) * Math.cos(theta)
        };
        
        const speed = BASE_SPEED + Math.random() * SPEED_VARIANCE;
        const vel = {
            x: pos.x / radius * speed,
            y: pos.y / radius * speed,
            z: pos.z / radius * speed
        };
        
        return { pos, vel };
    }

    /**
     * Creates a texture for particles
     * @private
     * @returns {THREE.Texture}
     */
    createParticleTexture() {
        const { SIZE, GRADIENT } = Sun.CONFIG.TEXTURE;
        const canvas = document.createElement('canvas');
        canvas.width = SIZE;
        canvas.height = SIZE;
        
        const ctx = canvas.getContext('2d');
        const center = SIZE / 2;
        const gradient = ctx.createRadialGradient(
            center, center, 0,
            center, center, center
        );

        gradient.addColorStop(GRADIENT.INNER.STOP, GRADIENT.INNER.COLOR);
        gradient.addColorStop(GRADIENT.MIDDLE.STOP, GRADIENT.MIDDLE.COLOR);
        gradient.addColorStop(GRADIENT.OUTER.STOP, GRADIENT.OUTER.COLOR);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, SIZE, SIZE);
        
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    update(deltaTime) {
        // Update shader time for all sun planes
        this.group.children.forEach(child => {
            if (child.material && child.material.uniforms) {
                child.material.uniforms.time.value += deltaTime;
            }
        });
        
        // Update particles
        const positions = this.particles.geometry.attributes.position.array;
        const velocities = this.particles.userData.velocities;
        const lifetimes = this.particles.userData.lifetimes;
        
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += velocities[i] * deltaTime * 60;
            positions[i + 1] += velocities[i + 1] * deltaTime * 60;
            positions[i + 2] += velocities[i + 2] * deltaTime * 60;
            
            const idx = i / 3;
            lifetimes[idx] += deltaTime;
            
            if (lifetimes[idx] > 1.0) {
                const { pos, vel } = this.createSphericalParticle(0.15);
                
                positions[i] = pos.x;
                positions[i + 1] = pos.y;
                positions[i + 2] = pos.z;
                
                velocities[i] = vel.x;
                velocities[i + 1] = vel.y;
                velocities[i + 2] = vel.z;
                
                lifetimes[idx] = 0;
            }
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    updateOrientation(camera) {
        this.group.quaternion.copy(camera.quaternion);
    }

    // Static shader code
    static vertexShader = `
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    static fragmentShader = `
        varying vec2 vUv;
        uniform float time;
        
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main() {
            vec2 center = vec2(0.5, 0.5);
            float dist = length(vUv - center);
            
            vec3 sunColor = vec3(1.0, 0.9, 0.5);
            float intensity = 1.0 - smoothstep(0.0, 0.3, dist);
            
            float noiseVal = noise(vUv * 6.0 + time * 0.1);
            float noiseVal2 = noise(vUv * 12.0 - time * 0.15);
            intensity *= 1.0 + 0.15 * noiseVal * noiseVal2;
            
            float corona = pow(1.0 - dist, 2.0);
            corona *= 1.0 + 0.2 * noiseVal;
            
            vec3 coreColor = sunColor;
            vec3 coronaColor = vec3(1.0, 0.6, 0.2);
            vec3 finalColor = mix(coronaColor, coreColor, intensity);
            finalColor *= (intensity + corona * 0.4);
            
            float alpha = smoothstep(1.0, 0.0, dist * 2.0);
            alpha *= 0.8;
            
            gl_FragColor = vec4(finalColor, alpha);
        }
    `;
} 