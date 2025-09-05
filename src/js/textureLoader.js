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
        } catch (error) {
            // Fallback to original hardcoded list if fetch fails
            this.planets = ["planet_hd_2025-04"];
        }
    }

    async loadTextures(planet_name) {
        // directions order in array  ['posx', 'negx', 'posy', 'negy', 'posz', 'negz']
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