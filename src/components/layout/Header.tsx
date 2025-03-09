'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import WalletConnectButton from '../WalletConnectButton';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react'; // We import a hamburger menu icon from lucide-react

/**
 * HeaderProps interface for passing optional onDeployClick handler
 */
interface HeaderProps {
  onDeployClick?: () => void;
}

/**
 * Header component with responsive design for mobile, tablet, and desktop
 */
export default function Header({ onDeployClick }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  /**
   * This state controls whether the mobile menu (hamburger) is open
   */
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  /**
   * Function to compute the class for a navigation item based on active route
   */
  const getNavItemClass = (href: string) => {
    const isActive = pathname === href;
    return `relative transition px-2 py-1 ${
      isActive
        ? 'text-white border-b-2 border-[#00ffff] animate-pulse'
        : 'text-[#00ffff] hover:text-white'
    }`;
  };

  /**
   * Toggles the mobile menu open/close
   */
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <header className='sticky top-0 z-50 flex w-full items-center justify-between bg-black bg-opacity-50 px-7 py-6 backdrop-blur-lg'>
      {/* Left section: Logo */}
      <div className='flex items-center space-x-2'>
        <Image src='/logo.png' alt='CELESTARAX Logo' width={50} height={50} />
        <span className='glitch-effect font-tilt text-3xl font-bold tracking-wide text-[#ff00ff]'>
          CELESTARAX
        </span>
      </div>

      {/* Desktop/Tablet Nav (hidden on mobile) */}
      <nav className='hidden items-center space-x-6 font-mono text-lg lg:flex'>
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

        <WalletConnectButton />
      </nav>

      {/* Hamburger icon for mobile (hidden on md and up) */}
      <button
        type='button'
        className='text-[#00ffff] hover:text-white lg:hidden'
        onClick={toggleMenu}
      >
        <Menu size={28} />
      </button>

      {/* Mobile Nav (visible only if isMenuOpen, and hidden on md+) */}
      {isMenuOpen && (
        <nav className='absolute right-0 top-[70px] mt-2 w-full bg-black bg-opacity-80 px-7 py-4 backdrop-blur-md lg:hidden'>
          <ul className='flex flex-col items-center space-y-4 font-mono text-lg'>
            <li>
              <Link
                href='/universe'
                className={getNavItemClass('/universe')}
                onClick={() => setIsMenuOpen(false)} // Close menu on click
              >
                UNIVERSE
              </Link>
            </li>
            <li>
              <button
                className={getNavItemClass('/explorer')}
                onClick={() => {
                  setIsMenuOpen(false); // Close menu
                  if (onDeployClick) {
                    onDeployClick?.();
                  } else {
                    router.push('/explorer');
                  }
                }}
              >
                EXPLORER
              </button>
            </li>
            <li>
              <Link
                href='/deploy'
                className={getNavItemClass('/deploy')}
                onClick={() => setIsMenuOpen(false)}
              >
                DEPLOY
              </Link>
            </li>
            <li>
              <Link
                href='/dashboard'
                className={getNavItemClass('/dashboard')}
                onClick={() => setIsMenuOpen(false)}
              >
                DASHBOARD
              </Link>
            </li>
            <li>
              <WalletConnectButton />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
