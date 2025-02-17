'use client';
import GalaxyScene from '@/components/SceneContent';
import React from 'react';

export default function Home() {
  return (
    <div className='min-h-[calc(100vh-120px)] font-[family-name:var(--font-geist-sans)]'>
      <main className='relative h-[calc(100vh-120px)] w-full'>
        <GalaxyScene />
      </main>
    </div>
  );
}
