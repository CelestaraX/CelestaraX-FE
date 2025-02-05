import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function Home() {
  return (
    <div className='grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
      <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
        <ConnectButton />
      </div>
    </div>
  );
}
