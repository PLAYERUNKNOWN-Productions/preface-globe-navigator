// Copyright (C) 2024 PLAYERUNKNOWN Productions

import * as THREE from 'three';
import { getLatLong, calculateCameraOrientation } from './utils';

export class EventManager {
    constructor(container, scene, camera, renderer, group, sphere, cursor) {
        this.container = container;
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.group = group;
        this.sphere = sphere;
        this.cursor = cursor;
        
        // DOM elements
        this.positionInfo = document.getElementById('position-info');
        this.deepLink = document.getElementById('deep-link');
        this.deepLinkAnchor = document.getElementById('deep-link-anchor');
        
        // State
        this.rotationSpeed = 0.001;
        this.autoRotate = true;
        this.isDragging = false;
        this.isSphereHovered = false;
        this.previousMousePosition = { x: 0.0, y: 0.0 };
        
        // Camera controls
        this.minDistance = 1.5;
        this.maxDistance = 10;
        this.currentDistance = camera.position.length();
        
        // Raycaster setup
        this.raycaster = new THREE.Raycaster();
        this.raycaster.params.Line.threshold = 0.001;
        this.raycaster.params.Points.threshold = 0.001;
        this.mouse = new THREE.Vector2();
        
        // Bind methods to preserve 'this' context
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleMouseLeave = this.handleMouseLeave.bind(this);
        this.handleWheel = this.handleWheel.bind(this);
        this.handleDeepLinkHover = this.handleDeepLinkHover.bind(this);
        this.handleDeepLinkClick = this.handleDeepLinkClick.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Create and setup arrow container
        this.createArrowContainer();
        
        this.setupEventListeners();
        this.setupMarkers();
    }

    setupMarkers() {
        // Create marker meshes
        this.marker = this.createMarkerMesh();
        this.markerCore = this.createMarkerCoreMesh();
        this.clickEffect = this.createClickEffectMesh();
        
        this.group.add(this.marker);
        this.group.add(this.markerCore);
        this.group.add(this.clickEffect);
        
        this.markerAnimationStartTime = 0;
        this.isMarkerAnimating = false;
    }

    createMarkerMesh() {
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFF8800,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        return mesh;
    }

    createMarkerCoreMesh() {
        const geometry = new THREE.SphereGeometry(0.005, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthTest: false,
            depthWrite: false
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        mesh.renderOrder = 1;
        return mesh;
    }

    createClickEffectMesh() {
        const geometry = new THREE.SphereGeometry(0.02, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false;
        return mesh;
    }

    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', this.handleResize);
        
        // Mouse events
        this.container.addEventListener('mousemove', this.handleMouseMove);
        this.container.addEventListener('click', this.handleClick);
        this.container.addEventListener('mousedown', this.handleMouseDown);
        this.container.addEventListener('mouseup', this.handleMouseUp);
        this.container.addEventListener('mouseleave', this.handleMouseLeave);
        this.container.addEventListener('wheel', this.handleWheel);
        
        // Deep link events
        this.deepLink.addEventListener('mouseenter', this.handleDeepLinkHover);
        this.deepLink.addEventListener('click', this.handleDeepLinkClick);
    }

    // Event handler methods...
    handleResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    handleMouseMove(event) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.sphere);

        if (intersects.length > 0) {
            const point = intersects[0].point.clone();
            point.applyMatrix4(this.group.matrixWorld.clone().invert());
            const coords = getLatLong(point.normalize());
            this.positionInfo.textContent = `Lat: ${coords.lat.toFixed(2)}° Long: ${coords.long.toFixed(2)}°`;
            
            this.cursor.position.copy(point.multiplyScalar(1.01));
            this.cursor.visible = true;
            
            if (!this.isDragging && !this.isSphereHovered) {
                this.isSphereHovered = true;
                this.container.classList.add('hovering-sphere');
            }
        } else {
            this.positionInfo.textContent = 'Lat: -- Long: --';
            this.cursor.visible = false;
            
            if (!this.isDragging && this.isSphereHovered) {
                this.isSphereHovered = false;
                this.container.classList.remove('hovering-sphere');
            }
        }

