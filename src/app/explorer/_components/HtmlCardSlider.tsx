'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Search,
} from 'lucide-react';

import { GET_PAGE_CREATEDS } from '@/lib/graphql/queries';
import { PageCreated } from '@/types';
import { fetchPageDataFromContract } from '@/lib/blockchain'; // 🔹 블록체인 데이터 가져오기

export default function HtmlCardSlider() {
  const { data, loading, error } = useQuery<{ pageCreateds: PageCreated[] }>(
    GET_PAGE_CREATEDS,
  );
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
  const [likes, setLikes] = useState<{
    [key: string]: 'like' | 'dislike' | null;
  }>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [rpcData, setRpcData] = useState<string | undefined>(
    '<p>Loading blockchain data...</p>',
  );

  const allPages = useMemo(() => data?.pageCreateds || [], [data]);

  // 🔹 검색 기능
  const filteredPages = useMemo(() => {
    return allPages.filter((page) =>
      page.pageId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allPages]);

  // ✅ `pageId`를 이용해 블록체인 데이터 가져오기
  useEffect(() => {
    if (filteredPages.length > 0) {
      const currentPageId = filteredPages[activeIndex]?.pageId;
      if (currentPageId) {
        fetchPageDataFromContract(currentPageId).then(setRpcData);
      }
    }
  }, [activeIndex, filteredPages]);

  // 🔹 좋아요 / 싫어요 핸들러
  const handleLike = (id: string) => {
    setLikes((prev) => ({
      ...prev,
      [id]: prev[id] === 'like' ? null : 'like',
    }));
  };

  const handleDislike = (id: string) => {
    setLikes((prev) => ({
      ...prev,
      [id]: prev[id] === 'dislike' ? null : 'dislike',
    }));
  };

  if (loading)
    return <div className='text-white'>Loading from subgraph...</div>;
  if (error) return <div className='text-white'>Error: {error.message}</div>;

  return (
    <div className='flex h-full w-full flex-col items-center justify-center gap-10'>
      {/* ✅ 검색창 */}
      <div className='relative w-80'>
        <Search
          className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-400'
          size={18}
        />
        <input
          type='text'
          placeholder='Search by pageId...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className='w-full rounded-xl bg-[#1c1c1e] px-10 py-2 text-gray-300 placeholder-gray-500 outline-none focus:ring-2 focus:ring-gray-600'
        />
      </div>

      {/* ✅ Swiper */}
      <div className='flex w-full max-w-[1200px] items-center justify-between px-4'>
        <motion.button
          className='rounded-full bg-white/30 p-3 text-white transition hover:bg-white/50'
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swiperRef?.slidePrev()}
        >
          <ChevronLeft size={36} />
        </motion.button>

        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          onSwiper={(swiper) => setSwiperRef(swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          modules={[Navigation]}
          className='h-[700px] w-[600px] shadow-lg'
        >
          {filteredPages.map((page, index) => (
            <SwiperSlide key={page.id}>
              <motion.div
                className='flex h-full flex-col bg-white bg-opacity-[0.3] p-3 shadow-lg'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className='mb-3 text-center text-lg font-bold text-black'>
                  PageId: {page.pageId}
                </h2>

                {/* ✅ 블록체인에서 가져온 HTML 렌더링 */}
                {activeIndex === index ? (
                  <iframe
                    srcDoc={rpcData}
                    className='h-full w-full flex-1 border-none bg-gray-100'
                    sandbox='allow-scripts allow-same-origin allow-modals allow-popups allow-popups-to-escape-sandbox'
                  />
                ) : (
                  <div className='flex flex-1 items-center justify-center text-gray-500'>
                    Rendering data...
                  </div>
                )}
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        <motion.button
          className='rounded-full bg-white/30 p-3 text-white transition hover:bg-white/50'
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swiperRef?.slideNext()}
        >
          <ChevronRight size={36} />
        </motion.button>
      </div>

      {/* ✅ 따봉 (좋아요 & 싫어요) */}
      {filteredPages.length > 0 && (
        <div className='flex items-center gap-5'>
          <motion.button
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition ${
              likes[filteredPages[activeIndex]?.id] === 'like'
                ? 'bg-green-500'
                : 'bg-gray-700'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleLike(filteredPages[activeIndex]?.id)}
          >
            <ThumbsUp size={20} />
            <span>Like</span>
          </motion.button>

          <motion.button
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition ${
              likes[filteredPages[activeIndex]?.id] === 'dislike'
                ? 'bg-red-500'
                : 'bg-gray-700'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleDislike(filteredPages[activeIndex]?.id)}
          >
            <ThumbsDown size={20} />
            <span>Dislike</span>
          </motion.button>
        </div>
      )}
    </div>
  );
}
