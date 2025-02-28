'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import HtmlCardSlider from './_components/HtmlCardSlider';

export default function ExplorerPage() {
  return (
    <div>
      <Header />
      <main className='flex h-[calc(100vh-100px)]'>
        <HtmlCardSlider />
      </main>
    </div>
  );
}
