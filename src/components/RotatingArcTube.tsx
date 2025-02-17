'use client';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface RotatingArcTubeProps {
  radius?: number; // 호 반지름
  tubeThickness?: number; // 호의 굵기 (tube 반지름)
  segments?: number; // 호를 구성하는 세그먼트 수
  axis?: [number, number, number]; // 회전 축
  speed?: number; // 회전 속도
  color?: string; // 띠(재질) 기본 색상
  emissive?: string; // 빛(에미시브) 색상
  emissiveIntensity?: number; // 빛 강도
  initialRotation?: [number, number, number];
}

/**
 * (1) Arc(0~2π) 경로를 3D TubeGeometry로 생성,
 * (2) 두껍고 빛나는 호(띠)를 Mesh로 렌더,
 * (3) 자전(rotateOnAxis)으로 계속 회전시키는 컴포넌트
 */
export default function RotatingArcTube({
  radius = 300,
  tubeThickness = 10,
  segments = 64,
  axis = [0, 1, 0],
  speed = 0.3,
  color = '#8e44ad',
  emissive = '#ff00ff',
  emissiveIntensity = 0.2,
  initialRotation = [0, 0, 0],
}: RotatingArcTubeProps) {
  const groupRef = useRef<THREE.Group>(null);

  // 회전 축
  const axisVec = useMemo(() => {
    return new THREE.Vector3(...axis).normalize();
  }, [axis]);

  // 초기 회전
  const initEuler = useMemo(() => {
    const [rx, ry, rz] = initialRotation;
    return new THREE.Euler(rx, ry, rz);
  }, [initialRotation]);

  // 호 경로를 나타내는 곡선(curve)
  // 여기서는 0~2π 전체를 Arc로 생성
  // -> 원형 호
  const curve = useMemo(() => {
    // CatmullRomCurve3에 사용할 점을 만들거나,
    // 또는 "CustomCurve"를 사용해도 됨.
    // 여기선 간단히 점배열로 호 1바퀴를 만든다.
    const points: THREE.Vector3[] = [];
    const pointCount = segments + 1;
    for (let i = 0; i < pointCount; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = radius * Math.cos(t);
      const y = radius * Math.sin(t);
      const z = 0;
      const vec = new THREE.Vector3(x, y, z);
      // 초기 회전 적용
      vec.applyEuler(initEuler);
      points.push(vec);
    }
    // CatmullRomCurve3로 생성 (closed=true -> 종단점 연결)
    const c = new THREE.CatmullRomCurve3(points, true);
    return c;
  }, [radius, segments, initEuler]);

  // TubeGeometry
  const geometry = useMemo(() => {
    // TubeGeometry(경로, tubularSegments, 두께, radialSegments, closed)
    // radialSegments=8~16 정도
    return new THREE.TubeGeometry(curve, segments * 2, tubeThickness, 16, true);
  }, [curve, tubeThickness, segments]);

  // 회전
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotateOnAxis(axisVec, speed * delta);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
          // 반투명/투과 설정
          transparent
          opacity={0.8}
          transmission={0.3} // 유리/젤리 느낌
          thickness={2}
          ior={1.2}
          roughness={0.2}
          metalness={0}
          clearcoat={0.4}
          clearcoatRoughness={0.1}
          envMapIntensity={1.0}
          // 그림자 수신/발생
        />
      </mesh>
    </group>
  );
}
