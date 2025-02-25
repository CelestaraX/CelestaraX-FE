'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TypingText from '@/components/TypingText';

// Header + GalaxyScene (R3F) Components
const GalaxyScene = dynamic(() => import('@/components/GalaxyScene'), {
  ssr: false,
});
const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
});

const longText = `This planet represents Celestia.<br/>
Various HTML files are represented as surrounding planets here,<br/>
allowing users to deploy and interact with them.<br/>
<span style="color: #ff00ff;">1. planet A</span><br/>  <!-- Hot Pink -->
<span style="color: #00ffff;">2. planet B</span><br/>  <!-- Neon Blue -->
<span style="color: #ffcc00;">3. planet C</span><br/>  <!-- Yellow -->
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
        {/* 📝 Typing Text Box */}
        <div
          className='absolute left-[400px] top-[200px] min-h-[100px] w-[500px] -translate-x-1/2 transition-opacity duration-1000'
          style={{ opacity }}
        >
          <TypingText text={longText} speed={15} />
        </div>
        <div className='flex-1'>
          {/* 🌌 3D Scene */}
          <GalaxyScene
            zooming={focusPlanet}
            onZoomComplete={handleZoomComplete}
          />
        </div>
      </main>
    </div>
  );
}
