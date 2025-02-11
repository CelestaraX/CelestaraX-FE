'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import GalaxySphere from './GalaxySphere';

export default function GalaxyScene() {
  // 은하들(페이지들)을 배치할 위치와 색상 목록
  // 실제로는 데이터(페이지 정보, 라우트, 제목 등)를 map으로 돌리면 됨
  const galaxies = [
    { position: [0, 0, 0], color: '#8e44ad', scale: 1.2 },
    { position: [3, 1, -2], color: '#2980b9', scale: 1 },
    { position: [-2, -1, 2], color: '#c0392b', scale: 0.9 },
    { position: [2, 2, 2], color: '#f1c40f', scale: 1 },
    { position: [-3, 1, -3], color: '#2ecc71', scale: 1.1 },
    // ...원하는 만큼 추가
  ];

  return (
    <Canvas
      camera={{ position: [0, 0, 700], fov: 50 }}
      style={{
        width: '100%',
        height: '100%',
        background: 'black',
      }}
    >
      {/* 별 배경 (drei의 Stars) */}
      <Stars
        radius={100} // 별이 퍼지는 반경
        depth={50} // 별이 위치하는 깊이
        count={5000} // 별 개수
        factor={15} // 별 크기
        saturation={0}
        fade
      />
      {/* 주변광, 방향광 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />

      {/* 마우스 드래그로 회전/확대/이동 가능 */}
      <OrbitControls enablePan={false} />

      {/* 여러 개의 GalaxySphere 컴포넌트 렌더 */}
      {galaxies.map((gal, idx) => (
        <GalaxySphere
          key={idx}
          position={gal.position as [number, number, number]}
          color={gal.color}
          scale={gal.scale}
        />
      ))}
    </Canvas>
  );
}
