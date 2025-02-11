'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import RotatingArcOfStars from './RotatingArcOfStars';

export default function CrossedScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 700] }}
      style={{ width: '100%', height: '100%', background: 'black' }}
    >
      <ambientLight intensity={0.3} />
      <OrbitControls />

      {/* 1) Y축 중심 회전, 보라색 띠 */}
      <RotatingArcOfStars
        radius={300}
        pointsCount={1000}
        axis={[0, 1, 0]}
        initialRotation={[0, 0, 0]}
        speed={0.3}
        color='#8e44ad'
        size={0.7}
      />

      {/* 2) X축 중심 회전, 파란색 띠 */}
      <RotatingArcOfStars
        radius={300}
        pointsCount={1000}
        axis={[1, 0, 0]}
        initialRotation={[Math.PI / 2, 0, 0]}
        speed={0.3}
        color='#8e44ad'
        size={0.7}
      />

      {/* 3) Z축 중심 회전, 노란색 띠 */}
      <RotatingArcOfStars
        radius={300}
        pointsCount={1000}
        axis={[1, 0, 1]}
        initialRotation={[0, Math.PI / 2, 0]}
        speed={0.3}
        color='#8e44ad'
        size={0.7}
      />

      {/* 4) 대각선 축, 빨간색 띠 */}
      <RotatingArcOfStars
        radius={300}
        pointsCount={1000}
        axis={[1, 1, 0]}
        initialRotation={[Math.PI / 3, Math.PI / 4, 0]}
        speed={0.3}
        color='#8e44ad'
        size={0.7}
      />
      {/* 별 배경 (drei의 Stars) */}
      <Stars
        radius={80} // 별이 퍼지는 반경
        depth={50} // 별이 위치하는 깊이
        count={5000} // 별 개수
        factor={5} // 별 크기
        saturation={0}
        fade
      />
      {/* 주변광, 방향광 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
    </Canvas>
  );
}
