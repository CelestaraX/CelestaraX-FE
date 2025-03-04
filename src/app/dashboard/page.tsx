'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { Canvas } from '@react-three/fiber';
import { Planet } from './_components/Planet'; // Adjust import path
import Header from '@/components/layout/Header'; // Adjust import path
import { toast } from 'react-hot-toast';

import {
  GET_PAGES_BY_OWNER,
  GET_PAGE_UPDATES,
  GET_PAGE_CREATEDS as GET_ALL_PAGES,
} from '@/lib/graphql/queries';

import {
  fetchPageDataFromContract,
  fetchUpdateRequestFromContract,
  approveUpdateRequestOnContract,
} from '@/lib/blockchain';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clipboard, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageCreated } from '@/types';
import { ethers } from 'ethers';

/**
 * Example type for updateRequests (subgraph).
 */
interface UpdateRequestSubgraph {
  requestId: string;
  requester: string;
}

/**
 * parseOwnershipType:
 * Converts numeric ownershipType into readable string.
 */
function parseOwnershipType(value?: number) {
  switch (value) {
    case 0:
      return 'Single';
    case 1:
      return 'MultiSig';
    case 2:
      return 'Permissionless';
    default:
      return String(value);
  }
}

/**
 * safeNum:
 * Converts string to number safely.
 */
