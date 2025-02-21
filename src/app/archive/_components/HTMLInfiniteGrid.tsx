'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { debounce } from 'lodash';
import { z } from 'zod';
import { useRouter } from 'next/navigation'; // 상세 이동

// zod schema
const HtmlFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  page: z.string(),
  htmlContent: z.string(),
});
const HtmlFilesResponseSchema = z.object({
  items: z.array(HtmlFileSchema),
  hasMore: z.boolean(),
});

interface HTMLFile {
  id: string;
  name: string;
  page: string;
  htmlContent: string;
}

export default function HTMLInfiniteGrid() {
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<HTMLFile[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  // 검색 변경 시 목록 초기화
  useEffect(() => {
    console.log('Search changed => reset list');
    setItems([]);
    setPage(0);
    setHasMore(true);
  }, [searchTerm]);

  // API 호출
  const fetchHTMLFiles = async (page: number, search: string) => {
    setLoading(true);
    try {
      const url = `/api/htmlfiles?search=${encodeURIComponent(search)}&page=${page}`;
      console.log('fetch =>', url);

      const res = await fetch(url);
      if (!res.ok) throw new Error('Fetch error');
      const data = await res.json();
      const safeData = HtmlFilesResponseSchema.parse(data);

      setItems((prev) => [...prev, ...safeData.items]);
      setHasMore(safeData.hasMore);
      console.log(
        'Fetched items:',
        safeData.items.length,
        'hasMore:',
        safeData.hasMore,
      );
    } catch (err) {
      console.error('Client fetch error:', err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  // page / searchTerm 바뀔 때 로딩
  useEffect(() => {
    if (hasMore) {
      fetchHTMLFiles(page, searchTerm);
    }
  }, [page, searchTerm, hasMore]);

  // 인피니트 스크롤 IntersectionObserver
  const loaderRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = loaderRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !loading && hasMore) {
          console.log('Observer => Next Page');
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 0 }, // or 0.1
    );

    observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
    };
  }, [loading, hasMore]);

  // 검색 Debounce
  const handleSearchChange = useMemo(
    () =>
      debounce((val: string) => {
        setSearchTerm(val);
      }, 300),
    [],
  );

  // 상세 페이지 링크
  const handleClickItem = (id: string) => {
    router.push(`archive/detail/${id}`);
  };

  return (
    // min-h-screen => ensure there's enough vertical space for scrolling
    <div className='container mx-auto min-h-screen px-4 py-6'>
      {/* 검색 */}
      <div className='mb-4'>
        <input
          type='text'
          placeholder='검색...'
          className='w-full max-w-md border p-2'
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* 4열 그리드 */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
        {items.map((file) => (
          // relative 컨테이너
          <div key={file.id} className='relative rounded bg-white p-2 shadow'>
            <h2 className='mb-2 font-bold text-gray-700'>{file.name}</h2>
            {/* HTML 내용: pointer-events-none으로 내부 클릭 막음 */}
            <div
              className='prose pointer-events-none max-w-full'
              dangerouslySetInnerHTML={{ __html: file.htmlContent }}
            />
            {/* 오버레이: absolute inset-0 z-10 cursor-pointer */}
            <div
              className='absolute left-0 top-0 z-10 h-full w-full'
              style={{ cursor: 'pointer' }}
              onClick={() => handleClickItem(file.id)}
            />
          </div>
        ))}
      </div>

      {/* 로딩/하단 */}
      <div
        ref={loaderRef}
        className='mt-4 h-10 w-full text-center text-gray-500'
      >
        {loading ? '로딩중...' : hasMore ? '...' : '모두 로드됨'}
      </div>
    </div>
  );
}
