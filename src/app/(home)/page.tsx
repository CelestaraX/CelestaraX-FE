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
        <div className='glitch-effect text-7xl font-bold text-pink-500'>
          CELESTARAX
        </div>
        <p className='mt-4 max-w-md text-center text-xl text-gray-300'>
          The world’s first decentralized prover network. <br />
          Welcome to Level 1: Crisis of Trust
        </p>

        <button
          onClick={handleClick}
          className='mt-10 transform bg-pink-500 px-8 py-3 text-lg font-bold tracking-wider text-white shadow-[0_0_10px_#ff00ff] transition-transform hover:scale-105 hover:bg-pink-400'
        >
          ENTER TESTNET
        </button>
      </div>
    </main>
  );
}
