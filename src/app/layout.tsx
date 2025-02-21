import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import StarsSceneWrapper from '@/components/StarsSceneWrapper';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'WEB3ITE',
  description: 'Make your WEB3ITE',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {/* ✅ StarsScene을 absolute로 설정하여 배경으로 만듦 */}
          <div className='relative h-screen w-screen overflow-hidden'>
            {/* ✅ StarsScene을 클라이언트에서만 실행 (SSR 문제 해결) */}
            <StarsSceneWrapper className='fixed inset-0 -z-10' />
            <main className='relative z-10 flex h-full flex-col'>
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
