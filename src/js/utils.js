// Copyright (C) 2025 PLAYERUNKNOWN Productions

import * as THREE from 'three';

export function getLatLong(point) {
    const lat = Math.asin(point.y); 
    const long = -Math.atan2(point.x, point.z);
    return {
        lat: THREE.MathUtils.radToDeg(lat),
        long: THREE.MathUtils.radToDeg(long)
    };
}

export function calculateCameraOrientation(latitude, longitude) {
    latitude = Math.max(-90, Math.min(90, latitude));
    longitude = ((longitude + 180) % 360) - 180;

    const latRad = THREE.MathUtils.degToRad(latitude);
    const lonRad = THREE.MathUtils.degToRad(longitude);

    const x = Math.cos(latRad) * Math.sin(lonRad);
    const y = Math.sin(latRad);
    const z = Math.cos(latRad) * Math.cos(lonRad);

    const normal = new THREE.Vector3(x, y, z).normalize();
    const up = new THREE.Vector3(0.0, 1.0, 0.0);
    const forward = new THREE.Vector3(0.0, 0.0, -1.0);

    let right = new THREE.Vector3().crossVectors(up, normal).normalize();
    const recalculatedForward = new THREE.Vector3().crossVectors(normal, right).normalize();

    const rotationMatrix = new THREE.Matrix3();
    rotationMatrix.set(
        right.x, right.y, right.z,
        normal.x, normal.y, normal.z,
        recalculatedForward.x, recalculatedForward.y, recalculatedForward.z
    );

    const yaw = Math.atan2(rotationMatrix.elements[2], rotationMatrix.elements[8]);
    const pitch = Math.atan2(-rotationMatrix.elements[5], Math.sqrt(
        Math.pow(rotationMatrix.elements[3], 2) + Math.pow(rotationMatrix.elements[4], 2)
    ));
    const roll = Math.atan2(rotationMatrix.elements[3], rotationMatrix.elements[4]);

    return { yaw, pitch, roll };
}
