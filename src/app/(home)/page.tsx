'use client';
import { useRouter } from 'next/navigation';
import React from 'react';

export default function HomePage() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/universe');
  };

  return (
    <main className='relative flex h-screen flex-col items-center justify-center text-white'>
      <div className='text-center'>
        <div className='font-tilt glitch-effect text-7xl font-bold text-pink-500'>
          CELESTARAX
        </div>
        <p className='mt-4 max-w-md text-center font-mono text-xl text-gray-300'>
          The Eternal On-Chain Page Hub
        </p>

        <button
          onClick={handleClick}
          className='mt-10 transform bg-pink-500 px-8 py-3 text-lg font-bold tracking-wider text-white shadow-[0_0_10px_#ff00ff] transition-transform hover:scale-105 hover:bg-pink-400'
        >
          ENTER
        </button>
      </div>
    </main>
  );
}
