'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@apollo/client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper/types';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Search,
  X,
} from 'lucide-react';
import { useAccount, useWriteContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { simulateContract, waitForTransactionReceipt } from 'wagmi/actions';
import { mainnet } from 'wagmi/chains';

import { GET_PAGE_CREATEDS } from '@/lib/graphql/queries';
import { PageCreated } from '@/types';
import { config } from '@/wagmi'; // Example global wagmi config

/**
 * Contract ABI for the "vote" function.
 */
const CONTRACT_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_pageId', type: 'uint256' },
      { name: '_isLike', type: 'bool' },
    ],
    name: 'vote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

/**
 * Contract address & RPC checks
 */
const CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

if (!CONTRACT_ADDRESS) {
  throw new Error(
    'Missing NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables',
  );
}
if (!RPC_URL) {
  throw new Error('Missing NEXT_PUBLIC_RPC_URL in environment variables');
}

/**
 * Main Explorer page component.
 * Displays a list of pages (fetched via GraphQL),
 * renders HTML from subgraph data, and allows voting via on-chain transaction.
 */
export default function HtmlCardSlider() {
  /**
   * 1) GraphQL query to fetch page data
   */
  const { data, loading, error, refetch } = useQuery<{ pages: PageCreated[] }>(
    GET_PAGE_CREATEDS,
  );

  // Swiper instance & active slide index
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer state for showing page details
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Check if wallet is connected
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Filtered pages by search
  const allPages = useMemo(() => data?.pages || [], [data]);
  const filteredPages = useMemo(() => {
    return allPages.filter((page) =>
      page.pageId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allPages]);

  /**
   * Local store for like/dislike counts to update instantly after voting
   */
  const [localVotes, setLocalVotes] = useState<{
    [pageId: string]: { totalLikes: number; totalDislikes: number };
  }>({});

  // Sync localVotes with subgraph data
  useEffect(() => {
    if (filteredPages.length > 0) {
      const updatedVotes: {
        [key: string]: { totalLikes: number; totalDislikes: number };
      } = {};
      filteredPages.forEach((page) => {
        updatedVotes[page.pageId] = {
          totalLikes: page.totalLikes,
          totalDislikes: page.totalDislikes,
        };
      });
      setLocalVotes((prev) => ({ ...prev, ...updatedVotes }));
    }
  }, [filteredPages]);

  /**
   * Track pending transaction state
   */
  const [pendingTxPageId, setPendingTxPageId] = useState<string | null>(null);
  const [pendingTxIsLike, setPendingTxIsLike] = useState<boolean | null>(null);

  /**
   * wagmi's useWriteContract for sending transactions.
   * We'll call writeContract(...) with the prepared request from simulateContract.
   */
  const {
    data: txData,
    isPending,
    writeContract,
  } = useWriteContract({
    config, // optional global config
  });

  /**
   * handleVote: user clicks Like/Dislike
   * 1) If not connected -> open wallet modal
   * 2) If connected -> simulateContract -> writeContract
   */
  const handleVote = useCallback(
    async (pageId: string, isLike: boolean) => {
      if (!isConnected) {
        if (openConnectModal) openConnectModal();
        else alert('Cannot open wallet modal for connection.');
        return;
      }

      try {
        setPendingTxPageId(pageId);
        setPendingTxIsLike(isLike);

        // Prepare transaction with simulateContract
        const result = await simulateContract(config, {
          chainId: mainnet.id,
          address: CONTRACT_ADDRESS,
          abi: CONTRACT_ABI,
          functionName: 'vote',
          args: [parseInt(pageId), isLike],
        });

        // Send transaction using writeContract
        writeContract(
          {
            ...result.request,
          },
          {
            onError: (err) => {
              console.error('Transaction error:', err);
              setPendingTxPageId(null);
              setPendingTxIsLike(null);
            },
            onSuccess: () => {
              // We'll update local state after the receipt is confirmed
              console.log('Transaction broadcast success');
            },
          },
        );
      } catch (err) {
        console.error('Error in simulateContract:', err);
        setPendingTxPageId(null);
        setPendingTxIsLike(null);
      }
    },
    [isConnected, openConnectModal, writeContract],
  );

  /**
   * Wait for transaction receipt once txData?.hash is available
   * Then update localVotes & refetch subgraph.
   */
  useEffect(() => {
    if (!txData) return;

    const waitReceipt = async () => {
      try {
        await waitForTransactionReceipt(config, {
          hash: txData,
          chainId: mainnet.id,
          confirmations: 1,
        });

        // Transaction is confirmed; update local UI
        if (pendingTxPageId && pendingTxIsLike !== null) {
          setLocalVotes((prev) => {
            const current = prev[pendingTxPageId] || {
              totalLikes: 0,
              totalDislikes: 0,
            };
            let newLikes = current.totalLikes;
            let newDislikes = current.totalDislikes;

            if (pendingTxIsLike) newLikes += 1;
            else newDislikes += 1;

            return {
              ...prev,
              [pendingTxPageId]: {
                totalLikes: newLikes,
                totalDislikes: newDislikes,
              },
            };
          });
        }

        // Optionally refetch subgraph data
        refetch();

        // Reset states
        setPendingTxPageId(null);
        setPendingTxIsLike(null);
      } catch (err) {
        console.error('Transaction confirmation error:', err);
        setPendingTxPageId(null);
        setPendingTxIsLike(null);
      }
    };

    waitReceipt();
  }, [txData, pendingTxPageId, pendingTxIsLike, refetch]);

  /**
   * Handle loading / error from subgraph
   */
  if (loading)
    return <div className='text-white'>Loading from subgraph...</div>;
  if (error) return <div className='text-white'>Error: {error.message}</div>;

  /**
   * Toggle drawer for page details
   */
  const toggleDrawer = () => {
    setIsDrawerOpen((prev) => !prev);
  };

  /**
   * Close drawer if user clicks overlay
   */
  const handleOverlayClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if ((e.target as HTMLElement).id === 'drawerOverlay') {
      setIsDrawerOpen(false);
    }
  };

  // Current page from the swiper
  const currentPage = filteredPages[activeIndex] || null;

  return (
    <div className='relative flex h-full w-full flex-col items-center justify-center gap-10'>
      {/** 1. Search input */}
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

      {/** Drawer toggle button */}
      <motion.button
        className='flex items-center gap-1 rounded-md bg-gray-600 px-3 py-2 text-white hover:bg-gray-500'
        whileTap={{ scale: 0.9 }}
        onClick={toggleDrawer}
      >
        <Search size={20} />
        <span>Show Details</span>
      </motion.button>

      {/** Swiper for page previews */}
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
                {activeIndex === index ? (
                  <iframe
                    srcDoc={page.currentHtml}
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

      {/** Like/Dislike buttons */}
      {currentPage && (
        <div className='flex items-center gap-5'>
          <motion.button
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition ${
              pendingTxPageId === currentPage.pageId && pendingTxIsLike
                ? 'bg-green-400'
                : 'bg-gray-700'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(currentPage.pageId, true)}
            disabled={
              isPending &&
              pendingTxPageId === currentPage.pageId &&
              (pendingTxIsLike ?? undefined)
            }
          >
            <ThumbsUp size={20} />
            <span>
              Like (
              {localVotes[currentPage.pageId]?.totalLikes ??
                currentPage.totalLikes}
              )
            </span>
          </motion.button>

          <motion.button
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-white transition ${
              pendingTxPageId === currentPage.pageId &&
              pendingTxIsLike === false
                ? 'bg-red-400'
                : 'bg-gray-700'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(currentPage.pageId, false)}
            disabled={
              isPending &&
              pendingTxPageId === currentPage.pageId &&
              pendingTxIsLike === false
            }
          >
            <ThumbsDown size={20} />
            <span>
              Dislike (
              {localVotes[currentPage.pageId]?.totalDislikes ??
                currentPage.totalDislikes}
              )
            </span>
          </motion.button>
        </div>
      )}

      {/** Drawer for extra page info */}
      <AnimatePresence>
        {isDrawerOpen && currentPage && (
          <div
            id='drawerOverlay'
            className='fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50'
            onClick={handleOverlayClick}
          >
            <motion.div
              className='relative h-full w-80 bg-white p-4 text-black'
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <button
                className='absolute right-3 top-3 text-gray-700 hover:text-black'
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={24} />
              </button>

              <h2 className='mb-4 text-xl font-bold'>Page Details</h2>
              <div className='flex flex-col gap-2'>
                <div>
                  <span className='font-semibold'>Page ID:</span>{' '}
                  {currentPage.pageId}
                </div>
                <div>
                  <span className='font-semibold'>Name:</span>{' '}
                  {currentPage.name}
                </div>
                <div>
                  <span className='font-semibold'>Thumbnail:</span>{' '}
                  {currentPage.thumbnail}
                </div>
                <div>
                  <span className='font-semibold'>Creator:</span>{' '}
                  {currentPage.creator}
                </div>
                <div>
                  <span className='font-semibold'>Ownership Type:</span>{' '}
                  {currentPage.ownershipType}
                </div>
                <div>
                  <span className='font-semibold'>Update Fee:</span>{' '}
                  {currentPage.updateFee}
                </div>
                <div>
                  <span className='font-semibold'>Total Likes:</span>{' '}
                  {localVotes[currentPage.pageId]?.totalLikes ??
                    currentPage.totalLikes}
                </div>
                <div>
                  <span className='font-semibold'>Total Dislikes:</span>{' '}
                  {localVotes[currentPage.pageId]?.totalDislikes ??
                    currentPage.totalDislikes}
                </div>
                <div>
                  <span className='font-semibold'>Balance:</span>{' '}
                  {currentPage.balance}
                </div>
                <div>
                  <span className='font-semibold'>MultiSig Owners:</span>{' '}
                  {currentPage.multiSigOwners?.join(', ')}
                </div>
                <div>
                  <span className='font-semibold'>MultiSig Threshold:</span>{' '}
                  {currentPage.multiSigThreshold}
                </div>
                <div>
                  <span className='font-semibold'>Immutable (IMT):</span>{' '}
                  {String(currentPage.imt)}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Example GET_PAGE_CREATEDS query.
 *
 * import { gql } from '@apollo/client';
 * export const GET_PAGE_CREATEDS = gql`
 *   query GetAllPages {
 *     pages(first: 1000, orderBy: pageId, orderDirection: asc) {
 *       id
 *       pageId
 *       creator
 *       name
 *       thumbnail
 *       ownershipType
 *       updateFee
 *       imt
 *       currentHtml
 *       totalLikes
 *       totalDislikes
 *       balance
 *       multiSigOwners
 *       multiSigThreshold
 *     }
 *   }
 * `;
 */

/**
 * Example Apollo Client setup (if needed in a separate file):
 *
 * import { ApolloClient, InMemoryCache } from '@apollo/client';
 * const client = new ApolloClient({
 *   uri: process.env.NEXT_PUBLIC_API_URL,
 *   cache: new InMemoryCache(),
 * });
 * export default client;
 */
