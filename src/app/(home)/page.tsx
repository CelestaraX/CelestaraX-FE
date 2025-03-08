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
        <div className='glitch-effect font-tilt text-4xl font-bold text-pink-500 sm:text-7xl'>
          CELESTARAX
        </div>
        <p className='mt-4 max-w-md text-center font-mono text-lg text-gray-300 sm:text-xl'>
          The Eternal On-Chain Page Hub
        </p>

        <button
          onClick={handleClick}
          className='mt-10 transform bg-pink-500 px-5 py-2 text-lg font-bold tracking-wider text-white shadow-[0_0_10px_#ff00ff] transition-transform hover:scale-105 hover:bg-pink-400 sm:px-8 sm:py-3'
        >
          ENTER
        </button>
      </div>
    </main>
  );
}
