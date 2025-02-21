'use client';
import * as React from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Vector3,
  Spherical,
  Color,
  AdditiveBlending,
  ShaderMaterial,
} from 'three';

type Props = {
  radius?: number;
  depth?: number;
  count?: number;
  factor?: number;
  saturation?: number;
  fade?: boolean;
  speed?: number;
};

// ✅ "StarfieldMaterial" 커스텀 셰이더 정의 및 등록
class StarfieldMaterial extends ShaderMaterial {
  constructor() {
    super({
      uniforms: { time: { value: 0.0 }, fade: { value: 1.0 } },
      vertexShader: /* glsl */ `
        uniform float time;
        attribute float size;
        varying vec3 vColor;
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (30.0 / -mvPosition.z) * (3.0 + sin(time + 100.0));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float fade;
        varying vec3 vColor;
        void main() {
          float opacity = 1.0;
          if (fade == 1.0) {
            float d = distance(gl_PointCoord, vec2(0.5, 0.5));
            opacity = 1.0 / (1.0 + exp(16.0 * (d - 0.25)));
          }
          gl_FragColor = vec4(vColor, opacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment> // ✅ 최신 Three.js 대응
        }
      `,
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: true,
    });
  }
}

// ✅ `extend()`를 사용하여 StarfieldMaterial을 R3F에서 사용할 수 있도록 등록
extend({ StarfieldMaterial });

// 별 좌표 생성 유틸: 구면 좌표 기반
function genStar(r: number) {
  const spherical = new Spherical(
    r,
    Math.acos(1 - Math.random() * 2), // polar
    Math.random() * 2 * Math.PI, // azimuth
  );
  const v = new Vector3();
  return v.setFromSpherical(spherical);
}

// ✅ `Stars` 컴포넌트 수정
export const Stars = React.forwardRef<THREE.Points, Props>(function Stars(
  {
    radius = 100,
    depth = 50,
    count = 5000,
    factor = 4,
    saturation = 0,
    fade = false,
    speed = 1,
  },
  ref,
) {
  const materialRef = React.useRef<StarfieldMaterial>(null!);

  // 별 (positions, colors, size) buffer
  const [position, color, size] = React.useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];
    const sizes: number[] = [];
    let r = radius + depth;
    const increment = depth / count;
    const colorTemp = new Color();

    for (let i = 0; i < count; i++) {
      r -= increment * Math.random();
      const starPos = genStar(r);
      positions.push(starPos.x, starPos.y, starPos.z);

      // 색상: HSL( i/count, saturation, 0.9 )
      colorTemp.setHSL(i / count, saturation, 0.9);
      colors.push(colorTemp.r, colorTemp.g, colorTemp.b);

      sizes.push((0.5 + 0.5 * Math.random()) * factor);
    }
    return [
      new Float32Array(positions),
      new Float32Array(colors),
      new Float32Array(sizes),
    ];
  }, [radius, depth, count, factor, saturation]);

  // 매 프레임 time 증가
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * speed;
    }
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach='attributes-position' args={[position, 3]} />
        <bufferAttribute attach='attributes-color' args={[color, 3]} />
        <bufferAttribute attach='attributes-size' args={[size, 1]} />
      </bufferGeometry>
      {/* ✅ <starfieldMaterial />를 소문자로 변경 */}
      <starfieldMaterial ref={materialRef} uniforms-fade-value={fade ? 1 : 0} />
    </points>
  );
});
