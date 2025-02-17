'use client';
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { AdditiveBlending, ShaderMaterial } from 'three';

/**
 * 커스텀 셰이더(material) - 별 모양 Fade
 */
class StarShaderMaterial extends ShaderMaterial {
  constructor() {
    super({
      // 커스텀 uniform
      uniforms: {
        uTime: { value: 0.0 },
        fade: { value: 1.0 }, // fade 옵션 on/off
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        attribute float aSize;
        varying vec3 vColor;
        void main() {
          // 색상을 vary해서 fragment에서 사용
          vColor = color;

          // gl_PointSize: 점 크기
          // 여기서는 aSize * (100.0 / -mvPosition.z) 등 자유롭게 조정 가능
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (200.0 / -mvPosition.z);
          // 살짝 반짝이 효과 주고 싶으면 sin(uTime + randomOffset)
          // gl_PointSize *= (3.0 + sin(uTime * 0.5 + ...));

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
      uniform float fade;
      varying vec3 vColor;
  
      void main() {
        // 원형 별 모양: 가운데 밝고, 바깥쪽으로 알파 값 조정
        float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
        float alpha = 1.0;
  
        // fade 효과 적용
        if (fade > 0.5) {
          alpha = 1.0 / (1.0 + exp(16.0 * (dist - 0.25)));
        }
  
        // SRGB 인코딩 적용
        vec3 finalColor = pow(vColor, vec3(1.0 / 2.2)); // gamma correction (sRGB)
  
        // 최종 색상 적용
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,

      transparent: true,
      depthWrite: false,
      vertexColors: true,
      blending: AdditiveBlending,
    });
  }
}

interface CustomStarsPlanetProps {
  radius?: number;
  starCount?: number;
  rotationSpeed?: number;
  color1?: string;
  color2?: string;
  minSize?: number;
  maxSize?: number;
  fade?: boolean;
}

/**
 * 구체 내부를 '별 파티클'로 가득 채우고,
 * 각 점을 셰이더로 '둥근 별 모양'으로 표현하여
 * 인위적인 사각 픽셀이 아닌, pmndrs/drei <Stars> 같은 느낌 구현
 */
export default function CustomStarsPlanet({
  radius = 100,
  starCount = 5000,
  rotationSpeed = 0.01,
  color1 = '#ffffff',
  color2 = '#ffaaff',
  minSize = 2,
  maxSize = 5,
  fade = true,
}: CustomStarsPlanetProps) {
  const planetRef = useRef<THREE.Points>(null);
  const materialRef = useRef<StarShaderMaterial>(null);

  // 회전
  useFrame((state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta * 60; // scale speed by framerate
    }
    // 시간 업데이트 (반짝임 등)
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  // 별 배치 (구 내부)
  const geometry = useMemo(() => {
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);
    const sizes = new Float32Array(starCount);

    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    const tmpColor = new THREE.Color();

    for (let i = 0; i < starCount; i++) {
      // 구 내부 분포
      const r = radius * Math.cbrt(Math.random());
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      positions[i * 3 + 0] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // 색상 보간
      tmpColor.copy(c1).lerp(c2, Math.random());
      colors[i * 3 + 0] = tmpColor.r;
      colors[i * 3 + 1] = tmpColor.g;
      colors[i * 3 + 2] = tmpColor.b;

      // 사이즈
      sizes[i] = minSize + Math.random() * (maxSize - minSize);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    g.computeBoundingSphere();
    return g;
  }, [starCount, radius, color1, color2, minSize, maxSize]);

  // 셰이더 material
  const material = useMemo(() => {
    const mat = new StarShaderMaterial();
    mat.uniforms.fade.value = fade ? 1 : 0;
    return mat;
  }, [fade]);

  return (
    <points ref={planetRef} geometry={geometry}>
      <primitive ref={materialRef} object={material} attach='material' />
    </points>
  );
}