        if (this.isDragging) {
            this.handleDrag(event);
        }
    }

    handleClick(event) {
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / this.container.clientWidth) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / this.container.clientHeight) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.sphere);

        if (intersects.length > 0) {
            this.handleSphereClick(intersects[0].point);
        } else {
            this.handleOutsideClick();
        }
    }

    handleSphereClick(point) {
        point.applyMatrix4(this.group.matrixWorld.clone().invert());
        const normalizedPoint = point.normalize();
        const coords = getLatLong(normalizedPoint);
        
        this.updateDeepLink(coords);
        this.updateMarker(normalizedPoint);
        
        // Show arrow and hide it after delay
        this.arrowContainer.classList.add('visible');
        setTimeout(() => {
            this.arrowContainer.classList.remove('visible');
        }, 5000);
    }

    handleOutsideClick() {
        this.deepLink.classList.remove('visible');
        this.deepLinkAnchor.classList.remove('visible');
        this.arrowContainer.classList.remove('visible');
        this.marker.visible = false;
        this.markerCore.visible = false;
        this.isMarkerAnimating = false;
    }

    updateMarkerAnimation() {
        if (this.isMarkerAnimating) {
            const elapsed = performance.now() - this.markerAnimationStartTime;
            const pulseDuration = 2000;
            const pulseProgress = (elapsed % pulseDuration) / pulseDuration;
            
            const baseScale = 1;
            const pulseScale = 3;
            const scale = baseScale + Math.sin(pulseProgress * Math.PI) * (pulseScale - baseScale);
            
            this.marker.scale.set(scale, scale, scale);
            this.marker.material.opacity = 0.8 * (1 - pulseProgress);
            
            const coreScale = 1 + Math.sin(pulseProgress * Math.PI * 2) * 0.2;
            this.markerCore.scale.set(coreScale, coreScale, coreScale);
            this.markerCore.material.opacity = 0.8 + Math.sin(pulseProgress * Math.PI * 2) * 0.2;
        }
    }

    handleMouseDown(event) {
        const rect = this.container.getBoundingClientRect();
        this.previousMousePosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        this.isDragging = true;
        this.autoRotate = false;
        this.arrowContainer.classList.remove('visible');
        
        // Update cursor state for dragging
        if (this.isSphereHovered) {
            this.container.classList.remove('hovering-sphere');
            this.container.classList.add('dragging-sphere');
        }
    }

    handleMouseUp() {
        this.isDragging = false;
        // Restore cursor state
        this.container.classList.remove('dragging-sphere');
        if (this.isSphereHovered) {
            this.container.classList.add('hovering-sphere');
        }
    }

    handleMouseLeave() {
        this.isDragging = false;
        this.cursor.visible = false;
        this.positionInfo.textContent = 'Lat: -- Long: --';
        // Reset cursor states
        this.container.classList.remove('hovering-sphere', 'dragging-sphere');
        this.isSphereHovered = false;
    }

    handleWheel(event) {
        event.preventDefault();
        
        const zoomSpeed = 0.001;
        const delta = event.deltaY * zoomSpeed;
        
        this.currentDistance = Math.max(this.minDistance, 
            Math.min(this.maxDistance, this.currentDistance + delta));
        
        const direction = this.camera.position.clone().normalize();
        this.camera.position.copy(direction.multiplyScalar(this.currentDistance));
        
        this.camera.lookAt(0, 0, 0);
    }

    handleDeepLinkHover() {
        if (this.deepLinkAnchor.dataset.lat && this.deepLinkAnchor.dataset.long) {
            const originalText = this.deepLinkAnchor.textContent;
            this.deepLinkAnchor.textContent = 
                `Lat: ${this.deepLinkAnchor.dataset.lat}° Long: ${this.deepLinkAnchor.dataset.long}°`;
            
            this.deepLink.addEventListener('mouseleave', () => {
                this.deepLinkAnchor.textContent = originalText;
            }, { once: true });
        }
    }

    handleDeepLinkClick() {
        if (this.deepLinkAnchor.href) {
            window.location.href = this.deepLinkAnchor.href;
        }
    }

    handleDrag(event) {
        const rect = this.container.getBoundingClientRect();
        const currentPosition = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
        
        const deltaMove = {
            x: currentPosition.x - this.previousMousePosition.x,
            y: currentPosition.y - this.previousMousePosition.y
        };
        
        const rotationSpeed = 0.005;
        
        // Get camera's right and up vectors in world space
        const cameraRight = new THREE.Vector3(1, 0, 0);
        cameraRight.applyQuaternion(this.camera.quaternion);
        
        const cameraUp = new THREE.Vector3(0, 1, 0);
        cameraUp.applyQuaternion(this.camera.quaternion);
        
        // Create rotation quaternions
        const horizontalRotation = new THREE.Quaternion();
        horizontalRotation.setFromAxisAngle(cameraUp, deltaMove.x * rotationSpeed);
        
        const verticalRotation = new THREE.Quaternion();
        verticalRotation.setFromAxisAngle(cameraRight, deltaMove.y * rotationSpeed);
        
        // Combine rotations
        const combinedRotation = new THREE.Quaternion();
        combinedRotation.multiplyQuaternions(horizontalRotation, verticalRotation);
        
        // Apply to group
        this.group.quaternion.multiplyQuaternions(combinedRotation, this.group.quaternion);
        
        this.previousMousePosition = currentPosition;
    }

    updateDeepLink(coords) {
        const lat_rad = THREE.MathUtils.degToRad(coords.lat);
        const long_rad = THREE.MathUtils.degToRad(coords.long);
        const camera_angles = calculateCameraOrientation(coords.lat, coords.long);
        
        this.deepLink.classList.add('visible');
        this.deepLinkAnchor.classList.add('visible');
        
        this.deepLinkAnchor.textContent = 'Teleport to this location';
        this.deepLinkAnchor.dataset.lat = coords.lat.toFixed(2);
        this.deepLinkAnchor.dataset.long = coords.long.toFixed(2);
        this.deepLinkAnchor.href = 
            `preface://bookmarks?longitude=${long_rad}&latitude=${lat_rad}&altitude=6376942.586887&rotation=${camera_angles.yaw},${camera_angles.pitch},${camera_angles.roll}&name=preface_teleport`;
    }

    updateMarker(normalizedPoint) {
        this.marker.position.copy(normalizedPoint.multiplyScalar(1.01));
        this.markerCore.position.copy(normalizedPoint.multiplyScalar(1.011));
        this.marker.visible = true;
        this.markerCore.visible = true;
        this.marker.scale.set(1, 1, 1);
        this.markerAnimationStartTime = performance.now();
        this.isMarkerAnimating = true;
    }

    createArrowContainer() {
        this.arrowContainer = document.createElement('div');
        this.arrowContainer.className = 'arrow-container';
        this.arrowContainer.innerHTML = `
            <div class="arrow-text">CLICK HERE</div>
            <div class="arrow"></div>
        `;
        document.body.appendChild(this.arrowContainer);
    }

    // ... Other handler methods ...
} 