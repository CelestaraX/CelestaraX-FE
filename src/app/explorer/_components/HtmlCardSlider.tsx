'use client';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  MouseEvent,
} from 'react';
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
import { mammothon } from '@/wagmi';

import { GET_PAGE_CREATEDS } from '@/lib/graphql/queries';
import { PageCreated } from '@/types';
import { config } from '@/wagmi'; // Your global wagmi config

import { JsonRpcProvider, Contract } from 'ethers';
import Image from 'next/image';

/**
 * ABI for the "vote" function
 */
const VOTE_CONTRACT_ABI = [
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
 * Contract address & RPC
 */
const VOTE_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;

if (!VOTE_CONTRACT_ADDRESS) {
  throw new Error(
    'Missing NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables',
  );
}
if (!RPC_URL) {
  throw new Error('Missing NEXT_PUBLIC_RPC_URL in environment variables');
}

/**
 * ABI for fetching HTML by pageId
 */
const FETCH_CONTRACT_ABI = [
  {
    constant: true,
    inputs: [{ name: 'pageId', type: 'uint256' }],
    name: 'getCurrentHtml',
    outputs: [{ name: 'htmlContent', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Small spinner component (adding neon style)
 */
function Spinner() {
  return (
    <svg
      className='text-neon-pink h-5 w-5 animate-spin'
      xmlns='http://www.w3.org/2000/svg'
      fill='none'
      viewBox='0 0 24 24'
    >
      <circle
        className='opacity-25'
        cx='12'
        cy='12'
        r='10'
        stroke='currentColor'
        strokeWidth='4'
      />
      <path
        className='opacity-75'
        fill='currentColor'
        d='M4 12a8 8 0 018-8v8H4z'
      />
    </svg>
  );
}

/**
 * Fetch HTML content from chain
 */
export async function fetchPageDataFromContract(
  pageId: string,
): Promise<string> {
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new Contract(
      VOTE_CONTRACT_ADDRESS,
      FETCH_CONTRACT_ABI,
      provider,
    );

    console.log(`Fetching HTML for pageId: ${pageId}`);
    const htmlContent = await contract.getCurrentHtml(pageId);
    console.log(`HTML fetched:`, htmlContent);
    return htmlContent;
  } catch (err) {
    console.error(`Error fetching page data for pageId=${pageId}:`, err);
    return '<p>Error loading content from blockchain</p>';
  }
}

/**
 * Main Explorer page component
 */
export default function HtmlCardSlider() {
  const { data, loading, error, refetch } = useQuery<{ pages: PageCreated[] }>(
    GET_PAGE_CREATEDS,
  );

  // Swiper & index
  const [swiperRef, setSwiperRef] = useState<SwiperClass | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Blockchain HTML
  const [blockchainHtml, setBlockchainHtml] = useState('<p>Loading...</p>');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Wallet
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Filter pages from subgraph
  const allPages = useMemo(() => data?.pages || [], [data]);
  const filteredPages = useMemo(() => {
    return allPages.filter((page) =>
      page.pageId.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [searchQuery, allPages]);

  /**
   * Local store for like/dislike counts.
   */
  const [localVotes, setLocalVotes] = useState<{
    [pageId: string]: { totalLikes: number; totalDislikes: number };
  }>({});

  /**
   * Track the user's personal vote (like or dislike)
   */
  const [userVotes, setUserVotes] = useState<{
    [pageId: string]: boolean | null;
  }>({});

  /**
   * On subgraph data update, parse totalLikes/totalDislikes as number
   */
  useEffect(() => {
    if (filteredPages.length > 0) {
      const updated: {
        [key: string]: { totalLikes: number; totalDislikes: number };
      } = {};
      filteredPages.forEach((page) => {
        updated[page.pageId] = {
          totalLikes: Number(page.totalLikes) || 0,
          totalDislikes: Number(page.totalDislikes) || 0,
        };
      });
      setLocalVotes((prev) => ({ ...prev, ...updated }));
    }
  }, [filteredPages]);

  // For spinner
  const [isTxAwaitingConfirmation, setIsTxAwaitingConfirmation] =
    useState(false);

  // Pending tx
  const [pendingTxPageId, setPendingTxPageId] = useState<string | null>(null);
  const [pendingTxIsLike, setPendingTxIsLike] = useState<boolean | null>(null);

  // Wagmi contract write
  const { data: txData, writeContract } = useWriteContract({ config });

  // Navigation checks
  const canPrev = activeIndex > 0;
  const canNext = activeIndex < filteredPages.length - 1;

  /**
   * handleVote
   */
  const handleVote = useCallback(
    async (pageId: string, isLike: boolean) => {
      if (!isConnected) {
        // If not connected, open wallet modal
        if (openConnectModal) {
          openConnectModal();
        } else {
          alert('Cannot open wallet modal for connection.');
        }
        return;
      }

      try {
        setIsTxAwaitingConfirmation(true);
        setPendingTxPageId(pageId);
        setPendingTxIsLike(isLike);

        // Immediately set user vote so button color changes
        setUserVotes((prev) => ({
          ...prev,
          [pageId]: isLike,
        }));

        // Simulate
        const result = await simulateContract(config, {
          chainId: mammothon.id,
          address: VOTE_CONTRACT_ADDRESS,
          abi: VOTE_CONTRACT_ABI,
          functionName: 'vote',
          args: [parseInt(pageId, 10), isLike],
        });

        // Send TX
        writeContract(
          {
            ...result.request,
          },
          {
            onError: (err) => {
              console.error('Transaction error:', err);
              // Reset states
              setIsTxAwaitingConfirmation(false);
              setPendingTxPageId(null);
              setPendingTxIsLike(null);
              setUserVotes((prev) => ({
                ...prev,
                [pageId]: null,
              }));
            },
            onSuccess: () => {
              console.log('Transaction broadcast success');
            },
          },
        );
      } catch (err) {
        console.error('Error in simulateContract:', err);
        setIsTxAwaitingConfirmation(false);
        setPendingTxPageId(null);
        setPendingTxIsLike(null);
        setUserVotes((prev) => ({
          ...prev,
          [pageId]: null,
        }));
      }
    },
    [isConnected, openConnectModal, writeContract],
  );

  /**
   * Wait for confirmation => update local state or refetch
   */
  useEffect(() => {
    if (!txData) return;
    let cancelled = false;

    const waitForReceipt = async () => {
      try {
        await waitForTransactionReceipt(config, {
          hash: txData,
          chainId: mammothon.id,
          confirmations: 1,
        });

        if (!cancelled) {
          if (pendingTxPageId && pendingTxIsLike !== null) {
            // Update local votes
            setLocalVotes((prev) => {
              const curr = prev[pendingTxPageId] || {
                totalLikes: 0,
                totalDislikes: 0,
              };
              const newLikes = curr.totalLikes + (pendingTxIsLike ? 1 : 0);
              const newDislikes =
                curr.totalDislikes + (pendingTxIsLike ? 0 : 1);
              return {
                ...prev,
                [pendingTxPageId]: {
                  totalLikes: newLikes,
                  totalDislikes: newDislikes,
                },
              };
            });
          }

          // Refetch subgraph
          refetch();

          // Reset
          setIsTxAwaitingConfirmation(false);
          setPendingTxPageId(null);
          setPendingTxIsLike(null);
        }
      } catch (err) {
        console.error('Transaction confirmation error:', err);
        if (!cancelled) {
          setIsTxAwaitingConfirmation(false);
          setPendingTxPageId(null);
          setPendingTxIsLike(null);
        }
      }
    };

    waitForReceipt();
    return () => {
      cancelled = true;
    };
  }, [txData, pendingTxPageId, pendingTxIsLike, refetch]);

  /**
   * Fetch HTML from chain when activeIndex changes
   */
  useEffect(() => {
    if (filteredPages.length === 0) {
      setBlockchainHtml('<p>No pages available</p>');
      return;
    }
    const page = filteredPages[activeIndex];
    if (!page) {
      setBlockchainHtml('<p>Invalid page</p>');
      return;
    }
    fetchPageDataFromContract(page.pageId).then(setBlockchainHtml);
  }, [filteredPages, activeIndex]);

  // Subgraph load states
  if (loading) {
    return <div className='text-white'>Loading from subgraph...</div>;
  }
  if (error) {
    return <div className='text-white'>Error: {error.message}</div>;
  }

  // Drawer controls
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);
  const handleOverlayClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).id === 'drawerOverlay') {
      setIsDrawerOpen(false);
    }
  };

  // Current page
  const currentPage = filteredPages[activeIndex] || null;

  /**
   * Helper: check spinner state for a button
   */
  const shouldShowSpinner = (pageId: string, isLikeButton: boolean) => {
    return (
      isTxAwaitingConfirmation &&
      pendingTxPageId === pageId &&
      pendingTxIsLike === isLikeButton
    );
  };

  return (
    <div className='text-neon-pink relative flex h-full w-full flex-col items-center justify-center gap-10'>
      {/** Search input */}
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
          className='focus:ring-neon-pink w-full rounded-xl bg-[#1c1c1e] px-10 py-2 text-gray-300 placeholder-gray-500 outline-none focus:ring-2'
        />
      </div>

      {/** Drawer button */}
      <motion.button
        className='flex items-center gap-1 rounded-md bg-gray-700 px-4 py-2 text-white shadow-[0_0_8px_rgba(255,0,255,0.3)] hover:bg-gray-500'
        whileTap={{ scale: 0.9 }}
        onClick={toggleDrawer}
      >
        <Search size={20} />
        <span>Show Details</span>
      </motion.button>

      {/** Swiper nav */}
      <div className='flex w-full max-w-[1600px] items-center justify-between px-4'>
        <motion.button
          disabled={!canPrev}
          className={`rounded-full p-3 text-white transition ${
            canPrev
              ? 'border-neon-pink border bg-black hover:shadow-[0_0_10px_rgba(255,0,255,0.4)]'
              : 'cursor-not-allowed bg-gray-500/50'
          }`}
          whileHover={canPrev ? { scale: 1.2 } : {}}
          whileTap={canPrev ? { scale: 0.9 } : {}}
          onClick={() => canPrev && swiperRef?.slidePrev()}
        >
          <ChevronLeft size={36} />
        </motion.button>

        <Swiper
          spaceBetween={10}
          slidesPerView={1}
          onSwiper={(swiper) => setSwiperRef(swiper)}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          modules={[Navigation]}
          className='border-neon-pink h-[950px] w-[1300px] border bg-black/20 shadow-[0_0_15px_rgba(255,0,255,0.2)]'
        >
          {filteredPages.map((page) => (
            <SwiperSlide key={page.id}>
              <motion.div
                className='border-neon-pink flex h-full flex-col border-b bg-black bg-opacity-40 p-3 shadow-inner'
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h2 className='text-neon-pink mb-3 text-center text-lg font-bold'>
                  {page.name}
                </h2>
                {currentPage && currentPage.pageId === page.pageId ? (
                  <iframe
                    srcDoc={blockchainHtml}
                    className='border-neon-pink h-full w-full flex-1 border bg-gray-900'
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
          disabled={!canNext}
          className={`rounded-full p-3 text-white transition ${
            canNext
              ? 'border-neon-pink border bg-black hover:shadow-[0_0_10px_rgba(255,0,255,0.4)]'
              : 'cursor-not-allowed bg-gray-500/50'
          }`}
          whileHover={canNext ? { scale: 1.2 } : {}}
          whileTap={canNext ? { scale: 0.9 } : {}}
          onClick={() => canNext && swiperRef?.slideNext()}
        >
          <ChevronRight size={36} />
        </motion.button>
      </div>

      {/** Like/Dislike section */}
      {currentPage && (
        <div className='flex items-center gap-5'>
          <motion.button
            className={`flex items-center gap-2 rounded-full border border-transparent px-5 py-2 text-white transition hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] ${
              userVotes[currentPage.pageId] === true
                ? 'border-green-500 bg-green-600'
                : 'bg-gray-600'
            } ${
              shouldShowSpinner(currentPage.pageId, true)
                ? 'pointer-events-none opacity-70'
                : ''
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(currentPage.pageId, true)}
          >
            {shouldShowSpinner(currentPage.pageId, true) ? (
              <Spinner />
            ) : (
              <ThumbsUp size={20} />
            )}
            <span className='font-semibold'>
              Like (
              {localVotes[currentPage.pageId]?.totalLikes ??
                (Number(currentPage.totalLikes) || 0)}
              )
            </span>
          </motion.button>

          <motion.button
            className={`flex items-center gap-2 rounded-full border border-transparent px-5 py-2 text-white transition hover:shadow-[0_0_10px_rgba(255,255,255,0.3)] ${
              userVotes[currentPage.pageId] === false
                ? 'border-red-500 bg-red-600'
                : 'bg-gray-600'
            } ${
              shouldShowSpinner(currentPage.pageId, false)
                ? 'pointer-events-none opacity-70'
                : ''
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => handleVote(currentPage.pageId, false)}
          >
            {shouldShowSpinner(currentPage.pageId, false) ? (
              <Spinner />
            ) : (
              <ThumbsDown size={20} />
            )}
            <span className='font-semibold'>
              Dislike (
              {localVotes[currentPage.pageId]?.totalDislikes ??
                (Number(currentPage.totalDislikes) || 0)}
              )
            </span>
          </motion.button>
        </div>
      )}

      {/** Drawer */}
      <AnimatePresence>
        {isDrawerOpen && currentPage && (
          <div
            id='drawerOverlay'
            className='fixed inset-0 z-50 flex justify-end bg-black bg-opacity-50'
            onClick={handleOverlayClick}
          >
            <motion.div
              className='border-neon-pink relative h-full w-[550px] border-l-4 bg-zinc-900 p-6 text-white shadow-[0_0_15px_rgba(255,0,255,0.3)]'
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
            >
              <button
                className='absolute right-4 top-4 text-zinc-400 hover:text-zinc-200'
                onClick={() => setIsDrawerOpen(false)}
              >
                <X size={24} />
              </button>

              <h2 className='text-neon-pink mb-4 text-2xl font-bold'>
                Page Details
              </h2>
              <div className='flex flex-col gap-4 overflow-y-auto pr-2 text-sm'>
                <div>
                  <span className='font-semibold text-pink-400'>Page ID:</span>{' '}
                  {currentPage.pageId}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>Name:</span>{' '}
                  {currentPage.name}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Thumbnail:
                  </span>
                  <div className='mt-2'>
                    {currentPage.thumbnail ? (
                      <Image
                        src={currentPage.thumbnail}
                        alt='Thumbnail'
                        className='rounded-md border border-gray-800'
                        width={200}
                        height={200}
                      />
                    ) : (
                      <p className='text-gray-400'>No thumbnail available</p>
                    )}
                  </div>
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>Creator:</span>{' '}
                  {currentPage.creator}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Ownership Type:
                  </span>{' '}
                  {currentPage.ownershipType}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Update Fee:
                  </span>{' '}
                  {currentPage.updateFee}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Total Likes:
                  </span>{' '}
                  {localVotes[currentPage.pageId]?.totalLikes ??
                    (Number(currentPage.totalLikes) || 0)}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Total Dislikes:
                  </span>{' '}
                  {localVotes[currentPage.pageId]?.totalDislikes ??
                    (Number(currentPage.totalDislikes) || 0)}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>Balance:</span>{' '}
                  {currentPage.balance}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    MultiSig Owners:
                  </span>{' '}
                  {currentPage.multiSigOwners?.join(', ') || 'None'}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    MultiSig Threshold:
                  </span>{' '}
                  {currentPage.multiSigThreshold}
                </div>
                <div>
                  <span className='font-semibold text-pink-400'>
                    Immutable:
                  </span>{' '}
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
