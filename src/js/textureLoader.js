// Copyright (C) 2024 PLAYERUNKNOWN Productions

import * as THREE from 'three';

export class TextureLoader {
    constructor() {
        this.texture_files = {
            'posx': './images/LargeContinent_ReleaseCandidate_2_v2_500_texture.png',
            'negx': './images/LargeContinent_ReleaseCandidate_2_v2_500_texture.png',
            'posy': './images/LargeContinent_1311_v2_500_texture.png',
            'negy': './images/LargeContinent_1311_v2_500_texture.png',
            'posz': './images/LargeContinent_1311_v2_500_texture.png',
            'negz': './images/LargeContinent_ReleaseCandidate_2_v2_500_texture.png'
        };
    }

    async loadTextures() {
        const urls = ['posx', 'negx', 'posy', 'negy', 'posz', 'negz']
            .map(face => this.texture_files[face]);

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