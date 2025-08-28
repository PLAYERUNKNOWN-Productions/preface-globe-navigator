// Copyright (C) 2025 PLAYERUNKNOWN Productions

import * as THREE from 'three';
import { createScene, createStars } from './js/scene';
import { Globe } from './js/sphere';
import { EventManager } from './js/eventHandlers';
import { TextureLoader } from './js/textureLoader';
import { LightControls } from './js/lightControls';
import { SunPositionControls } from './js/sunPositionControls';
import { Sun } from './js/sun';
import './styles/main.css';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.textureLoader = new TextureLoader();
        this.currentPlanetIndex = 0; // Start with Mars1_4358 (index 5 in planets.json)
        this.init();
    }

    async init() {
        // Initialize texture loader first to load planets list
        await this.textureLoader.init();
        
        const { scene, camera, renderer, group, sun } = createScene(this.container);
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = group;
        this.sun = sun;  // Store sun reference

        // Add stars
        const stars = createStars();
        this.group.add(stars);

        // Create cursor
        const cursorGeometry = new THREE.SphereGeometry(0.01, 16, 16);
        const cursorMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0.9,
            side: THREE.FrontSide
        });
        this.cursor = new THREE.Mesh(cursorGeometry, cursorMaterial);
        this.cursor.visible = false;
        this.group.add(this.cursor);

        // Create and setup globe
        this.globe = new Globe();
        this.group.add(this.globe.mesh);

        // Connect sun and globe for lighting
        this.sun.setGlobe(this.globe);

        // Setup planet selector
        this.setupPlanetSelector();

        // Load default texture
        const cubeTexture = await this.textureLoader.loadTextures(this.textureLoader.planets[this.currentPlanetIndex]);
        this.globe.setTexture(cubeTexture);

        // Setup event handling
        this.eventManager = new EventManager(
            this.container,
            this.scene,
            this.camera,
            this.renderer,
            this.group,
            this.globe.mesh,
            this.cursor,
            this.textureLoader.planets[this.currentPlanetIndex]
        );

        // Create light controls and pass the sprite and sun
        this.lightControls = new LightControls(
            this.container,
            (position, intensity) => {
                this.globe.material.uniforms.lightPosition.value.copy(position);
                this.globe.setLightIntensity(intensity);
            },
            this.sun  // Pass sun reference
        );
        this.lightControls.setSprite(this.sun.group);

        // Setup keyboard controls
        this.setupKeyboardControls();

        // Start animation loop
        this.animate();
        
        // Fade in the scene
        this.globe.fadeIn();
    }

    setupPlanetSelector() {
        const select = document.getElementById('planet-select');
        
        // Populate dropdown with planet options
        this.textureLoader.planets.forEach((planet, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = planet;
            // Set current planet as default
            if (index === this.currentPlanetIndex) {
                option.selected = true;
            }
            select.appendChild(option);
        });

        // Handle planet selection change
        select.addEventListener('change', async (e) => {
            const planetIndex = parseInt(e.target.value);
            await this.changePlanet(planetIndex);
        });
    }

    setupKeyboardControls() {
        window.addEventListener('keydown', (e) => {
            if (e.key === 'd') {  // press D to toggle debug mode
                Sun.setDebugMode(!Sun.isDebugMode());
                this.lightControls.updateVisibility();
            } else if (e.key === 'ArrowLeft') {  // Left arrow - previous planet
                e.preventDefault();
                const prevIndex = (this.currentPlanetIndex - 1 + this.textureLoader.planets.length) % this.textureLoader.planets.length;
                this.changePlanet(prevIndex);
            } else if (e.key === 'ArrowRight') {  // Right arrow - next planet
                e.preventDefault();
                const nextIndex = (this.currentPlanetIndex + 1) % this.textureLoader.planets.length;
                this.changePlanet(nextIndex);
            }
        });
    }

    async changePlanet(planetIndex) {
        if (planetIndex === this.currentPlanetIndex) return;
        
        this.currentPlanetIndex = planetIndex;
        const planetName = this.textureLoader.planets[planetIndex];
        
        try {
            // Load new textures
            const cubeTexture = await this.textureLoader.loadTextures(planetName);
            this.globe.setTexture(cubeTexture);
            
            // Update EventManager with new planet name
            this.eventManager.updatePlanetName(planetName);
            
            // Update dropdown selection
            const select = document.getElementById('planet-select');
            select.value = planetIndex;
            
            console.log(`Switched to planet: ${planetName}`);
        } catch (error) {
            console.error(`Failed to load textures for ${planetName}:`, error);
        }
    }

    animate() {
        const deltaTime = 1/60;
        requestAnimationFrame(this.animate.bind(this));
        
        if (this.eventManager.autoRotate) {
            this.group.rotation.y += this.eventManager.rotationSpeed;
        }
        
        // Update light position and sun
        this.lightControls.update();
        this.sun.update(deltaTime);
        this.sun.updateOrientation(this.camera);
        
        this.eventManager.updateMarkerAnimation();
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize the application
new App();
