'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CustomStarsPlanet from './CustomStarsPlanet';
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
interface OrbitingPlanetProps {
  orbitRadius: number;
  orbitSpeed: number;
  rotationSpeed: number;
  planetSize?: number;
  geometries: number;
  color: string;
}

/**
 * 행성이 태양 중심을 공전하면서, 자체 자전도 하는 컴포넌트
 * 행성을 더욱 별처럼 보이게 하기 위한 추가적인 질감 및 효과 적용
 * 내부에 먼지 입자가 행성 주변에서 소용돌이치도록 수정
 */
function OrbitingPlanet({
  orbitRadius,
  orbitSpeed,
  rotationSpeed,
  planetSize = 10,
  geometries,
  color,
}: OrbitingPlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Points>(null);

  const initialAngle = useMemo(() => Math.random() * Math.PI * 2, []);

  const initialPosition = useMemo(() => {
    return new THREE.Vector3(
      Math.cos(initialAngle) * orbitRadius,
      0,
      Math.sin(initialAngle) * orbitRadius,
    );
  }, [initialAngle, orbitRadius]);

  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed * delta;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta;
    }
    if (particleRef.current) {
      const positions = particleRef.current.geometry.attributes.position.array;
      const swirlFactor = delta * rotationSpeed * 0.5;
      for (let i = 0; i < positions.length; i += 3) {
        const angle = Math.atan2(
          positions[i + 2] - initialPosition.z,
          positions[i] - initialPosition.x,
        );
        const radius = Math.sqrt(
          (positions[i] - initialPosition.x) ** 2 +
            (positions[i + 2] - initialPosition.z) ** 2,
        );
        positions[i] =
          initialPosition.x + Math.cos(angle + swirlFactor) * radius;
        positions[i + 2] =
          initialPosition.z + Math.sin(angle + swirlFactor) * radius;
      }
      particleRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  // 다양한 형상을 가진 행성들
  const geometriesType = [
    new THREE.SphereGeometry(planetSize, 64, 64),
    new THREE.DodecahedronGeometry(planetSize),
    new THREE.TetrahedronGeometry(planetSize),
    new THREE.OctahedronGeometry(planetSize),
    new THREE.IcosahedronGeometry(planetSize),
    new THREE.TorusKnotGeometry(planetSize * 0.5, planetSize * 0.2, 128, 32),
  ];

  // 먼지 입자 생성
  const particles = useMemo(() => {
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 400;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * planetSize * 1.2;
      positions[i * 3] = initialPosition.x + Math.cos(angle) * radius;
      positions[i * 3 + 1] =
        initialPosition.y + (Math.random() - 0.5) * planetSize * 2;
      positions[i * 3 + 2] = initialPosition.z + Math.sin(angle) * radius;
    }
    particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3),
    );
    return particleGeometry;
  }, [planetSize, initialPosition]);

  return (
    <group ref={orbitRef}>
      <mesh
        ref={planetRef}
        position={initialPosition.toArray()}
        geometry={geometriesType[geometries]}
      >
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
      <points ref={particleRef} geometry={particles}>
        <pointsMaterial color='#ffffff' size={0.5} transparent opacity={0.8} />
      </points>
      <OrbitRing radius={orbitRadius} />
    </group>
  );
}

/**
 * SolarSystem: 태양 + 4개 행성
 */
export default function SolarSystem({}) {
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
        ringWidth={30}
        axis={[0, 1, 0]} // 수직 축
        tilt={[1, 0, 1]} // 기울기 없음
        rotateSpeed={0.3}
        color='#ff00ff'
        count={200000}
      />
      <DebrisRing
        radius={400}
        ringWidth={30}
        axis={[1, 0, 0]} // X축
        tilt={[Math.PI / 2, 0, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={200000}
      />
      <DebrisRing
        radius={400}
        ringWidth={30}
        axis={[1, 0, 1]} // 대각 축
        tilt={[0, Math.PI / 2, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={200000}
      />
      <DebrisRing
        radius={400}
        ringWidth={30}
        axis={[1, 1, 0]} // 또 다른 축
        tilt={[Math.PI / 3, Math.PI / 4, 0]}
        rotateSpeed={0.3}
        color='#ff00ff'
        count={200000}
      />
      {/* 🌍 행성들 - 랜덤 초기 각도 적용 */}
      {/* 다양한 모양의 행성들 (별처럼 보이도록 효과 추가) */}
      <OrbitingPlanet
        key={1}
        orbitRadius={800}
        orbitSpeed={0.4 - 1 * 0.05}
        rotationSpeed={0.5 + Math.random() * 1.5}
        planetSize={30 + Math.random() * 20}
        geometries={1}
        color='#ff00ff'
      />
      <OrbitingPlanet
        key={2}
        orbitRadius={800 + 1 * 150}
        orbitSpeed={0.4 - 2 * 0.05}
        rotationSpeed={0.5 + Math.random() * 1.5}
        planetSize={30 + Math.random() * 20}
        geometries={2}
        color='#00ffff'
      />
      <OrbitingPlanet
        key={3}
        orbitRadius={800 + 2 * 150}
        orbitSpeed={0.4 - 3 * 0.05}
        rotationSpeed={0.5 + Math.random() * 1.5}
        planetSize={30 + Math.random() * 20}
        geometries={3}
        color='#ffcc00'
      />
      <OrbitingPlanet
        key={4}
        orbitRadius={800 + 3 * 150}
        orbitSpeed={0.4 - 4 * 0.05}
        rotationSpeed={0.5 + Math.random() * 1.5}
        planetSize={30 + Math.random() * 20}
        geometries={5}
        color='#ff4444'
      />
    </group>
  );
}
