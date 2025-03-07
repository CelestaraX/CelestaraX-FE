'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PlanetProps {
  rotationSpeed: number;
  planetSize?: number;
  geometries: number;
  color: string;
}

export function Planet({
  rotationSpeed,
  planetSize = 10,
  geometries,
  color,
}: PlanetProps) {
  const planetRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  const geometriesType = [
    new THREE.SphereGeometry(planetSize, 64, 64),
    new THREE.DodecahedronGeometry(planetSize),
    new THREE.TetrahedronGeometry(planetSize),
    new THREE.OctahedronGeometry(planetSize),
    new THREE.IcosahedronGeometry(planetSize),
    new THREE.TorusKnotGeometry(planetSize * 0.5, planetSize * 0.2, 128, 32),
  ];

  return (
    <mesh ref={planetRef} geometry={geometriesType[geometries]}>
      <meshStandardMaterial
        color={color}
        emissive={1}
        emissiveIntensity={1}
        metalness={0.2}
        roughness={0.3}
        transparent
        opacity={0.5}
      />
    </mesh>
  );
}
