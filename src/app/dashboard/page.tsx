'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TypingText from '@/components/TypingText';

// Header + GalaxyScene (R3F) 컴포넌트
const GalaxyScene = dynamic(() => import('@/components/GalaxyScene'), {
  ssr: false,
});
const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
});

const longText = `이 행성은 Celestia를 상징합니다.<br/>
이곳에서는 다양한 HTML 파일들이 주변 행성으로 표현되며,<br/>
사용자가 이를 배포하고 상호작용할 수 있습니다.<br/>
<span style="color: #ff00ff;">1. planet A</span><br/>  <!-- 핫핑크 -->
<span style="color: #00ffff;">2. planet B</span><br/>  <!-- 네온 블루 -->
<span style="color: #ffcc00;">3. planet C</span><br/>  <!-- 옐로우 -->
<span style="color: #ff4444;">4. planet D</span>`;

export default function DashboardPage() {
  const router = useRouter();
  const [focusPlanet, setFocusPlanet] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const handleZoomComplete = () => {
    router.push('/archive');
  };

  const handleDeployClick = () => {
    setFocusPlanet(true);
  };

  useEffect(() => {
    if (focusPlanet) {
      const fadeOut = setInterval(() => {
        setOpacity((prev) => Math.max(prev - 0.05, 0));
      }, 100);

      return () => clearInterval(fadeOut);
    }
  }, [focusPlanet]);

  return (
    <div>
      <Header onDeployClick={handleDeployClick} />
      <main className='flex h-[calc(100vh-100px)]'>
        {/* 📝 타이핑 텍스트 박스 */}
        <div
          className='absolute left-[400px] top-[200px] min-h-[100px] w-[500px] -translate-x-1/2 transition-opacity duration-1000'
          style={{ opacity }}
        >
          <TypingText text={longText} speed={15} />
        </div>
        <div className='flex-1'>
          {/* 🌌 3D 장면 */}
          <GalaxyScene
            zooming={focusPlanet}
            onZoomComplete={handleZoomComplete}
          />
        </div>
      </main>
    </div>
  );
}
