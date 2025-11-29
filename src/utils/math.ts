import { Vector3 } from 'three';

export function latLngToVector(lat: number, lng: number, radius: number = 1): Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(Math.sin(phi) * Math.cos(theta));
    const z = Math.sin(phi) * Math.sin(theta);
    const y = Math.cos(phi);
    return new Vector3(x, y, z).multiplyScalar(radius);
}
