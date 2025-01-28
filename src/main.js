// Copyright (C) 2024 PLAYERUNKNOWN Productions

import * as THREE from 'three';
import { createScene, createStars } from './js/scene';
import { Globe } from './js/sphere';
import { EventManager } from './js/eventHandlers';
import { TextureLoader } from './js/textureLoader';
import { LightControls } from './js/lightControls';
import './styles/main.css';

class App {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.init();
    }

    async init() {
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

        // Load textures
        const textureLoader = new TextureLoader();
        const cubeTexture = await textureLoader.loadTextures();
        this.globe.setTexture(cubeTexture);

        // Setup event handling
        this.eventManager = new EventManager(
            this.container,
            this.scene,
            this.camera,
            this.renderer,
            this.group,
            this.globe.mesh,
            this.cursor
        );

        // Create light controls and pass the sprite
        this.lightControls = new LightControls(
            this.container,
            (position, intensity) => {
                this.globe.material.uniforms.lightPosition.value.copy(position);
                this.globe.setLightIntensity(intensity);
            }
        );
        this.lightControls.setSprite(this.sun.group);

        // Set initial light position
        this.sun.group.position.copy(this.lightControls.lightPosition);

        // Start animation loop
        this.animate();
        
        // Fade in the scene
        this.globe.fadeIn();
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
