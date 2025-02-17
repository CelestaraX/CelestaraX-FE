'use client';
import React, { useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbitControls, Stars } from '@react-three/drei';
import CustomStarsPlanet from './CustomStarsPlanet';
import RotatingArcTube from './RotatingArcTube';

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

export function SceneContent() {
  const { camera } = useThree();

  // 처음에는 zooming = false (안 움직임)
  const [zooming, setZooming] = useState(false);
  const [progress, setProgress] = useState(0);

  // 초기: z=2000, 최종: z=0
  const initialCamPos = new THREE.Vector3(0, 0, 2000);
  const finalCamPos = new THREE.Vector3(0, 0, 0); // 행성 근처

  // 매 프레임 카메라 이동
  useFrame((state, delta) => {
    if (!zooming) return;

    // delta 기반 진행도 증가
    let newProg = progress + delta * 0.5; // 속도 0.5
    if (newProg > 1) {
      newProg = 1;
      setZooming(false);
    }
    setProgress(newProg);

    // ease-out 보간
    const eased = easeOutQuad(newProg);
    // 카메라 위치
    const newCam = initialCamPos.clone().lerp(finalCamPos, eased);
    camera.position.copy(newCam);
  });

  return (
    <>
      <CustomStarsPlanet
        radius={350}
        starCount={70000}
        rotationSpeed={0.01}
        color1='#ffffff'
        color2='#ffddff'
        minSize={2}
        maxSize={6}
        fade={true} // 별 가장자리 fade on/off
      />
      {/* 행성 (회전 선) */}
      <RotatingArcTube
        radius={500}
        tubeThickness={15} // 굵기
        segments={64}
        axis={[0, 1, 0]}
        speed={0.3}
        color='#8e44ad'
        emissive='#ff00ff' // 빛 색상
        emissiveIntensity={0.2}
      />
      <RotatingArcTube
        radius={500}
        tubeThickness={15} // 굵기
        segments={64}
        axis={[1, 0, 0]}
        speed={0.3}
        color='#8e44ad'
        emissive='#ff00ff' // 빛 색상
        emissiveIntensity={0.2}
        initialRotation={[Math.PI / 2, 0, 0]}
      />
      <RotatingArcTube
        radius={500}
        tubeThickness={15} // 굵기
        segments={64}
        speed={0.3}
        color='#8e44ad'
        emissive='#ff00ff' // 빛 색상
        emissiveIntensity={0.2}
        initialRotation={[0, Math.PI / 2, 0]}
        axis={[1, 0, 1]}
      />
      <RotatingArcTube
        radius={500}
        tubeThickness={15} // 굵기
        segments={64}
        speed={0.3}
        color='#8e44ad'
        emissive='#ff00ff' // 빛 색상
        emissiveIntensity={0.2}
        initialRotation={[Math.PI / 3, Math.PI / 4, 0]}
        axis={[1, 1, 0]}
      />
      <Stars
        radius={2000}
        depth={50}
        count={30000}
        factor={5}
        saturation={0}
        fade
      />
    </>
  );
}

export default function GalaxyScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 1500], near: 1, far: 10000 }}
      style={{ width: '100%', height: '100%', background: 'black' }}
    >
      <ambientLight intensity={0.3} />
      <OrbitControls />
      <SceneContent />
    </Canvas>
  );
}
