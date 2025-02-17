'use client';
import React, { useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Stars } from '@react-three/drei';
import SolarSystem from './SolarSystem';

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

interface SceneContentProps {
  zooming: boolean;
  onZoomComplete?: () => void;
}

export function SceneContent({ zooming, onZoomComplete }: SceneContentProps) {
  const { camera } = useThree();

  // 카메라 진행도
  const [progress, setProgress] = useState(0);
  // 별/튜브 회전 멈춤 여부
  const [frozen, setFrozen] = useState(false);

  // 카메라 위치
  const initialCamPos = new THREE.Vector3(0, 0, 1500);
  const finalCamPos = new THREE.Vector3(0, 0, 0);

  // useFrame for camera anim
  useFrame((_, delta) => {
    if (!zooming || frozen) return;

    let newProg = progress + delta * 0.5;
    if (newProg > 1) {
      newProg = 1;
      // 멈춤 상태
      setFrozen(true);
      // 카메라 애니 끝 → 콜백
      onZoomComplete?.();
    }
    setProgress(newProg);

    const eased = easeOutQuad(newProg);
    const newPos = initialCamPos.clone().lerp(finalCamPos, eased);
    camera.position.copy(newPos);
  });

  // 만약 zooming 상태 바뀔때마다 progress 리셋
  // (안정적 구현)
  React.useEffect(() => {
    if (zooming) {
      setProgress(0);
      setFrozen(false);
    }
  }, [zooming]);

  return (
    <>
      <Stars
        radius={2000}
        depth={50}
        count={40000}
        factor={5}
        saturation={0}
        fade
      />
      <SolarSystem />
    </>
  );
}
