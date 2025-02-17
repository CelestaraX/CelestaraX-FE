import React from 'react';
import Link from 'next/link';
import WalletConnectButton from '../WalletConnectButton';

export default function Header() {
  return (
    <header className='sticky top-0 z-50 flex h-auto w-full items-center justify-between bg-black bg-opacity-50 px-6 py-3 backdrop-blur-lg'>
      {/* 로고 섹션 */}
      <div className='flex items-center space-x-2'>
        <span className='font-mono text-2xl font-bold tracking-wide text-[#ff00ff]'>
          WEB3ITE
        </span>
      </div>

      {/* 네비게이션 */}
      <nav className='flex items-center space-x-6 font-mono text-lg'>
        <Link
          href='#'
          className='text-[#00ffff] transition duration-200 hover:text-white'
        >
          [DASHBOARD]
        </Link>
        <Link
          href='#'
          className='text-[#00ffff] transition duration-200 hover:text-white'
        >
          [DEPOSIT]
        </Link>

        {/* EARN 드롭다운 */}
        <div className='group relative'>
          <button className='text-[#00ffff] transition duration-200 hover:text-white'>
            [EARN] ▼
          </button>
          <div className='absolute left-0 mt-2 hidden w-40 border border-[#00ffff] bg-black bg-opacity-80 p-2 font-mono text-sm text-[#00ffff] backdrop-blur-md group-hover:block'>
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

        {/* VISION 드롭다운 */}
        <div className='group relative'>
          <button className='text-[#00ffff] transition duration-200 hover:text-white'>
            [VISION] ▼
          </button>
          <div className='absolute left-0 mt-2 hidden w-40 border border-[#00ffff] bg-black bg-opacity-80 p-2 font-mono text-sm text-[#00ffff] backdrop-blur-md group-hover:block'>
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

        {/* 지갑 연결 버튼 */}
        <WalletConnectButton />
      </nav>
    </header>
  );
}
