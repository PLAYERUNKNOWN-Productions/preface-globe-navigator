// Copyright (C) 2025 PLAYERUNKNOWN Productions

import * as THREE from 'three';

export class TextureLoader {
    constructor() {
        this.planets = [];
    }

    async init() {
        try {
            const response = await fetch('./planets.json');
            const data = await response.json();
            this.planets = data.planets;
            console.log(`Loaded ${this.planets.length} planets from planets.json`);
        } catch (error) {
            console.error('Failed to load planets.json, falling back to default list:', error);
            // Fallback to original hardcoded list if fetch fails
            this.planets = ["bob"];
        }
    }

    async loadTextures(planet_name) {
        // const directions  ['posx', 'negx', 'posy', 'negy', 'posz', 'negz']
        const urls = [0, 1, 2, 3, 4, 5].map( i => `./images/${planet_name}_${i}.png`)

        const loader = new THREE.CubeTextureLoader();
        const cubeTexture = await new Promise(resolve => {
            loader.load(urls, texture => {
                texture.colorSpace = THREE.SRGBColorSpace;
                resolve(texture);
            });
        });

        return cubeTexture;
    }
} 