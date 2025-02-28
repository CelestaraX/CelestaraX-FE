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

const longText = `This galaxy is called CelestaraX.
CelestaraX is the name of the Eternal On-Chain Page Hub project,
a fusion of Celestia + Star (page) + Era (a new era of fully on-chain pages).<br/>
Here, you can experience the true Web3 era of pages.<br/>
Below is a list of the top 4 most popular pages right now:<br/>
<span style="color: #ff00ff;">Onchain Million Dollar</span><br/>  <!-- Hot Pink -->
<span style="color: #00ffff;">Flappy Square</span><br/>  <!-- Neon Blue -->
<span style="color: #ffcc00;">Space Shooter</span><br/>  <!-- Yellow -->
<span style="color: #ff4444;">Hello World</span>`;

export default function UniversePage() {
  const router = useRouter();
  const [focusPlanet, setFocusPlanet] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const handleZoomComplete = () => {
    router.push('/explorer');
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
          className='font-size text-md absolute left-[500px] top-[200px] min-h-[100px] w-[800px] -translate-x-1/2 transition-opacity duration-1000'
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
