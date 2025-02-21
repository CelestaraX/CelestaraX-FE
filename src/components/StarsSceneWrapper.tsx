'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

// ✅ 동적으로 `StarsScene`을 불러오며, SSR을 비활성화
const StarsScene = dynamic(() => import('@/components/StarsScene'), {
  ssr: false,
});

export default function StarsSceneWrapper({
  className,
}: {
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // ✅ Hydration 오류 방지 및 배경이 사라지지 않도록 설정

  return <StarsScene className={className} />;
}
