import { notFound } from 'next/navigation';
import { allHTMLFiles } from '@/mock/data';
import Header from '@/components/layout/Header';

export default function DetailPage({ params }: { params: { id: string } }) {
  // find item
  const file = allHTMLFiles.find((f) => f.id === params.id);
  if (!file) {
    notFound();
  }
  return (
    <div>
      <Header />
      <h1 className='mb-4 min-h-screen p-4 text-2xl font-bold'>{file.name}</h1>
      {/* 상세 보여주기: script 제거? or not? up to you */}
      <div
        className='prose max-w-full'
        dangerouslySetInnerHTML={{ __html: file.htmlContent }}
      />
    </div>
  );
}
