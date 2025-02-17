'use client';
import GalaxyScene from '@/components/GalaxyScene';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [focusPlanet, setFocusPlanet] = useState(false);
  const router = useRouter();

  // SceneContent가 줌인 완료 시 호출하는 콜백
  const handleZoomComplete = () => {
    router.push('/other-page');
  };

  return (
    <div className='relative h-full w-full'>
      {/* 상단 헤더 버튼 */}
      <header className='absolute left-0 top-0 p-2'>
        <button
          onClick={() => setFocusPlanet(true)}
          className='rounded-md bg-white px-4 py-2 text-black shadow-md'
        >
          행성 집중
        </button>
      </header>

      {/* GalaxyScene */}
      <GalaxyScene zooming={focusPlanet} onZoomComplete={handleZoomComplete} />
    </div>
  );
}
