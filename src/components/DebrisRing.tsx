'use client';
import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DebrisRingProps {
  radius?: number;
  ringWidth?: number;
  count?: number;
  tilt?: [number, number, number];
  rotateSpeed?: number;
  axis?: [number, number, number];
  color?: string;
  minSize?: number;
  maxSize?: number;
}

/**
 * 고리(ring)를 "클라이언트 마운트 후"에만 랜덤으로 채우는 버전
 * (SSR 시에는 아무것도 그리지 않고, hydration mismatch 문제를 회피)
 */
export default function DebrisRing({
  radius = 400,
  ringWidth = 10,
  count = 100000,
  tilt = [0, 0, 0],
  rotateSpeed = 0,
  axis = [0, 1, 0],
  color = '#aaaaaa',
  minSize = 0.1,
  maxSize = 0.3,
}: DebrisRingProps) {
  const ringRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.InstancedMesh>(null!);

  // 회전축 Vector3
  const axisVec = useMemo(() => new THREE.Vector3(...axis).normalize(), [axis]);

  // 매 프레임 고리 회전
  useFrame((_, delta) => {
    if (!ringRef.current || rotateSpeed === 0) return;
    ringRef.current.rotateOnAxis(axisVec, rotateSpeed * delta);
  });

  // geometry, material은 SSR해도 괜찮음(정적)
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 6, 6), []);
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color }),
    [color],
  );

  /**
   * **핵심**:
   *  useEffect 안에서만 Math.random()을 써서 분포를 생성 → 클라이언트에서만 실행
   *  => SSR 시에는 InstancedMesh가 분포(=matrix) 없이 비어 있다가,
   *     클라이언트 마운트 후 distribution 로직이 동작.
   */
  useEffect(() => {
    if (!meshRef.current) return;

    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // 1) angle ∈ [0, 2π)
      const angle = Math.random() * Math.PI * 2;

      // 2) 반경 [rmin, rmax]
      const rmin = radius - ringWidth * 0.5;
      const rmax = radius + ringWidth * 0.5;
      const r = rmin + Math.random() * (rmax - rmin);

      const x = r * Math.cos(angle);
      const z = r * Math.sin(angle);
      const y = (Math.random() - 0.5) * 2;

      dummy.position.set(x, y, z);

      // scale
      const scale = minSize + Math.random() * (maxSize - minSize);
      dummy.scale.set(scale, scale, scale);

      // 임의 회전
      dummy.rotation.set(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
      );

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;

    // Instanced geometry boundingSphere 설정 (프러스텀 컬링 방지)
    // or frustumCulled={false} 라도 됨
    const maxR = radius + ringWidth * 0.5;
    meshRef.current.geometry.boundingSphere = new THREE.Sphere(
      new THREE.Vector3(0, 0, 0),
      maxR + 5,
    );
  }, [count, radius, ringWidth, minSize, maxSize]);

  return (
    <group ref={ringRef}>
      <group rotation={new THREE.Euler(...tilt)}>
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, count]}
          castShadow
          receiveShadow
          frustumCulled={false} // or boundingSphere manually set
        />
      </group>
    </group>
  );
}
