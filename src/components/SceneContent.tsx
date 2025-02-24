'use client';
import React, { useState, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import SolarSystem from './SolarSystem';

function easeOutQuad(t: number) {
  return 1 - (1 - t) * (1 - t);
}

interface SceneContentProps {
  zooming: boolean;
  onZoomComplete?: () => void;
  onSelectPlanet: (planetId: string) => void;
}

export function SceneContent({
  zooming,
  onZoomComplete,
  onSelectPlanet,
}: SceneContentProps) {
  const { camera } = useThree();

  const [progress, setProgress] = useState(0);
  const [frozen, setFrozen] = useState(false);

  const initialCamPos = new THREE.Vector3(900, 400, 1500);
  const finalCamPos = new THREE.Vector3(0, 0, 0);

  useFrame((_, delta) => {
    if (!zooming || frozen) return;

    let newProg = progress + delta * 0.3;
    if (newProg >= 1) {
      newProg = 1;
      setFrozen(true);
      onZoomComplete?.();
    }
    setProgress(newProg);

    const eased = easeOutQuad(newProg);
    const newCamPos = initialCamPos.clone().lerp(finalCamPos, eased);
    camera.position.copy(newCamPos);
    camera.lookAt(0, 0, 0);
  });

  useEffect(() => {
    if (zooming) {
      setProgress(0);
      setFrozen(false);
    }
  }, [zooming]);

  return (
    <>
      <SolarSystem onSelectPlanet={onSelectPlanet} />
    </>
  );
}
