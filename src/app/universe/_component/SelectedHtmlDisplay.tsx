'use client';
import React, { useEffect, useRef } from 'react';

// ✅ 행성별 HTML 데이터 (as const로 고정)
const HTML_FILES = {
  A: `<h2 style="color:#ff00ff;">🌌 행성 A의 HTML 콘텐츠</h2><p>Celestia에 배포된 HTML 파일입니다.</p>`,
  B: `<h2 style="color:#00ffff;">🔵 행성 B의 HTML 콘텐츠</h2><p>이 행성은 인터랙션이 가능합니다.</p>`,
  C: `<h2 style="color:#ffff00;">🟡 행성 C의 HTML 콘텐츠</h2><p>이곳은 테스트 환경입니다.</p>`,
  D: `<h2 style="color:#ff8800;">🟠 행성 D의 HTML 콘텐츠</h2><p>배포된 코드가 실행됩니다.</p>`,
} as const;

// ✅ Planet ID 타입 정의
type PlanetId = keyof typeof HTML_FILES;

interface SelectedHtmlDisplayProps {
  selectedPlanet: PlanetId | null;
  onClose: () => void; // ✅ 모달 닫기 함수
}

export default function SelectedHtmlDisplay({
  selectedPlanet,
  onClose,
}: SelectedHtmlDisplayProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // ✅ 바깥 클릭 시 모달 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (selectedPlanet) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedPlanet, onClose]);

  if (!selectedPlanet) return null; // ✅ 선택된 행성이 없으면 모달을 렌더링하지 않음

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/60'>
      <div
        ref={modalRef}
        className='w-[500px] max-w-full rounded-md border border-gray-600 bg-gray-900 p-6 text-white shadow-lg'
      >
        <button
          className='absolute right-4 top-4 text-gray-300 hover:text-white'
          onClick={onClose}
        >
          ✖
        </button>
        <div
          className='prose max-w-full'
          dangerouslySetInnerHTML={{ __html: HTML_FILES[selectedPlanet] || '' }}
        />
      </div>
    </div>
  );
}
