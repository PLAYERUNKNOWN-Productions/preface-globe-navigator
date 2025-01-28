import * as THREE from 'three';

export class LightControls {
    constructor(container, onUpdate) {
        this.container = container;
        this.onUpdate = onUpdate;
        this.lightPosition = new THREE.Vector3(5, 0, 0);
        this.autoOrbit = false;
        this.orbitSpeed = 0.001;
        this.lightIntensity = 1.0;
        this.createControls();
    }

    createControls() {
        const controls = document.createElement('div');
        controls.className = 'light-controls';
        
        // Create sliders for X, Y, Z coordinates
        const axes = ['x', 'y', 'z'];
        axes.forEach(axis => {
            const label = document.createElement('label');
            label.textContent = `Light ${axis.toUpperCase()}:`;
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '-10';
            slider.max = '10';
            slider.step = '0.1';
            slider.value = this.lightPosition[axis];
            
            const value = document.createElement('span');
            value.textContent = this.lightPosition[axis].toFixed(1);
            
            slider.addEventListener('input', (e) => {
                this.lightPosition[axis] = parseFloat(e.target.value);
                value.textContent = this.lightPosition[axis].toFixed(1);
                this.onUpdate(this.lightPosition, this.lightIntensity);
            });
            
            const container = document.createElement('div');
            container.appendChild(label);
            container.appendChild(slider);
            container.appendChild(value);
            controls.appendChild(container);
        });

        // Add auto-orbit toggle
        const orbitContainer = document.createElement('div');
        const orbitLabel = document.createElement('label');
        orbitLabel.textContent = 'Auto Orbit:';
        const orbitCheckbox = document.createElement('input');
        orbitCheckbox.type = 'checkbox';
        orbitCheckbox.checked = this.autoOrbit;
        orbitCheckbox.addEventListener('change', (e) => {
            this.autoOrbit = e.target.checked;
        });
        orbitContainer.appendChild(orbitLabel);
        orbitContainer.appendChild(orbitCheckbox);
        controls.appendChild(orbitContainer);

        // Add intensity control
        this.createIntensityControl(controls);

        this.container.appendChild(controls);
    }

    createIntensityControl(controls) {
        const container = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = 'Intensity:';
        
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

    update() {
        if (this.autoOrbit) {
            // Rotate light around Y axis
            const x = this.lightPosition.x;
            const z = this.lightPosition.z;
            const cos = Math.cos(this.orbitSpeed);
            const sin = Math.sin(this.orbitSpeed);
            
            this.lightPosition.x = x * cos - z * sin;
            this.lightPosition.z = x * sin + z * cos;
            
            this.onUpdate(this.lightPosition, this.lightIntensity);
        }
    }
} 