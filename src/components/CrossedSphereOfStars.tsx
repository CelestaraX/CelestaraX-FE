'use client';
import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';

interface CrossedSphereOfStarsProps {
  radius?: number;
  pointsPerArc?: number;
  arcCount?: number;
}

/**
 * 구 표면의 여러 '호(arc)'에 별들을 뿌려
 * "얽힌 구" 형태를 만드는 데모 컴포넌트
 */
export default function CrossedSphereOfStars({
  radius = 1,
  pointsPerArc = 30,
  arcCount = 4,
}: CrossedSphereOfStarsProps) {
  /**
   * 호(arc)들을 어떻게 회전시킬지 정한다.
   * - 여기서는 예시로 arcCount개만큼 다양하게 회전값을 만들거나,
   *   혹은 아이콘 모양에 맞춰 '수동'으로 지정할 수도 있음
   */
  const arcRotations = useMemo<THREE.Euler[]>(() => {
    // (A) 자동 생성 (단순히 arcCount만큼 균등 분포):
    // return Array.from({ length: arcCount }, (_, i) => {
    //   return new THREE.Euler(
    //     (Math.PI / arcCount) * i,
    //     (Math.PI / 2 / arcCount) * i,
    //     0
    //   )
    // })

    // (B) 수동 지정 (아이콘 모양처럼 4개):
    // arcCount가 4일 때만 작동하므로 상황에 맞게 조정
    if (arcCount === 4) {
      return [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(Math.PI / 2, 0, 0),
        new THREE.Euler(0, Math.PI / 3, 0),
        new THREE.Euler(Math.PI / 1.5, Math.PI / 3, 0),
      ];
    }

    // 기본적으로는 자동 분포
    return Array.from({ length: arcCount }, (_, i) => {
      return new THREE.Euler(
        (Math.PI / arcCount) * i,
        (Math.PI / 2 / arcCount) * i,
        0,
      );
    });
  }, [arcCount]);

  /**
   * arc 하나를 구성하는 별(점)들의 좌표를 생성하는 함수
   * - (x, y, 0)로 원(circle)을 만든 뒤 특정 회전(Euler) 적용
   */
  function createArcPositions(
    arcRotation: THREE.Euler,
    r: number,
    count: number,
  ): THREE.Vector3[] {
    const posArray: THREE.Vector3[] = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const x = r * Math.cos(t);
      const y = r * Math.sin(t);
      const z = 0;
      const vec = new THREE.Vector3(x, y, z);
      vec.applyEuler(arcRotation);
      posArray.push(vec);
    }
    return posArray;
  }

  /**
   * 모든 arc의 별 좌표를 합쳐서 하나의 배열로 만든다
   */
  const allStarsPositions = useMemo(() => {
    const allPositions: THREE.Vector3[] = [];
    arcRotations.forEach((rot) => {
      const arcPos = createArcPositions(rot, radius, pointsPerArc);
      allPositions.push(...arcPos);
    });
    return allPositions;
  }, [arcRotations, radius, pointsPerArc]);

  /**
   * R3F <Points>에 들어갈 Float32Array positions
   */
  const positionsBuffer = useMemo(() => {
    const arr = new Float32Array(allStarsPositions.length * 3);
    allStarsPositions.forEach((v, i) => {
      arr[i * 3 + 0] = v.x;
      arr[i * 3 + 1] = v.y;
      arr[i * 3 + 2] = v.z;
    });
    return arr;
  }, [allStarsPositions]);

  return (
    <group>
      <Points positions={positionsBuffer}>
        {/* 
          @react-three/drei의 PointMaterial:
          - size: 점 크기
          - color: 색상
          - transparent, alphaTest 등 조절 가능 
        */}
        <PointMaterial
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          color='#8e44ad'
        />
      </Points>
    </group>
  );
}
