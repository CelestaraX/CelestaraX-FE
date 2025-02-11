'use client';
import React from 'react';
import * as THREE from 'three';
import { CatmullRomCurve3 } from 'three';
import { useMemo } from 'react';

/**
 * 얽힌 구 형태(아이콘 비슷하게) 하나를 만드는 컴포넌트
 */
export default function CrossedSphere() {
  const radius = 1; // 구(원)의 반지름
  const tubeRadius = 0.05; // 호(arc) 두께
  const segments = 64; // 세분화 정도

  // (1) 기본 원(circle)의 좌표들을 생성하는 함수
  const createCirclePoints = (r: number, segCount = 64) => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < segCount; i++) {
      const theta = (i / segCount) * Math.PI * 2;
      const x = r * Math.cos(theta);
      const y = r * Math.sin(theta);
      const z = 0;
      points.push(new THREE.Vector3(x, y, z));
    }
    return points;
  };

  // (2) 기본 원 -> CatmullRomCurve3 로 생성
  const baseCurve = useMemo(() => {
    const circlePoints = createCirclePoints(radius, segments);
    // closed: true => 원형으로 이어짐
    return new CatmullRomCurve3(circlePoints, true);
  }, [radius, segments]);

  // TubeGeometry를 재사용하기 위한 팩토리 함수
  const makeTubeGeometry = (curve: CatmullRomCurve3) => {
    return new THREE.TubeGeometry(curve, segments, tubeRadius, 8, true);
  };

  // 4개의 원을 서로 다른 축/각도로 회전시켜서 겹침 (예시)
  // 필요에 맞게 rotation 값 조절해서 아이콘 비슷하게 배치
  const arcsData = [
    { rotation: [0, 0, 0] },
    { rotation: [Math.PI / 2, 0, 0] },
    { rotation: [0, Math.PI / 2, 0] },
    { rotation: [Math.PI / 1.5, Math.PI / 4, 0] },
  ];

  return (
    <group>
      {arcsData.map((arc, idx) => (
        <mesh
          rotation={arc.rotation as [number, number, number]}
          key={idx}
          geometry={makeTubeGeometry(baseCurve)}
        >
          <meshStandardMaterial color='#8e44ad' />
        </mesh>
      ))}
    </group>
  );
}
