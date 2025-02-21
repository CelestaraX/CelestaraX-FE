'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import dynamic from 'next/dynamic';

// 클라이언트 전용 컴포넌트 (SSR 비활성화)
const HTMLInfiniteGrid = dynamic(
  () => import('./_components/HTMLInfiniteGrid'),
  { ssr: false },
);
export default function MyPage() {
  return (
    <>
      <Header />
      <div className='relative h-screen'>
        <HTMLInfiniteGrid />
      </div>
    </>
  );
}
