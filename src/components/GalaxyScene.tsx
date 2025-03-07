'use client';
import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { SceneContent } from './SceneContent';
import { useMediaQuery } from 'usehooks-ts';

interface GalaxySceneProps {
  zooming: boolean;
  onZoomComplete?: () => void;
}

export default function GalaxyScene({
  zooming,
  onZoomComplete,
}: GalaxySceneProps) {
  const isMobile = useMediaQuery('(max-width: 640px)');

  return (
    <Canvas
      className='-z-5 absolute inset-0'
      shadows
      camera={{
        position: isMobile ? [2500, 1000, 1500] : [900, 400, 1500],
        near: 1,
        far: 10000,
      }}
      style={{ width: '100%', height: '100%' }}
    >
      <ambientLight intensity={3} />
      <OrbitControls />
      <SceneContent zooming={zooming} onZoomComplete={onZoomComplete} />
    </Canvas>
  );
}
