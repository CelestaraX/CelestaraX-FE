'use client';
import CrossedScene from '@/components/CrossedScene';

export default function Home() {
  return (
    <div className='grid min-h-screen items-center justify-items-center gap-16 p-8 pb-20 font-[family-name:var(--font-geist-sans)] sm:p-20'>
      <main className='relative h-screen w-full'>
        {/* 3D 씬 전체화면 */}
        <CrossedScene />

        {/* Canvas 위에 겹쳐질 UI (예: 헤더, 로고 등) */}
        <div className='absolute left-0 top-0 z-10 w-full p-4 text-white'>
          <h1 className='text-2xl font-bold'>My Galaxy</h1>
        </div>
      </main>
    </div>
  );
}
