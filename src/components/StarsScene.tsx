'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from './Stars';
import { OrbitControls } from '@react-three/drei';

// ✅ className을 props로 받을 수 있도록 설정
interface StarsSceneProps {
  className?: string;
}

export default function StarsScene({ className }: StarsSceneProps) {
  return (
    <div className={className}>
      {/* ✅ className을 적용할 div 추가 */}
      <Canvas
        shadows
        camera={{ position: [900, 400, 1500], near: 1, far: 10000 }}
        style={{ width: '100%', height: '100%', background: 'black' }}
      >
        <ambientLight intensity={3} />
        <OrbitControls />
        <Stars
          radius={2000}
          depth={50}
          count={40000}
          factor={5}
          saturation={0}
          fade
        />
      </Canvas>
    </div>
  );
}
