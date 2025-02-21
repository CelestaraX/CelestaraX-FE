'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Header + GalaxyScene (R3F) 컴포넌트
const GalaxyScene = dynamic(() => import('@/components/GalaxyScene'), {
  ssr: false,
});
const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
});

export default function DashboardPage() {
  const router = useRouter();
  const [focusPlanet, setFocusPlanet] = useState(false);

  // SceneContent에서 줌인 완료 시 호출
  const handleZoomComplete = () => {
    router.push('/archive');
  };

  // 헤더로부터 onDeployClick
  const handleDeployClick = () => {
    setFocusPlanet(true);
  };

  return (
    <div className='relative h-screen w-screen'>
      <Header onDeployClick={handleDeployClick} />
      <GalaxyScene zooming={focusPlanet} onZoomComplete={handleZoomComplete} />
    </div>
  );
}
