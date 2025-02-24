'use client';

import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import CustomStarsPlanet from './CustomStarsPlanet';
// import { Stars } from '@react-three/drei';
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
  color?: string;
  onSelect: (planetId: string) => void;
  id: string;
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
  // count,
  color,
  onSelect,
  id,
}: PlanetProps) {
  const orbitRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [currentSize, setCurrentSize] = useState(planetSize);

  const initialPosition = useMemo(() => {
    return new THREE.Vector3(
      Math.cos(initialAngle) * orbitRadius,
      0,
      Math.sin(initialAngle) * orbitRadius,
    );
  }, [initialAngle, orbitRadius]); // ✅ useMemo를 사용해 한 번만 계산됨

  // ✅ 매 프레임마다 공전 & 자전
  useFrame((_, delta) => {
    if (orbitRef.current) {
      orbitRef.current.rotation.y += orbitSpeed * delta;
    }
    if (planetRef.current) {
      planetRef.current.rotation.y += isSelected
        ? rotationSpeed * 2 * delta
        : rotationSpeed * delta;
    }
  });

  return (
    <group ref={orbitRef}>
      {/* 초기 위치를 (x, 0, z)로 설정 */}
      <mesh
        ref={planetRef}
        position={initialPosition.toArray()} // ✅ 위치를 변경되지 않는 값으로 유지
        scale={isHovered || isSelected ? 1.5 : 1} // ✅ useState 없이 크기 변경
        onPointerEnter={() => {
          setIsHovered(true);
          setCurrentSize(planetSize * 1.3); // ✅ Hover 시 커지게 설정
        }}
        onPointerLeave={() => {
          setIsHovered(false);
          if (!isSelected) setCurrentSize(planetSize); // ✅ 선택되지 않았을 때 크기 원래대로
        }}
        onClick={(e) => {
          e.stopPropagation();
          setIsSelected(!isSelected);
          setCurrentSize(isSelected ? planetSize : planetSize * 1.5); // ✅ 클릭 시 크기 변화
          onSelect(id);
        }}
      >
        <sphereGeometry args={[currentSize, 32, 32]} />
        <meshStandardMaterial
          color={isSelected ? '#ff00ff' : isHovered ? '#00ffff' : color}
          emissive={isHovered || isSelected ? '#ff00ff' : '#111'}
          emissiveIntensity={isHovered || isSelected ? 8 : 0.5} // ✅ 발광 효과 강화
          metalness={isSelected ? 1 : 0.3} // ✅ 금속 느낌 추가 (더 반짝이게)
          roughness={isSelected ? 0.1 : 0.6} // ✅ 반짝임 추가
        />
        {/* <Stars
          radius={planetSize}
          depth={10}
          count={count}
          factor={5}
          saturation={0}
          fade
        /> */}
      </mesh>

      {/* 궤도 링 */}
      <OrbitRing radius={orbitRadius} />
    </group>
  );
}

/**
 * SolarSystem: 태양 + 4개 행성
 */
export default function SolarSystem({
  onSelectPlanet,
}: {
  onSelectPlanet: (planetId: string) => void;
}) {
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
      <OrbitingPlanet
        id='A'
        orbitRadius={800}
        orbitSpeed={0.4}
        rotationSpeed={1}
        planetColor='#FFFFFF'
        planetSize={30}
        count={8000}
        onSelect={onSelectPlanet}
      />
      <OrbitingPlanet
        id='B'
        orbitRadius={900}
        orbitSpeed={0.3}
        rotationSpeed={0.7}
        planetColor='#FFFFFF'
        planetSize={50}
        count={10000}
        onSelect={onSelectPlanet}
      />
      <OrbitingPlanet
        id='C'
        orbitRadius={1000}
        orbitSpeed={0.25}
        rotationSpeed={0.8}
        planetColor='#FFFFFF'
        planetSize={70}
        count={15000}
        onSelect={onSelectPlanet}
      />
      <OrbitingPlanet
        id='D'
        orbitRadius={1100}
        orbitSpeed={0.2}
        rotationSpeed={1.2}
        planetColor='#FFFFFF'
        planetSize={90}
        count={30000}
        onSelect={onSelectPlanet}
      />
    </group>
  );
}
