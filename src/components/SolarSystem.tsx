'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CustomStarsPlanet from './CustomStarsPlanet';
import { Stars } from '@react-three/drei';
import DebrisRing from './DebrisRing';

interface OrbitProps {
  radius: number;
  color?: string;
  tubeThickness?: number;
}

/**
 * 공전 궤도(링)를 표시하기 위해 TubeGeometry 사용
 */
function OrbitRing({
  radius,
  color = '#888',
  tubeThickness = 1.5,
}: OrbitProps) {
  const segments = 128;
  const curve = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius,
        ),
      );
    }
    return new THREE.CatmullRomCurve3(points, true);
  }, [radius]);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, segments, tubeThickness, 8, true);
  }, [curve, segments, tubeThickness]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color={color}
        emissive='#333'
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

interface PlanetProps {
  orbitRadius: number;
  orbitSpeed: number; // 공전 속도
  rotationSpeed: number; // 자전 속도
  planetColor?: string;
  planetSize?: number;
  initialAngle?: number; // 초기 각도 (0 ~ 2π)
  count: number;
}

/**
 * 행성이 태양 중심을 공전하면서, 자체 자전도 하는 컴포넌트
 */
function OrbitingPlanet({
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  planetSize = 10,
  initialAngle = Math.random() * Math.PI * 2, // 🌟 랜덤한 초기 각도 적용
  count,
}: PlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);

  // 초기 시작 위치를 랜덤한 각도로 설정
  const initialX = Math.cos(initialAngle) * orbitRadius;
  const initialZ = Math.sin(initialAngle) * orbitRadius;

  // 매 프레임마다 공전 & 자전
  useFrame((state, delta) => {
    if (orbitRef.current) {
      // 공전: Y축 중심으로 orbitSpeed
      orbitRef.current.rotation.y += orbitSpeed * delta;
    }
    if (planetRef.current) {
      // 자전
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
  });

  return (
    <group ref={orbitRef}>
      {/* 초기 위치를 (x, 0, z)로 설정 */}
      <mesh ref={planetRef} position={[initialX, 0, initialZ]}>
        {/* <sphereGeometry args={[planetSize, 32, 32]} />
        <meshStandardMaterial
          color={planetColor}
          roughness={0.4}
          metalness={0}
        /> */}
        <Stars
          radius={planetSize}
          depth={10}
          count={count}
          factor={5}
          saturation={0}
          fade
        />
      </mesh>

      {/* 궤도 링 */}
      <OrbitRing radius={orbitRadius} />
    </group>
  );
}

/**
 * SolarSystem: 태양 + 4개 행성
 */
export default function SolarSystem() {
  return (
    <group>
      <CustomStarsPlanet
        radius={300}
        starCount={300000}
        rotationSpeed={0.01}
        color1='#ffffff'
        color2='#ffddff'
        minSize={2}
        maxSize={6}
        fade={true} // 별 가장자리 fade on/off
      />
      <DebrisRing
        radius={400}
        ringWidth={10}
        axis={[0, 1, 0]} // 수직 축
        tilt={[1, 0, 1]} // 기울기 없음
        rotateSpeed={0.3}
        color='#ff00ff'
        count={100000}
      />
      <DebrisRing
        radius={400}
        ringWidth={10}
        axis={[1, 0, 0]} // X축
        tilt={[Math.PI / 2, 0, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={100000}
      />
      <DebrisRing
        radius={400}
        ringWidth={10}
        axis={[1, 0, 1]} // 대각 축
        tilt={[0, Math.PI / 2, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={100000}
      />
      <DebrisRing
        radius={400}
        ringWidth={10}
        axis={[1, 1, 0]} // 또 다른 축
        tilt={[Math.PI / 3, Math.PI / 4, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={100000}
      />

      {/* 🌍 행성들 - 랜덤 초기 각도 적용 */}
      <OrbitingPlanet
        orbitRadius={800}
        orbitSpeed={0.4}
        rotationSpeed={1}
        planetColor='#FFFFFF'
        planetSize={3}
        count={8000}
      />
      <OrbitingPlanet
        orbitRadius={900}
        orbitSpeed={0.3}
        rotationSpeed={0.7}
        planetColor='#FFFFFF'
        planetSize={5}
        count={10000}
      />
      <OrbitingPlanet
        orbitRadius={1000}
        orbitSpeed={0.25}
        rotationSpeed={0.8}
        planetColor='#FFFFFF'
        planetSize={7}
        count={15000}
      />
      <OrbitingPlanet
        orbitRadius={1100}
        orbitSpeed={0.2}
        rotationSpeed={1.2}
        planetColor='#FFFFFF'
        planetSize={9}
        count={30000}
      />
    </group>
  );
}
