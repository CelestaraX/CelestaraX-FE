'use client';
import React from 'react';
import Link from 'next/link';
import WalletConnectButton from '../WalletConnectButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  onDeployClick?: () => void;
}

export default function Header({ onDeployClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const getNavItemClass = (href: string) => {
    const isActive = pathname === href;
    return `relative transition px-2 py-1 ${
      isActive
        ? 'text-white border-b-2 border-[#00ffff] animate-pulse'
        : 'text-[#00ffff] hover:text-white'
    }`;
  };

  return (
    <header className='sticky top-0 z-50 flex w-full items-center justify-between bg-black bg-opacity-50 px-7 py-6 backdrop-blur-lg'>
      <div className='flex items-center space-x-2'>
        <Image src='/logo.png' alt='CELESTARAX Logo' width={50} height={50} />
        <span className='font-tilt glitch-effect text-3xl font-bold tracking-wide text-[#ff00ff]'>
          CELESTARAX
        </span>
      </div>

      <nav className='flex items-center space-x-6 font-mono text-lg'>
        <Link href='/universe' className={getNavItemClass('/universe')}>
          UNIVERSE
        </Link>

        <button
          className={getNavItemClass('/explorer')}
          onClick={() => {
            if (onDeployClick) {
              onDeployClick?.();
            } else {
              router.push('/explorer');
            }
          }}
        >
          EXPLORER
        </button>

        <Link href='/deploy' className={getNavItemClass('/deploy')}>
          DEPLOY
        </Link>

        <Link href='/dashboard' className={getNavItemClass('/dashboard')}>
          DASHBOARD
        </Link>

        <div className='group relative'>
          <button className={`${getNavItemClass('/about')} flex items-center`}>
            ABOUT <div className='pl-3'>▼</div>
          </button>
          <div className='absolute left-0 mt-2 hidden w-40 border border-[#00ffff] bg-black bg-opacity-80 p-2 text-sm text-[#00ffff] backdrop-blur-md group-hover:block'>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Team
            </Link>
            <Link
              href='#'
              className='block px-2 py-1 hover:bg-[#00ffff] hover:text-black'
            >
              Contact
            </Link>
          </div>
        </div>

        <WalletConnectButton />
      </nav>
    </header>
  );
}