function safeNum(val?: string | null) {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * Small loading indicator
 */
function Spinner() {
  return (
    <svg
      className='text-neon-pink h-6 w-6 animate-spin'
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
 * generatePlanetAttributes:
 * - color: ~hash-based
 * - planetSize: fixed=2
 * - rotationSpeed: ~hash-based
 * - geometries: (hash % 6)
 */
function generatePlanetAttributes(id: string) {
  const hashCode = (str: string) =>
    str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const numericId = hashCode(id);
  return {
    color: `#${((numericId * 9973) % 0xffffff).toString(16).padStart(6, '0')}`,
    planetSize: 2,
    rotationSpeed: (numericId % 5) * 0.3 + 0.5,
    geometries: numericId % 6, // 0~5
  };
}

export default function DashboardPage() {
  /**
   * Wallet connection
   */
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  /** My Deployments & All Pages */
  const {
    data: myDeploymentsData,
    loading: myDeploymentsLoading,
    error: myDeploymentsError,
  } = useQuery<{ pages: PageCreated[] }>(GET_PAGES_BY_OWNER, {
    variables: { ownerAddress: address?.toLowerCase() || '' },
    skip: !address,
  });

  const {
    data: allPagesData,
    loading: allPagesLoading,
    error: allPagesError,
  } = useQuery<{ pages: PageCreated[] }>(GET_ALL_PAGES);

  /** Local state for selection & HTML */
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);

  /** Query for requests from subgraph */
  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useQuery<{
    pages: (PageCreated & { updateRequests: UpdateRequestSubgraph[] })[];
  }>(GET_PAGE_UPDATES, {
    variables: { pageId: selectedPageId || '' },
    skip: !selectedPageId,
  });

  /** selectedPage => from myDeployments */
  const selectedPage = useMemo(() => {
    if (!myDeploymentsData?.pages || !selectedPageId) return null;
    return myDeploymentsData.pages.find((p) => p.pageId === selectedPageId);
  }, [myDeploymentsData, selectedPageId]);

  /** auto-select first page if none chosen */
  useEffect(() => {
    if (!selectedPageId && myDeploymentsData?.pages?.length) {
      setSelectedPageId(myDeploymentsData.pages[0].pageId);
    }
  }, [myDeploymentsData, selectedPageId]);

  /** fetch HTML from chain */
  useEffect(() => {
    if (!selectedPageId) {
      setSelectedHtml(null);
      return;
    }
    fetchPageDataFromContract(selectedPageId).then(setSelectedHtml);
  }, [selectedPageId]);

  /**
   * rankMap => compute rank by (likes - dislikes) desc
   * So that top rank = highest (likes - dislikes).
   */
  const rankMap = useMemo(() => {
    if (!allPagesData?.pages) return {};
    const sorted = [...allPagesData.pages].sort((a, b) => {
      const scoreA = safeNum(a.totalLikes) - safeNum(a.totalDislikes);
      const scoreB = safeNum(b.totalLikes) - safeNum(b.totalDislikes);
      return scoreB - scoreA; // DESC
    });
    const map: Record<string, number> = {};
    sorted.forEach((p, idx) => {
      map[p.pageId] = idx + 1;
    });
    return map;
  }, [allPagesData]);

  /**
   * #1: We only want executed=false requests from chain,
   * so let's store them in chainRequests after we fetch subgraph requestsData.
   */
  const [chainRequests, setChainRequests] = useState<
    { requestId: string; requester: string }[]
  >([]);

  /** We show spinner while chainRequests is being loaded => new local state */
  const [chainRequestsLoading, setChainRequestsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!selectedPageId) {
        setChainRequests([]);
        return;
      }
      // We start loading
      setChainRequestsLoading(true);

      if (!requestsData?.pages || requestsData.pages.length === 0) {
        setChainRequests([]);
        setChainRequestsLoading(false);
        return;
      }

      const subgraphReqs = requestsData.pages[0].updateRequests || [];
      const results: { requestId: string; requester: string }[] = [];

      for (const req of subgraphReqs) {
        const chainData = await fetchUpdateRequestFromContract(
          selectedPageId,
          req.requestId,
        );
        if (chainData && chainData.executed === false) {
          results.push({ requestId: req.requestId, requester: req.requester });
        }
      }
      setChainRequests(results);
      setChainRequestsLoading(false);
    })();
  }, [requestsData, selectedPageId]);

  /**
   * #2 => My Deployments에 "Requests" column: # of executed=false
   * We'll do a separate effect that queries each page's requests,
   * filter out executed=true, count them, store in requestsCountMap.
   */
  const [requestsCountMap, setRequestsCountMap] = useState<
    Record<string, number>
  >({});
  /** show spinner for requestsCount as well => local state */
  const [requestsCountLoading, setRequestsCountLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!myDeploymentsData?.pages) return;
      // start spinner
      setRequestsCountLoading(true);

      const newMap: Record<string, number> = {};

      for (const page of myDeploymentsData.pages) {
        // We'll do a subgraph fetch for that page to get all requests
        let requestsFromSubgraph: UpdateRequestSubgraph[] = [];
        try {
          const url = process.env.NEXT_PUBLIC_API_URL;
          if (!url) throw new Error('No NEXT_PUBLIC_API_URL found.');

          const query = `query MyReq($pid: String!) {
            pages(where: { pageId: $pid }) {
              updateRequests {
                requestId
                requester
              }
            }
          }`;
          const body = JSON.stringify({
            query,
            variables: { pid: page.pageId },
          });
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
          const json = await resp.json();

          if (json.data?.pages?.length) {
            requestsFromSubgraph = json.data.pages[0].updateRequests;
          }
        } catch (err) {
          console.error('Error fetching subgraph for page:', page.pageId, err);
          requestsFromSubgraph = [];
        }

        // Now check on-chain for each request -> executed?
        let count = 0;
        for (const req of requestsFromSubgraph) {
          const chainData = await fetchUpdateRequestFromContract(
            page.pageId,
            req.requestId,
          );
          if (chainData && chainData.executed === false) {
            count++;
          }
        }

        newMap[page.pageId] = count;
      }

      setRequestsCountMap(newMap);
      setRequestsCountLoading(false);
    })();
  }, [myDeploymentsData]);

  /** Request modal states */
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestData, setRequestData] = useState<{
    newName: string;
    newThumbnail: string;
    newHtml: string;
    executed: boolean;
    approvalCount: string;
  } | null>(null);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null,
  );

  /** copy states */
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTx, setCopiedTx] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string>('');
  const [checkingWallet, setCheckingWallet] = useState(true);
  const [isApproving, setIsApproving] = useState(false);

  /** #4 Pagination states: myDeployments(5 per page), requests(3 per page) */
  const [myDepPage, setMyDepPage] = useState(1);
  const [reqPage, setReqPage] = useState(1);

  const DEP_PER_PAGE = 5;
  const REQ_PER_PAGE = 3;

  // My Deployments pagination
  const deploymentsList = myDeploymentsData?.pages || [];
  const totalDepPages = Math.ceil(deploymentsList.length / DEP_PER_PAGE);

  const pagedDeployments = useMemo(() => {
    const start = (myDepPage - 1) * DEP_PER_PAGE;
    const end = start + DEP_PER_PAGE;
    return deploymentsList.slice(start, end);
  }, [deploymentsList, myDepPage]);

  // Requests pagination (chainRequests => only executed=false)
  const totalReqPages = Math.ceil(chainRequests.length / REQ_PER_PAGE);
  const pagedRequests = useMemo(() => {
    const start = (reqPage - 1) * REQ_PER_PAGE;
    const end = start + REQ_PER_PAGE;
    return chainRequests.slice(start, end);
  }, [chainRequests, reqPage]);

  /** isImmutableOrPerm => block approvals */
  const isImmutableOrPerm = useMemo(() => {
    if (!selectedPage) return false;
    const ownerNum = selectedPage.ownershipType ?? -1;
    const isPerm = ownerNum === 2;
    const isImm = selectedPage.imt ?? false;
    return isPerm || isImm;
  }, [selectedPage]);

  // For wallet check
  useEffect(() => {
    if (checkingWallet) {
      setTimeout(() => setCheckingWallet(false), 800);
    }
  }, [checkingWallet]);

  // If not connected => open modal (optional)
  useEffect(() => {
    if (!checkingWallet && !isConnected && openConnectModal) {
      openConnectModal();
    }
  }, [isConnected, openConnectModal, checkingWallet]);

  // If still checking
  if (checkingWallet) {
    return (
      <div>
        <Header />
        <div className='flex h-screen flex-col items-center justify-center text-white'>
          <Spinner />
          <p className='mt-3 font-mono text-sm'>
            Checking wallet connection...
          </p>
        </div>
      </div>
    );
  }

  // If not connected => block
  if (!isConnected) {
    return (
      <div>
        <Header />
        <div className='flex h-screen flex-col items-center justify-center text-white'>
          <Spinner />
          <p className='mt-3 font-mono text-sm'>
            Please connect your wallet to access this page...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Handle request item click => open modal
   */
  const handleRequestClick = async (requestId: string) => {
    setShowRequestModal(true);
    setSelectedRequestId(requestId);
    setRequestData(null); // Clear old data while loading

    if (!selectedPageId) return;
    // Spinner-like approach => re-fetch from chain
    const data = await fetchUpdateRequestFromContract(
      selectedPageId,
      requestId,
    );
    if (data) setRequestData(data);
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setSelectedRequestId(null);
    setRequestData(null);
  };

  /** Approve logic */
  const handleApprove = async () => {
    if (!selectedPageId || !selectedRequestId) return;
    try {
      setIsApproving(true);
      await approveUpdateRequestOnContract(selectedPageId, selectedRequestId);
      toast.success('Approved request!');

      // refetch subgraph
      refetchRequests();

      // re-fetch chain data => update modal
      const updatedData = await fetchUpdateRequestFromContract(
        selectedPageId,
        selectedRequestId,
      );
      if (updatedData) setRequestData(updatedData);

      // re-fetch the requestsCountMap as well
      // (not super optimal to do one by one => but for demonstration)
      setRequestsCountLoading(true);
      const newMap = { ...requestsCountMap };
      // Re-check this page's requests
      // We do a mini subgraph fetch (like above).
      let requestsFromSubgraph: UpdateRequestSubgraph[] = [];
      try {
        const url = process.env.NEXT_PUBLIC_API_URL;
        if (url) {
          const query = `query MyReq($pid: String!) {
            pages(where: { pageId: $pid }) {
              updateRequests {
                requestId
                requester
              }
            }
          }`;
          const body = JSON.stringify({
            query,
            variables: { pid: selectedPageId },
          });
          const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
          });
          const json = await resp.json();
          if (json.data?.pages?.length) {
            requestsFromSubgraph = json.data.pages[0].updateRequests;
          }
        }
      } catch (err) {
        console.error(
          'Error re-fetching subgraph for page:',
          selectedPageId,
          err,
        );
      }
      let count = 0;
      for (const req of requestsFromSubgraph) {
        const chainData = await fetchUpdateRequestFromContract(
          selectedPageId,
          req.requestId,
        );
        if (chainData && chainData.executed === false) {
          count++;
        }
      }
      newMap[selectedPageId] = count;
      setRequestsCountMap(newMap);
      setRequestsCountLoading(false);

      setIsApproving(false);
    } catch (err) {
      console.error('Error approving request:', err);
      toast.error('Failed to approve request.');
      setIsApproving(false);
    }
  };

  /** shortenAddress => (0xABCD...1234) */
  const shortenAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyToClipboard = (addr: string, index: number) => {
    navigator.clipboard.writeText(addr);
    setCopiedIndex(index);
    toast.success('Address copied!');
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const copyTxToClipboard = (id: string, tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    setCopiedId(id);
    toast.success('Transaction copied!');
    setTimeout(() => setCopiedTx(''), 1500);
  };

  /** Subgraph loading states for MyDeployments & AllPages */
  if (myDeploymentsLoading || allPagesLoading) {
    return (
      <div className='text-neon-pink flex h-screen flex-col items-center justify-center'>
        <Spinner />
        <p className='mt-2 font-mono text-lg tracking-wide'>
          Loading your deployments / ranking...
        </p>
      </div>
    );
  }
  if (myDeploymentsError) {
    return (
      <div>
        <Header />
        <main className='flex h-screen items-center justify-center'>
          Error(MyDeployments): {myDeploymentsError.message}
        </main>
      </div>
    );
  }
  if (allPagesError) {
    return (
      <div>
        <Header />
        <main className='flex h-screen items-center justify-center'>
          Error(AllPages): {allPagesError.message}
        </main>
      </div>
    );
  }

  /** planet config for selected page */
  const selectedFile = selectedPageId
    ? generatePlanetAttributes(selectedPageId)
    : null;

  return (
    <div className='min-h-screen'>
      <Header />
      <main className='text-neon-pink flex h-[calc(100vh-100px)] flex-col items-center justify-center font-mono'>
        <div className='border-neon-pink relative flex h-[1000px] w-[1200px] flex-col items-center justify-center border-[3px] p-4 shadow-[0_0_20px_rgba(255,0,255,0.5)]'>
          {/* Left area: Planet + Rank / Likes / Dislikes */}
          <div className='absolute left-9 top-[75px] flex h-[350px] w-[200px] flex-col pl-5 text-white'>
            {/* Planet 3D */}
            <div className='h-full w-full border border-pink-500 p-2'>
              <Canvas>
                <ambientLight intensity={10} />
                <pointLight position={[10, 10, 10]} />
                {selectedFile && (
                  <Planet
                    key={selectedPageId}
                    rotationSpeed={selectedFile.rotationSpeed}
                    planetSize={selectedFile.planetSize}
                    geometries={selectedFile.geometries}
                    color={selectedFile.color}
                  />
                )}
              </Canvas>
            </div>

            {/* PageId info */}
            <div className='text-neon-pink mt-2 text-xs'>
              {selectedPageId ? `#PageId: ${selectedPageId}` : '#PageId: N/A'}
            </div>

            {/* Rank / Likes / Dislikes */}
            <div className='mt-4 space-y-1 text-sm'>
              <div>
                Rank:{' '}
                <span className='text-neon-pink font-bold'>
                  {selectedPageId && rankMap[selectedPageId]
                    ? `#${rankMap[selectedPageId]}`
                    : '--'}
                </span>
              </div>
              <div>
                Likes:{' '}
                <span className='font-bold text-green-400'>
                  {selectedPage ? safeNum(selectedPage.totalLikes) : 0}
                </span>
              </div>
              <div>
                Dislikes:{' '}
                <span className='font-bold text-red-400'>
                  {selectedPage ? safeNum(selectedPage.totalDislikes) : 0}
                </span>
              </div>
            </div>
          </div>

          {/* Right info panel */}
          <div className='absolute right-10 top-16 flex w-[200px] flex-col gap-2 text-sm text-white'>
            <div className='text-neon-pink font-bold'>Ownership</div>
            <div>
              Type:{' '}
              {selectedPage
                ? parseOwnershipType(selectedPage.ownershipType)
                : '--'}
            </div>
            <div className='pb-3'>
              Threshold: {selectedPage?.multiSigThreshold ?? '--'}
            </div>
            <div>
              <div className='text-neon-pink mb-2 font-bold'>Owners</div>
              {selectedPage?.multiSigOwners &&
              selectedPage.multiSigOwners.length > 0 ? (
                <ul className='ml-4 space-y-1 text-xs'>
                  {selectedPage.multiSigOwners.map((owner, idx) => (
                    <li
                      key={idx}
                      className='group flex items-center gap-2'
                      onClick={() => copyToClipboard(owner, idx)}
                    >
                      <span className='cursor-pointer transition hover:text-blue-400'>
                        {owner.slice(0, 6)}...{owner.slice(-4)}
                      </span>
                      <button className='pb-1 opacity-50 transition group-hover:opacity-100'>
                        {copiedIndex === idx ? (
                          <Check size={16} className='text-green-400' />
                        ) : (
                          <Clipboard size={16} />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='text-xs text-gray-300'>No owners</div>
              )}
            </div>

            <div className='border-b border-pink-500 pb-3' />

            {/* Update Fee */}
            <div className='text-neon-pink pt-3 font-bold'>Update Fee:</div>
            <div className='mb-2 font-semibold text-green-400'>
              <span>
                {selectedPage
                  ? ethers.formatEther(BigInt(safeNum(selectedPage.updateFee)))
                  : 0}
              </span>
              <span className='pl-3 text-xs text-gray-400'>Eth</span>
            </div>

            <div className='text-neon-pink font-bold'>Balance:</div>
            <div className='mb-2'>
              <span className='font-semibold text-green-400'>
                {selectedPage
                  ? ethers.formatEther(BigInt(safeNum(selectedPage.balance)))
                  : '0'}
              </span>
              <span className='pl-3 text-xs text-gray-400'>Eth</span>
            </div>
          </div>

          {/* Middle: iframe preview */}
          <div className='border-neon-pink mb-10 flex h-[600px] w-[600px] max-w-4xl items-center justify-center overflow-hidden border bg-white shadow-[0_0_15px_rgba(255,0,255,0.4)]'>
            {selectedHtml ? (
              <iframe className='h-full w-full' srcDoc={selectedHtml} />
            ) : myDeploymentsData?.pages?.length ? (
              <span className='text-neon-pink'>Select a page to preview</span>
            ) : (
              <span className='text-neon-pink'>No pages available</span>
            )}
          </div>

          {/* Bottom: My Deployments + Requests */}
          <div className='mt-6 flex w-full max-w-6xl space-x-6'>
            {/* Left - My Deployments (with Rank column & requests count) */}
            <div className='border-neon-pink flex-1 border p-4'>
              <h2 className='text-neon-pink mb-3 text-lg font-bold'>
                My Deployments
              </h2>

              {myDeploymentsLoading && (
                <div className='flex items-center gap-2 text-white'>
                  <Spinner />
                  <span>Loading My Deployments...</span>
                </div>
              )}
              {myDeploymentsData?.pages?.length === 0 &&
                !myDeploymentsLoading && (
                  <p className='text-sm text-gray-300'>
                    You have not deployed any pages yet.
                  </p>
                )}

              {myDeploymentsData?.pages?.length ? (
                <>
                  <table className='w-full border-collapse text-sm text-white'>
                    <thead>
                      <tr className='border-neon-pink text-neon-pink border-b'>
                        <th className='p-2 text-left'>Name</th>
                        <th className='p-2 text-left'>PageId</th>
                        <th className='p-2 text-left'>Ownership</th>
                        <th className='p-2 text-left'>Rank</th>
                        <th className='p-2 text-left'>Immutable</th>
                        <th className='p-2 text-left'>Likes</th>
                        <th className='p-2 text-left'>Dislikes</th>
                        <th className='p-2 text-left'>Requests</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagedDeployments.map((page) => {
                        const ownershipStr = parseOwnershipType(
                          page.ownershipType,
                        );
                        const isSelected = selectedPageId === page.pageId;
                        const rankVal = rankMap[page.pageId]
                          ? `#${rankMap[page.pageId]}`
                          : '--';

                        // requestsCountMap => how many executed=false
                        const notExecutedCount =
                          requestsCountMap[page.pageId] || 0;

                        return (
                          <tr
                            key={page.id}
                            className={`cursor-pointer border-b border-gray-700 hover:bg-gray-800 ${
                              isSelected ? 'bg-gray-800' : ''
                            }`}
                            onClick={() => {
                              setSelectedPageId(page.pageId);
                            }}
                          >
                            <td className='p-2 text-cyan-300'>{page.name}</td>
                            <td className='p-2'>{page.pageId}</td>
                            <td className='p-2'>{ownershipStr}</td>
                            <td className='p-2 text-yellow-400'>{rankVal}</td>
                            <td className='p-2'>
                              {page.imt ? 'True' : 'False'}
                            </td>
                            <td className='p-2 text-green-400'>
                              {safeNum(page.totalLikes)}
                            </td>
                            <td className='p-2 text-red-400'>
                              {safeNum(page.totalDislikes)}
                            </td>
                            <td className='p-2 text-purple-400'>
                              {/* If requestsCountLoading => show spinner */}
                              {requestsCountLoading ? (
                                <div className='flex items-center gap-2'>
                                  <Spinner />
                                </div>
                              ) : (
                                notExecutedCount
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/** Pagination controls for MyDeployments */}
                  <div className='mt-3 flex items-center justify-center gap-4 text-white'>
                    <motion.button
                      disabled={myDepPage <= 1}
                      className={`rounded-full p-2 ${
                        myDepPage > 1
                          ? 'border border-pink-500 text-pink-200 hover:bg-pink-500 hover:text-white'
                          : 'cursor-not-allowed bg-gray-600 text-gray-400'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMyDepPage((p) => p - 1)}
                    >
                      <ChevronLeft size={20} />
                    </motion.button>
                    <span className='text-sm'>
                      Page {myDepPage} / {totalDepPages}
                    </span>
                    <motion.button
                      disabled={myDepPage >= totalDepPages}
                      className={`rounded-full p-2 ${
                        myDepPage < totalDepPages
                          ? 'border border-pink-500 text-pink-200 hover:bg-pink-500 hover:text-white'
                          : 'cursor-not-allowed bg-gray-600 text-gray-400'
                      }`}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setMyDepPage((p) => p + 1)}
                    >
                      <ChevronRight size={20} />
                    </motion.button>
                  </div>
                </>
              ) : null}
            </div>

            {/* Right - Requests (executed=false only) + pagination */}
            <div className='border-neon-pink w-[300px] border p-4'>
              <h2 className='text-neon-pink mb-3 text-lg font-bold'>
                Requests
              </h2>

              {selectedPage && isImmutableOrPerm && (
                <div className='text-sm text-gray-300'>
                  {parseOwnershipType(selectedPage.ownershipType) ===
                  'Permissionless'
                    ? 'This page is Permissionless. Updates do not require requests.'
                    : 'This page is Immutable. No modification allowed.'}
                </div>
              )}

              {!selectedPageId && myDeploymentsData?.pages?.length ? (
                <div className='text-sm text-gray-300'>
                  Select a page to see requests
                </div>
              ) : null}

              {!isImmutableOrPerm && selectedPageId && (
                <>
                  {/* If subgraph is loading the requests or we are chainRequestsLoading, show spinner */}
                  {(requestsLoading || chainRequestsLoading) && (
                    <div className='flex items-center gap-2 text-white'>
                      <Spinner />
                      <span>Loading requests...</span>
                    </div>
                  )}
                  {requestsError && (
                    <div className='text-sm text-red-400'>
                      Error: {requestsError.message}
                    </div>
                  )}

                  {/* chainRequests => only executed=false => pagedRequests */}
                  {pagedRequests.length > 0 ? (
                    <>
                      <ul className='space-y-2'>
                        {pagedRequests.map((req) => (
                          <li
                            key={req.requestId}
                            className='flex cursor-pointer flex-col border-b border-gray-300 py-1 text-cyan-300 hover:bg-gray-800'
                            onClick={() => handleRequestClick(req.requestId)}
                          >
                            <div>
                              <div className='pb-3 text-sm'>
                                Name: {selectedPage?.name || 'N/A'}
                              </div>
                            </div>
                            <div className='text-xs text-gray-300'>
                              <div>PageId: {selectedPageId}</div>
                              <div>ReqID: {req.requestId}</div>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyTxToClipboard(
                                    req.requestId,
                                    req.requester,
                                  );
                                }}
                                className='flex gap-2 pb-1'
                              >
                                By: {shortenAddress(req.requester)}
                                {copiedTx === req.requester &&
                                copiedId === req.requestId ? (
                                  <Check size={16} className='text-green-400' />
                                ) : (
                                  <Clipboard size={16} />
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      {/** Pagination controls for requests */}
                      <div className='mt-3 flex items-center justify-center gap-4 text-white'>
                        <motion.button
                          disabled={reqPage <= 1}
                          className={`rounded-full p-2 ${
                            reqPage > 1
                              ? 'border border-pink-500 text-pink-200 hover:bg-pink-500 hover:text-white'
                              : 'cursor-not-allowed bg-gray-600 text-gray-400'
                          }`}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setReqPage((p) => p - 1)}
                        >
                          <ChevronLeft size={20} />
                        </motion.button>
                        <span className='text-sm'>
                          Page {reqPage} / {totalReqPages}
                        </span>
                        <motion.button
                          disabled={reqPage >= totalReqPages}
                          className={`rounded-full p-2 ${
                            reqPage < totalReqPages
                              ? 'border border-pink-500 text-pink-200 hover:bg-pink-500 hover:text-white'
                              : 'cursor-not-allowed bg-gray-600 text-gray-400'
                          }`}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setReqPage((p) => p + 1)}
                        >
                          <ChevronRight size={20} />
                        </motion.button>
                      </div>
                    </>
                  ) : (
                    !requestsLoading &&
                    !chainRequestsLoading && (
                      <p className='text-sm text-gray-400'>
                        No update requests found.
                      </p>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for a single request */}
      <AnimatePresence>
        {showRequestModal && selectedPageId && selectedPage && (
          <motion.div
            className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              className='relative h-[500px] w-full max-w-5xl rounded bg-gray-900 p-6 text-white shadow-[0_0_20px_rgba(255,0,255,0.5)]'
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeModal}
                className='absolute right-8 top-8 rounded bg-gray-700 p-1 text-gray-200 hover:bg-gray-600'
              >
                <X size={18} />
              </button>
              <h2 className='text-neon-pink mb-4 text-2xl font-bold'>
                Update Request
              </h2>

              {/* If requestData not loaded => show spinner */}
              {!requestData ? (
                <div className='flex h-full flex-col items-center justify-center'>
                  <Spinner />
                  <p className='mt-2 text-sm text-gray-300'>
                    Loading request details...
                  </p>
                </div>
              ) : (
                <div className='grid grid-cols-2 gap-6'>
                  {/* Left: existing data */}
                  <div className='border-r border-gray-700 pr-4'>
                    <h3 className='text-neon-pink mb-2'>Current Page Info</h3>
                    <div className='space-y-1 text-sm'>
                      <div>Page Name: {selectedPage.name}</div>
                      <div>
                        Thumbnail:{' '}
                        {selectedPage.thumbnail?.slice(0, 40) + '...'}
                      </div>
                      <div>
                        Ownership:{' '}
                        {parseOwnershipType(selectedPage.ownershipType)}
                      </div>
                      <div>Balance: {selectedPage.balance}</div>
                      <div>Current Likes: {selectedPage.totalLikes}</div>
                      <div>Current Dislikes: {selectedPage.totalDislikes}</div>
                    </div>
                    <div className='mt-4 text-sm text-gray-400'>
                      Existing HTML Preview:
                    </div>
                    <div className='mt-2 h-[180px] overflow-auto rounded bg-gray-800 p-2 text-xs'>
                      {selectedHtml}
                    </div>
                  </div>

                  {/* Right: new update data */}
                  <div>
                    <h3 className='text-neon-pink mb-2'>Proposed Changes</h3>
                    <div className='space-y-1 text-sm'>
                      <div>New Name: {requestData.newName || 'N/A'}</div>
                      <div>
                        New Thumbnail:{' '}
                        {requestData.newThumbnail.slice(0, 40) + '...'}
                      </div>
                      <div>Executed: {requestData.executed ? 'Yes' : 'No'}</div>
                      <div>Approvals: {requestData.approvalCount}</div>
                    </div>
                    <div className='mt-4 text-sm text-gray-400'>
                      Proposed HTML Preview:
                    </div>
                    <div className='mt-2 h-[180px] overflow-auto rounded bg-gray-800 p-2 text-xs'>
                      {requestData.newHtml}
                    </div>

                    {/* If Single or MultiSig => can Approve */}
                    {!isImmutableOrPerm && !requestData.executed && (
                      <button
                        className='text-md ml-[370px] mt-4 h-[45px] w-[100px] rounded-md bg-gray-700 font-mono font-semibold text-gray-200 hover:bg-gray-600'
                        onClick={handleApprove}
                        disabled={isApproving}
                      >
                        {isApproving ? (
                          <div className='flex items-center gap-2'>
                            <Spinner />
                            <span>Approve</span>
                          </div>
                        ) : (
                          'Approve'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
