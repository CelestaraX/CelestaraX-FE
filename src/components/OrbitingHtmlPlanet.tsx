'use client';
import React, { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitingHtmlPlanetProps } from '@/types';

export default function OrbitingHtmlPlanet({
  file,
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  planetSize,
  initialAngle = 0,
  onPlanetSelect,
}: OrbitingHtmlPlanetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  // 호버/선택 상태
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState(false);

  // 공전 각도 추적
  const angleRef = useRef(initialAngle);

  // 매 프레임: 공전 + 자전
  useFrame((_, delta) => {
    angleRef.current += orbitSpeed * delta;
    const x = orbitRadius * Math.cos(angleRef.current);
    const z = orbitRadius * Math.sin(angleRef.current);

    if (groupRef.current) {
      groupRef.current.position.set(x, 0, z);

      // 자전(행성 회전)
      groupRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  // 마우스 호버 시작
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
  };

  // 호버 끝
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(false);
  };

  // 클릭
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setSelected(true);
    // 클릭하면 외부에 알림 (모달 열기 등)
    onPlanetSelect?.(file);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onPointerDown={handlePointerDown}
      >
        <sphereGeometry args={[planetSize, 32, 32]} />
        <meshStandardMaterial
          color='white'
          // 호버 중 or 선택 상태일 때 발광
          emissive={hovered || selected ? 'yellow' : 'black'}
          emissiveIntensity={hovered ? 1.0 : selected ? 0.5 : 0}
        />
      </mesh>
    </group>
  );
}
