'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import TypingText from '@/components/TypingText';
import SelectedHtmlDisplay from './_component/SelectedHtmlDisplay';

// Header + GalaxyScene (R3F) 컴포넌트
const GalaxyScene = dynamic(() => import('@/components/GalaxyScene'), {
  ssr: false,
});
const Header = dynamic(() => import('@/components/layout/Header'), {
  ssr: false,
});

// 선택 가능한 행성 타입
type PlanetId = 'A' | 'B' | 'C' | 'D' | null;

const longText = `이 행성은 Celestia를 상징합니다.<br/>
이곳에서는 다양한 HTML 파일들이 주변 행성으로 표현되며,<br/>
사용자가 이를 배포하고 상호작용할 수 있습니다.<br/>
<span style="color: #ff00ff;">1. planet A</span><br/>
<span style="color: #00ffff;">2. planet B</span><br/>
<span style="color: #ffff00;">3. planet C</span><br/>
<span style="color: #ff8800;">4. planet D</span>`;

export default function DashboardPage() {
  const router = useRouter();
  const [focusPlanet, setFocusPlanet] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetId>(null); // ✅ 타입을 "A" | "B" | "C" | "D" | null로 설정
  const modalRef = useRef<HTMLDivElement>(null);

  // ✅ 행성 선택 시 모달 표시 (올바른 타입만 설정)
  const handleSelectPlanet = (planetId: string) => {
    if (['A', 'B', 'C', 'D'].includes(planetId)) {
      setSelectedPlanet(planetId as PlanetId); // ✅ 타입 캐스팅
    }
  };

  // ✅ 바깥을 클릭하면 모달 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setSelectedPlanet(null);
      }
    }

    if (selectedPlanet) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPlanet]);

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
          <TypingText text={longText} speed={20} />
        </div>
        <div className='flex-1'>
          {/* 🌌 3D 장면 */}
          <GalaxyScene
            zooming={focusPlanet}
            onZoomComplete={handleZoomComplete}
            onSelectPlanet={handleSelectPlanet}
          />
        </div>

        {/* ✅ 선택된 행성이 있을 때만 HTML 모달 표시 */}
        {selectedPlanet && (
          <div className='fixed inset-0 flex items-center justify-center bg-black/60'>
            <div
              ref={modalRef}
              className='w-[500px] max-w-full rounded-md border border-gray-600 bg-gray-900 p-6 text-white shadow-lg'
            >
              <button
                className='absolute right-4 top-4 text-gray-300 hover:text-white'
                onClick={() => setSelectedPlanet(null)}
              >
                ✖
              </button>
              <SelectedHtmlDisplay selectedPlanet={selectedPlanet} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
