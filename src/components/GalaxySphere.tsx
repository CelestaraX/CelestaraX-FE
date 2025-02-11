'use client';
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GalaxySphereProps {
  position: [x: number, y: number, z: number];
  color?: string;
  scale?: number;
}

// 은하(행성) 1개를 나타내는 컴포넌트
export default function GalaxySphere({
  position,
  color = '#8e44ad',
  scale = 1,
}: GalaxySphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 프레임마다 살짝 회전 or 진동
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      // 더 재미있는 동작을 원하면 position.y에 sin/cos로 진동 넣을 수도 있음
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      // 기본 scale에다 hover 시 1.2배
      scale={hovered ? scale * 1.2 : scale}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      // 클릭하면 페이지 이동 등 원하는 이벤트를 넣어볼 수도 있음
      onClick={() => window.alert('은하로 이동!')}
    >
      {/* 구체 지오메트리 */}
      <sphereGeometry args={[1, 32, 32]} />
      {/* 머티리얼 (색이나 텍스처 가능). */}
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
