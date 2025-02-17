import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import Header from '@/components/layout/Header';

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
          <div className='flex h-screen flex-col'>
            {/* 헤더 고정 */}
            <Header />

            {/* 메인 컨텐츠가 헤더 아래를 채우도록 설정 */}
            <main className='flex-1 overflow-hidden'>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
