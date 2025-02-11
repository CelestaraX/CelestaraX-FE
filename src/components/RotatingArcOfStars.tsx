'use client';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface RotatingArcOfStarsProps {
  radius?: number; // 호(arc) 반지름
  pointsCount?: number; // 호에 뿌릴 별 개수
  initialRotation?: [number, number, number]; // 초기 Euler (x, y, z 라디안)
  axis?: [number, number, number]; // 회전 축
  speed?: number; // 회전 속도 (라디안/초)
  color?: string; // 별 색상
  size?: number; // 별 크기
}

/**
 * "별들이 모여 만든 호(arc)"를 그린 뒤,
 * 1) 초기 회전(Euler)
 * 2) 특정 축(axis)으로 계속 회전(useFrame)
 * 로 구현하는 컴포넌트 예시
 */
export default function RotatingArcOfStars({
  radius = 1,
  pointsCount = 30,
  initialRotation = [0, 0, 0],
  axis = [0, 1, 0],
  speed = 0.2,
  color = '#8e44ad',
  size = 0.05,
}: RotatingArcOfStarsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Three.js에서 회전 축은 정규화 벡터가 일반적
  const axisVec = useMemo(() => {
    const v = new THREE.Vector3(...axis);
    return v.normalize();
  }, [axis]);

  // 초기 회전 Euler 객체
  const initialEulerObj = useMemo(() => {
    const [rx, ry, rz] = initialRotation;
    return new THREE.Euler(rx, ry, rz);
  }, [initialRotation]);

  /**
   * 호(arc)에 별들의 좌표를 생성
   * - (x, y, 0) 형태로 원을 만든 뒤,
   * - initialEulerObj로 초기 회전 적용
   */
  const positionsArray = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < pointsCount; i++) {
      const t = (i / pointsCount) * Math.PI * 2;
      const x = radius * Math.cos(t);
      const y = radius * Math.sin(t);
      const z = 0;

      // 각 점(별)의 위치 벡터
      const vec = new THREE.Vector3(x, y, z);
      // 초기 회전 적용
      vec.applyEuler(initialEulerObj);

      arr.push(vec);
    }
    return arr;
  }, [radius, pointsCount, initialEulerObj]);

  /**
   * R3F <Points>에 쓸 Float32Array
   */
  const positionsBuffer = useMemo(() => {
    const buf = new Float32Array(positionsArray.length * 3);
    positionsArray.forEach((v, i) => {
      buf[i * 3 + 0] = v.x;
      buf[i * 3 + 1] = v.y;
      buf[i * 3 + 2] = v.z;
    });
    return buf;
  }, [positionsArray]);

  /**
   * useFrame으로 매 프레임마다 groupRef를 회전축(axisVec)을 기준으로 회전
   */
  useFrame((_, delta) => {
    if (groupRef.current) {
      // rotateOnAxis(축, 라디안)
      groupRef.current.rotateOnAxis(axisVec, speed * delta);
    }
  });

  return (
    <group ref={groupRef}>
      <Points positions={positionsBuffer}>
        <PointMaterial
          size={size} // 별 크기
          sizeAttenuation
          depthWrite={false}
          color={color}
        />
      </Points>
    </group>
  );
}
