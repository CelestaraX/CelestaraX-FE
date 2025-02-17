'use client';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RotatingStarsPlanetProps {
  radius?: number;
  starCount?: number;
  rotationSpeed?: number;
  color1?: string; // 별 색상 범위 시작
  color2?: string; // 별 색상 범위 끝
  pointSize?: number;
}

/**
 * "구체 내부"를 무작위로 별(Points)로 가득 채우고, 전체를 자전시킴
 */
export default function RotatingStarsPlanet({
  radius = 100,
  starCount = 5000,
  rotationSpeed = 0.01,
  color1 = '#ffffff',
  color2 = '#ffddff',
  pointSize = 2,
}: RotatingStarsPlanetProps) {
  const planetRef = useRef<THREE.Points>(null);

  // 회전 애니메이션
  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed;
    }
  });

  // 무작위 점(별) 생성
  const geometry = useMemo(() => {
    // 각 별의 위치, 색상 버퍼
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorA = new THREE.Color(color1);
    const colorB = new THREE.Color(color2);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      // 구 내부 균등 분포:
      // r^(1/3) * unit sphere
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // 별 색상: color1~color2 랜덤 보간
      tmpColor.copy(colorA).lerp(colorB, Math.random());
      colors[i * 3 + 0] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.computeBoundingSphere();
    return g;
  }, [starCount, radius, color1, color2]);

  return (
    <points ref={planetRef} geometry={geometry}>
      <pointsMaterial
        vertexColors
        size={pointSize}
        sizeAttenuation
        transparent
        depthWrite={false}
      />
    </points>
  );
}
