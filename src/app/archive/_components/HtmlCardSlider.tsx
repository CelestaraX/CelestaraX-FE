'use client';

import React, { useState, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { allHTMLFiles } from '@/mock/data';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ThumbsUp, ThumbsDown } from 'lucide-react';

export default function HtmlCardSlider() {
  const htmlFiles = Object.values(allHTMLFiles);
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
  const [likes, setLikes] = useState<{
    [key: string]: 'like' | 'dislike' | null;
  }>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  if (!isClient) {
    return <div className='text-white'>로딩 중...</div>;
  }

  return (
    <div className='flex h-full w-full flex-col items-center justify-center gap-10'>
      <div className='flex w-full max-w-[1200px] items-center justify-between px-4'>
        {/* 왼쪽 네비게이션 버튼 */}
        <motion.button
          className='rounded-full bg-white/30 p-3 text-white transition hover:bg-white/50 sm:p-4 md:p-5 lg:p-6'
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swiperRef?.slidePrev()}
        >
          <ChevronLeft size={36} />
        </motion.button>

        {/* 슬라이드 카드 컨테이너 */}
        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          onSwiper={(swiper) => setSwiperRef(swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          pagination={false}
          modules={[Navigation]}
          className='h-[500px] w-[350px] shadow-lg sm:h-[600px] sm:w-[450px] md:h-[700px] md:w-[550px] lg:h-[800px] lg:w-[700px] xl:h-[900px] xl:w-[800px]'
        >
          {htmlFiles.map((file, index) => (
            <SwiperSlide key={file.id}>
              <motion.div
                className='flex h-full flex-col bg-white bg-opacity-[0.3] p-3 shadow-lg'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {/* 카드 헤더 */}
                <h2 className='mb-3 text-center text-lg font-bold text-black sm:text-xl md:text-2xl'>
                  {file.name}
                </h2>

                {/* ✅ iframe을 사용하여 안전하게 HTML 실행 */}
                {activeIndex === index ? (
                  <iframe
                    srcDoc={file.htmlContent}
                    className='h-full w-full border-none'
                    sandbox='allow-scripts allow-same-origin allow-modals'
                  />
                ) : (
                  <div className='flex h-full w-full items-center justify-center text-gray-500'>
                    HTML 렌더링 중...
                  </div>
                )}
              </motion.div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* 오른쪽 네비게이션 버튼 */}
        <motion.button
          className='rounded-full bg-white/30 p-3 text-white transition hover:bg-white/50 sm:p-4 md:p-5 lg:p-6'
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => swiperRef?.slideNext()}
        >
          <ChevronRight size={36} />
        </motion.button>
      </div>

      {/* 좋아요 & 싫어요 버튼 */}
      <div className='flex items-center gap-3 sm:gap-5 md:gap-8 lg:gap-10'>
        <motion.button
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition sm:px-5 sm:py-3 ${
            likes[htmlFiles[activeIndex]?.id] === 'like'
              ? 'bg-green-500'
              : 'bg-gray-700'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleLike(htmlFiles[activeIndex]?.id)}
        >
          <ThumbsUp size={20} />
          <span className='sm:text-lg md:text-xl'>추천</span>
        </motion.button>

        <motion.button
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition sm:px-5 sm:py-3 ${
            likes[htmlFiles[activeIndex]?.id] === 'dislike'
              ? 'bg-red-500'
              : 'bg-gray-700'
          }`}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleDislike(htmlFiles[activeIndex]?.id)}
        >
          <ThumbsDown size={20} />
          <span className='sm:text-lg md:text-xl'>비추천</span>
        </motion.button>
      </div>
    </div>
  );
}
