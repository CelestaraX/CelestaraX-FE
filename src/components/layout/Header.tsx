'use client';
import React from 'react';
import Link from 'next/link';
import WalletConnectButton from '../WalletConnectButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface HeaderProps {
  onDeployClick?: () => void; // 👈 새로 추가
}

export default function Header({ onDeployClick }: HeaderProps) {
  const router = useRouter();
  return (
    <header className='sticky top-0 z-50 flex w-full items-center justify-between bg-black bg-opacity-50 px-7 py-6 backdrop-blur-lg'>
      {/* 로고 섹션 */}
      <div className='flex items-center space-x-2'>
        <Image src='/logo.png' alt='WEB3ITE Logo' width={50} height={50} />
        <span className='font-mono text-2xl font-bold tracking-wide text-[#ff00ff]'>
          WEB3ITE
        </span>
      </div>

      {/* 네비게이션 */}
      <nav className='flex items-center space-x-6 font-mono text-lg'>
        {/* Dashboard: 그냥 Link or some route */}
        <Link href='/dashboard' className='text-[#00ffff] hover:text-white'>
          [DASHBOARD]
        </Link>

        {/* Deploy => 여기서 그냥 Link하면 즉시 이동 -> 
            대신 onClick -> setFocusPlanet(true) */}

        <button
          className='text-[#00ffff] transition hover:text-white'
          onClick={() => {
            if (onDeployClick) {
              onDeployClick?.();
            } else {
              router.push('/archive');
            }
          }}
        >
          [ARCHIVE]
        </button>

        {/* About */}
        <Link href='/deploy' className='text-[#00ffff] hover:text-white'>
          [DEPLOY]
        </Link>

        <div className='group relative'>
          <button className='text-[#00ffff] hover:text-white'>[ABOUT] ▼</button>
          <div className='absolute left-0 mt-2 hidden w-40 border border-[#00ffff] bg-black bg-opacity-80 p-2 text-sm text-[#00ffff] backdrop-blur-md group-hover:block'>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Staking
            </Link>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Rewards
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div className='group relative'>
          <button className='text-[#00ffff] hover:text-white'>
            [CONTACT] ▼
          </button>
          <div className='absolute left-0 mt-2 hidden w-40 border border-[#00ffff] bg-black bg-opacity-80 p-2 text-sm text-[#00ffff] backdrop-blur-md group-hover:block'>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Roadmap
            </Link>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Whitepaper
            </Link>
          </div>
        </div>

        {/* 지갑 연결 */}
        <WalletConnectButton />
      </nav>
    </header>
  );
}
