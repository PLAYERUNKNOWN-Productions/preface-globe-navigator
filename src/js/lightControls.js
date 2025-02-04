import * as THREE from 'three';
import { Sun } from './sun';

export class LightControls {
    constructor(container, onUpdate, sun) {
        this.container = container;
        this.onUpdate = onUpdate;
        this.sun = sun;
        this.lightPosition = new THREE.Vector3(5, 0, 0);
        this.lightIntensity = 1.0;
        this.sprite = null;
        this.camera = null;
        this.controls = null;
        this.createControls();
    }

    createControls() {
        this.controls = document.createElement('div');
        this.controls.className = 'light-controls';
        
        // Set initial visibility based on debug mode
        const isVisible = Sun.isDebugMode();
        this.controls.style.display = isVisible ? 'block' : 'none';
        this.controls.style.visibility = isVisible ? 'visible' : 'hidden';
        this.controls.style.opacity = isVisible ? '1' : '0';

        // Add intensity control
        this.createIntensityControl(this.controls);
        
        // Add phi offset control
        this.createPhiControl(this.controls);
        
        // Add theta offset control
        this.createThetaControl(this.controls);

        this.container.appendChild(this.controls);
    }

    createIntensityControl(controls) {
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = 'Light Intensity:';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '2';
        slider.step = '0.1';
        slider.value = this.lightIntensity;
        
        const value = document.createElement('span');
        value.textContent = this.lightIntensity.toFixed(1);
        
        slider.addEventListener('input', (e) => {
            this.lightIntensity = parseFloat(e.target.value);
            value.textContent = this.lightIntensity.toFixed(1);
            this.onUpdate(this.lightPosition, this.lightIntensity);
        });
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(value);
        controls.appendChild(container);
    }

    createPhiControl(controls) {
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = 'Phi Offset:';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '180';
        slider.step = '1';
        slider.value = this.sun.phiOffset;
        
        const value = document.createElement('span');
        value.textContent = this.sun.phiOffset.toFixed(1);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.sun.setPhiOffset(val);
            value.textContent = val.toFixed(1);
        });
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(value);
        controls.appendChild(container);
    }

    createThetaControl(controls) {
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = 'Theta Offset:';
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = '0';
        slider.max = '360';
        slider.step = '1';
        slider.value = this.sun.thetaOffset;
        
        const value = document.createElement('span');
        value.textContent = this.sun.thetaOffset.toFixed(1);
        
        slider.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            this.sun.setThetaOffset(val);
            value.textContent = val.toFixed(1);
        });
        
        container.appendChild(label);
        container.appendChild(slider);
        container.appendChild(value);
        controls.appendChild(container);
    }

    setSprite(sprite) {
        this.sprite = sprite;
    }

    setCamera(camera) {
        this.camera = camera;
    }

    update() {
        // Update sprite position if it exists
        if (this.sprite) {
            this.sprite.position.copy(this.lightPosition);
        }
    }

    updateVisibility() {
        if (this.controls) {
            const isVisible = Sun.isDebugMode();
            this.controls.style.display = isVisible ? 'block' : 'none';
            this.controls.style.visibility = isVisible ? 'visible' : 'hidden';
            this.controls.style.opacity = isVisible ? '1' : '0';
        }
    }
} 