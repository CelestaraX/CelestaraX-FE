import type { Metadata } from 'next';
import { Geist, Geist_Mono, Tilt_Prism } from 'next/font/google';
import './globals.css';
import '@rainbow-me/rainbowkit/styles.css';
import { Providers } from './providers';
import StarsSceneWrapper from '@/components/StarsSceneWrapper';

const tiltPrism = Tilt_Prism({
  variable: '--font-tilt',
  subsets: ['latin'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CELESTARAX',
  description: 'Make your planet',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${tiltPrism.variable} m-0 p-0 antialiased`}
      >
        <Providers>
          <div className='flex min-h-screen flex-col'>
            <StarsSceneWrapper className='fixed inset-0 -z-10' />
            <div>{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
