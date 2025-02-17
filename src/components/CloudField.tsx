'use client';
import React, { useMemo } from 'react';
import { useTexture } from '@react-three/drei';

interface CloudFieldProps {
  count?: number;
  areaSize?: number; // x,y,z 범위
  opacityFactor?: number; // 전역 투명도(카메라 이동 시)
}

export default function CloudField({
  count = 20, // Plane 개수
  areaSize = 600, // -areaSize ~ +areaSize 범위
  opacityFactor = 1,
}: CloudFieldProps) {
  const texture = useTexture('/pink-cloud.jpg');

  // 무작위 Plane 정보들
  // useMemo: 매번 re-render 시 다시 계산 안 하도록
  const planes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      // 위치: z는 200~1000 사이, x,y는 -areaSize~+areaSize
      const x = (Math.random() * 2 - 1) * areaSize;
      const y = (Math.random() * 2 - 1) * areaSize;
      const z = 200 + Math.random() * (1000 - 200);

      // scale: 2~4
      const scale = 2 + Math.random() * 2;

      // baseOpacity: 0.3 ~ 0.6
      const baseOpacity = 0.3 + Math.random() * 0.3;

      // 회전: y축 중심으로만 약간 무작위
      const rotY = Math.random() * Math.PI * 2;

      arr.push({ x, y, z, scale, baseOpacity, rotY });
    }
    return arr;
  }, [count, areaSize]);

  return (
    <>
      {planes.map((p, i) => (
        <mesh
          key={i}
          position={[p.x, p.y, p.z]}
          rotation={[0, p.rotY, 0]}
          scale={[p.scale, p.scale, p.scale]}
        >
          <planeGeometry args={[100, 100]} />
          <meshBasicMaterial
            map={texture}
            transparent
            opacity={p.baseOpacity * opacityFactor}
            depthWrite={false}
          />
        </mesh>
      ))}
    </>
  );
}
