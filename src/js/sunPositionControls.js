import { Sun } from './sun';

/**
 * Controls for adjusting the sun's position in debug mode
 * Provides UI sliders to modify the sun's phi (vertical) and theta (horizontal) angles
 */
export class SunPositionControls {
    /**
     * @param {Sun} sun - The sun instance to control
     */
    constructor(sun) {
        this.sun = sun;
        this.element = this.createControls();
    }

    /**
     * Creates and configures the control panel UI elements
     * @returns {HTMLElement} The main controls container
     */
    createControls() {
        const controls = this.createControlsContainer();
        
        // Create sliders for both phi and theta controls
        const phiControls = this.createSliderControl({
            label: 'Phi Offset:',
            min: 0,
            max: 180,
            value: this.sun.phiOffset,
            onChange: (value) => this.sun.setPhiOffset(value)
        });

        const thetaControls = this.createSliderControl({
            label: 'Theta Offset:',
            min: 0,
            max: 360,
            value: this.sun.thetaOffset,
            onChange: (value) => this.sun.setThetaOffset(value)
        });

        controls.appendChild(phiControls);
        controls.appendChild(thetaControls);
        
        return controls;
    }

    /**
     * Creates the main container for the controls with proper styling
     * @returns {HTMLElement} Configured container element
     */
    createControlsContainer() {
        const controls = document.createElement('div');
        controls.className = 'sun-position-controls';
        this.applyVisibility(controls);
        return controls;
    }

    /**
     * Creates a slider control group with label and value display
     * @param {Object} config - Configuration object for the slider
     * @param {string} config.label - Label text for the slider
     * @param {number} config.min - Minimum value
     * @param {number} config.max - Maximum value
     * @param {number} config.value - Initial value
     * @param {Function} config.onChange - Callback for value changes
     * @returns {HTMLElement} Container with the complete slider control
     */
    createSliderControl({ label, min, max, value, onChange }) {
        const container = document.createElement('div');
        
        // Create and configure label
        const labelElement = document.createElement('label');
        labelElement.textContent = label;
        
        // Create and configure slider
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = min.toString();
        slider.max = max.toString();
        slider.step = '1';
        slider.value = value.toString();
        
        // Create value display
        const valueDisplay = document.createElement('span');
        valueDisplay.textContent = value.toFixed(1);
        
        // Set up event handling
        slider.addEventListener('input', (e) => {
            const newValue = parseFloat(e.target.value);
            onChange(newValue);
            valueDisplay.textContent = newValue.toFixed(1);
        });
        
        // Assemble the control group
        container.appendChild(labelElement);
        container.appendChild(slider);
        container.appendChild(valueDisplay);
        
        return container;
    }

    /**
     * Adds the control panel to the specified parent element
     * @param {HTMLElement} parent - Parent element to attach controls to (defaults to document.body)
     */
    addToDocument(parent = document.body) {
        parent.appendChild(this.element);
    }

    /**
     * Updates the visibility of the controls based on debug mode
     */
    updateVisibility() {
        if (this.element) {
            this.applyVisibility(this.element);
        }
    }

    /**
     * Applies visibility styles to an element based on debug mode
     * @param {HTMLElement} element - Element to update visibility
     */
    applyVisibility(element) {
        const isVisible = Sun.isDebugMode();
        element.style.display = isVisible ? 'block' : 'none';
        element.style.visibility = isVisible ? 'visible' : 'hidden';
        element.style.opacity = isVisible ? '1' : '0';
    }
} 