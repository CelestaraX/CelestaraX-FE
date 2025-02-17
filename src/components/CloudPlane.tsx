'use client';
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TextureLoader } from 'three';

interface CloudPlaneProps {
  textureUrl: string;
  position?: [number, number, number];
  rotationSpeed?: number;
  opacity?: number;
  scale?: number;
}

export default function CloudPlane({
  textureUrl,
  position = [0, 0, 0],
  rotationSpeed = 0.001,
  opacity = 1,
  scale = 1,
}: CloudPlaneProps) {
  // 만약 meshRef가 필요 없으면 지우세요
  const meshRef = useRef<THREE.Mesh>(null);

  // 만약 회전 애니메이션이 필요하면
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += rotationSpeed;
    }
  });

  // 텍스처 로드
  const texture = new TextureLoader().load(textureUrl);

  return (
    <mesh ref={meshRef} position={position} scale={[scale, scale, scale]}>
      <planeGeometry args={[10, 10]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}
