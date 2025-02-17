'use client';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';

interface RotatingArcLineProps {
  radius?: number; // 호(arc) 반지름
  pointsCount?: number; // 호에 뿌릴 점 개수(세밀도)
  initialRotation?: [number, number, number]; // 초기 Euler
  axis?: [number, number, number]; // 회전 축
  speed?: number; // 회전 속도
  color?: string; // 선 색상
  lineWidth?: number; // 선 두께(webGL2 필요)
}

/**
 * "호(arc) 하나를 선(Line)으로 그린 뒤,
 *  1) 초기 회전(Euler)
 *  2) 특정 축으로 계속 회전(useFrame)
 */
export default function RotatingArcLine({
  radius = 1,
  pointsCount = 30,
  initialRotation = [0, 0, 0],
  axis = [0, 1, 0],
  speed = 0.2,
  color = '#8e44ad',
  lineWidth = 2,
}: RotatingArcLineProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 회전 축을 정규화
  const axisVec = useMemo(() => {
    const v = new THREE.Vector3(...axis);
    return v.normalize();
  }, [axis]);

  // 초기 회전 Euler
  const initialEulerObj = useMemo(() => {
    const [rx, ry, rz] = initialRotation;
    return new THREE.Euler(rx, ry, rz);
  }, [initialRotation]);

  // 호(arc) 좌표 계산
  const pointsArray = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i <= pointsCount; i++) {
      const t = (i / pointsCount) * Math.PI * 2;
      const x = radius * Math.cos(t);
      const y = radius * Math.sin(t);
      const z = 0;

      const vec = new THREE.Vector3(x, y, z);
      // 초기 회전
      vec.applyEuler(initialEulerObj);
      arr.push(vec);
    }
    return arr;
  }, [radius, pointsCount, initialEulerObj]);

  // 회전 애니메이션
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotateOnAxis(axisVec, speed * delta);
    }
  });

  return (
    <group ref={groupRef}>
      <Line
        points={pointsArray} // [Vector3, Vector3, ...]
        color={color}
        lineWidth={lineWidth} // webGL2 필요
      />
    </group>
  );
}
