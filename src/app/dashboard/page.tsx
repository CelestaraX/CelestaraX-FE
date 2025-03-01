'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { Canvas } from '@react-three/fiber';
import { Planet } from './_components/Planet'; // Adjust import path
import Header from '@/components/layout/Header'; // Adjust import path
import { toast } from 'react-hot-toast';

// We add GET_PAGE_CREATEDS as "GET_ALL_PAGES" to fetch all pages for ranking
import {
  GET_PAGES_BY_OWNER,
  GET_PAGE_UPDATES,
  GET_PAGE_CREATEDS as GET_ALL_PAGES,
} from '@/lib/graphql/queries'; // Adjust path

import {
  fetchPageDataFromContract,
  fetchUpdateRequestFromContract,
} from '@/lib/blockchain'; // The code from blockchain.ts
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Clipboard, X } from 'lucide-react';
import { PageCreated } from '@/types';
import { ethers } from 'ethers';

/** Example type for updateRequests */
interface UpdateRequestSubgraph {
  requestId: string;
  requester: string;
}

/** Helper function to parse ownershipType => "Single", "MultiSig", "Permissionless". */
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

/** Safe parse string to number */
function safeNum(val?: string | null) {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/** Small spinner component */
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

/** Generate planet attributes from pageId */
function generatePlanetAttributes(id: string) {
  const hashCode = (str: string) => {
    return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  };
  const numericId = hashCode(id);
  return {
    color: `#${((numericId * 9973) % 0xffffff).toString(16).padStart(6, '0')}`,
    planetSize: 2,
    rotationSpeed: (numericId % 5) * 0.3 + 0.5,
  };
}

export default function Mypage() {
  const { address } = useAccount();

  // 1) Fetch "My Deployments"
  const {
    data: myDeploymentsData,
    loading: myDeploymentsLoading,
    error: myDeploymentsError,
  } = useQuery<{ pages: PageCreated[] }>(GET_PAGES_BY_OWNER, {
    variables: { ownerAddress: address?.toLowerCase() || '' },
    skip: !address,
  });

  // 2) Fetch "All Pages" for ranking by likes
  const {
    data: allPagesData,
    loading: allPagesLoading,
    error: allPagesError,
  } = useQuery<{ pages: PageCreated[] }>(GET_ALL_PAGES);

  // 3) Local states
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedTx, setCopiedTx] = useState<string>('');

  // 4) Query to fetch "Requests" => GET_PAGE_UPDATES
  const {
    data: requestsData,
    loading: requestsLoading,
    error: requestsError,
  } = useQuery<{
    pages: (PageCreated & { updateRequests: UpdateRequestSubgraph[] })[];
  }>(GET_PAGE_UPDATES, {
    variables: { pageId: selectedPageId || '' },
    skip: !selectedPageId,
  });

  /**
   * The selected page from "My Deployments"
   */
  const selectedPage = useMemo(() => {
    if (!myDeploymentsData?.pages || !selectedPageId) return null;
    return myDeploymentsData.pages.find((p) => p.pageId === selectedPageId);
  }, [myDeploymentsData, selectedPageId]);

  /**
   * If no selection & there's a page list, auto-select the first
   */
  useEffect(() => {
    if (!selectedPageId && myDeploymentsData?.pages?.[0]) {
      setSelectedPageId(myDeploymentsData.pages[0].pageId);
    }
  }, [myDeploymentsData, selectedPageId]);

  /**
   * Fetch HTML from contract for selected page
   */
  useEffect(() => {
    if (!selectedPageId) {
      setSelectedHtml(null);
      return;
    }
    fetchPageDataFromContract(selectedPageId).then((html) => {
      setSelectedHtml(html);
    });
  }, [selectedPageId]);

  /**
   * Compute rank by likes among all pages
   */
  const rankMap = useMemo(() => {
    if (!allPagesData?.pages) return {};
    // Sort descending by totalLikes
    const sorted = [...allPagesData.pages].sort((a, b) => {
      const aLikes = safeNum(a.totalLikes);
      const bLikes = safeNum(b.totalLikes);
      return bLikes - aLikes; // desc
    });
    // Build a map: pageId => rank (1-based)
    const map: Record<string, number> = {};
    sorted.forEach((p, idx) => {
      map[p.pageId] = idx + 1;
    });
    return map;
  }, [allPagesData]);

  /**
   * For "Requests" => handle modal
   */
  const [showRequestModal, setShowRequestModal] = useState(false);

  // The data for the chosen request from chain
  const [requestData, setRequestData] = useState<{
    newName: string;
    newThumbnail: string;
    newHtml: string;
    executed: boolean;
    approvalCount: string;
  } | null>(null);

  /**
   * "Requests" => open modal & fetch chain data
   */
  const handleRequestClick = async (requestId: string) => {
    setShowRequestModal(true);
    if (!selectedPageId) return;
    const data = await fetchUpdateRequestFromContract(
      selectedPageId,
      requestId,
    );
    if (data) setRequestData(data);
  };

  const closeModal = () => {
    setShowRequestModal(false);
    setRequestData(null);
  };

  /**
   * isImmutableOrPerm
   */
  const isImmutableOrPerm = (() => {
    if (!selectedPage) return false;
    const ownerNum = selectedPage.ownershipType ?? -1;
    const isPerm = ownerNum === 2;
    const isImm = selectedPage.imt ?? false;
    return isPerm || isImm;
  })();

  // Loading states
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

  // Planet attributes
  const selectedFile = selectedPageId
    ? generatePlanetAttributes(selectedPageId)
    : null;

  // 주소 축약 함수
  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)} ... ${address.slice(-4)}`;
  };

  // 클립보드 복사 함수
  const copyToClipboard = (address: string, index: number) => {
    navigator.clipboard.writeText(address);
    setCopiedIndex(index); // 복사된 인덱스 저장
    toast.success('Address copied!'); // 사용자 피드백 (선택 사항)
    setTimeout(() => setCopiedIndex(null), 1500); // 1.5초 후 원래 상태로
  };

  // 클립보드 복사 함수
  const copyTxToClipboard = (tx: string) => {
    navigator.clipboard.writeText(tx);
    setCopiedTx(tx);
    toast.success('Transaction copied!'); // 사용자 피드백 (선택 사항)
    setTimeout(() => setCopiedTx(''), 1500); // 1.5초 후 원래 상태로
  };

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
                    geometries={5}
                    color={selectedFile.color}
                  />
                )}
              </Canvas>
            </div>

            {/* PageId (replacing #ID => #PageId) */}
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
                      {/* 주소 */}
                      <span className='cursor-pointer transition hover:text-blue-400'>
                        {shortenAddress(owner)}
                      </span>

                      {/* 복사 버튼 */}
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
                <div className='text-xs text-gray-300'>
                  No owners (maybe permissionless?)
                </div>
              )}
            </div>

            <div className='border-b border-pink-500 pb-3' />

            {/* Moved Update Fee here */}
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
                {ethers.formatEther(BigInt(safeNum(selectedPage?.balance))) ??
                  '0'}
              </span>
              <span className='pl-3 text-xs text-gray-400'>Eth</span>
            </div>
          </div>

          {/* Middle: iframe preview */}
          <div className='border-neon-pink mb-10 flex h-[600px] w-[600px] max-w-4xl items-center justify-center overflow-hidden border bg-white shadow-[0_0_15px_rgba(255,0,255,0.4)]'>
            {selectedHtml ? (
              <iframe className='h-full w-full' srcDoc={selectedHtml} />
            ) : (
              <span className='text-neon-pink'>Select a page to preview</span>
            )}
          </div>

          {/* Bottom: My Deployments + Requests */}
          <div className='mt-6 flex w-full max-w-6xl space-x-6'>
            {/* Left - My Deployments (with Rank column) */}
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
              {myDeploymentsData?.pages?.length === 0 && (
                <p className='text-sm text-gray-300'>
                  No pages found for your address.
                </p>
              )}

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
                  </tr>
                </thead>
                <tbody>
                  {myDeploymentsData?.pages?.map((page) => {
                    const ownershipStr = parseOwnershipType(page.ownershipType);
                    const isSelected = selectedPageId === page.pageId;
                    const rankVal = rankMap[page.pageId]
                      ? `#${rankMap[page.pageId]}`
                      : '--';

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
                        <td className='p-2'>{page.imt ? 'True' : 'False'}</td>
                        <td className='p-2 text-green-400'>
                          {safeNum(page.totalLikes)}
                        </td>
                        <td className='p-2 text-red-400'>
                          {safeNum(page.totalDislikes)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Right - Requests */}
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

              {!selectedPageId && (
                <div className='text-sm text-gray-300'>
                  Select a page to see requests
                </div>
              )}

              {!isImmutableOrPerm && selectedPageId && (
                <>
                  {requestsLoading && (
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

                  {requestsData?.pages && requestsData.pages.length > 0 ? (
                    <>
                      {requestsData.pages[0].updateRequests.length === 0 ? (
                        <p className='text-sm text-gray-400'>
                          No update requests found.
                        </p>
                      ) : (
                        <ul className='space-y-2'>
                          {requestsData.pages[0].updateRequests.map((req) => (
                            <li
                              key={req.requestId}
                              className='flex cursor-pointer flex-col border-b border-gray-300 py-1 text-cyan-300 hover:bg-gray-800'
                              onClick={() => handleRequestClick(req.requestId)}
                            >
                              <div>
                                <div className='pb-3 text-sm'>
                                  Name: {requestsData.pages[0].name || 'N/A'}
                                </div>
                              </div>
                              <div className='text-xs text-gray-300'>
                                <div>
                                  PageId: {requestsData.pages[0].pageId}
                                </div>
                                <div>ReqID: {req.requestId}</div>
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyTxToClipboard(req.requester);
                                  }}
                                  className='flex gap-2 pb-1'
                                >
                                  By: {shortenAddress(req.requester)}
                                  {copiedTx === req.requester ? (
                                    <Check
                                      size={16}
                                      className='text-green-400'
                                    />
                                  ) : (
                                    <Clipboard size={16} />
                                  )}
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <p className='text-sm text-gray-300'>
                      No requests to show.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal for a single request */}
      <AnimatePresence>
        {showRequestModal && selectedPageId && selectedPage && requestData && (
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

              <div className='grid grid-cols-2 gap-6'>
                {/* Left: existing data */}
                <div className='border-r border-gray-700 pr-4'>
                  <h3 className='text-neon-pink mb-2'>Current Page Info</h3>
                  <div className='space-y-1 text-sm'>
                    <div>Page Name: {selectedPage.name}</div>
                    <div>
                      Thumbnail: {selectedPage.thumbnail?.slice(0, 40) + '...'}
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
                  <button className='text-md ml-[370px] mt-4 h-[45px] w-[100px] rounded-md bg-gray-700 font-mono font-semibold text-gray-200 hover:bg-gray-600'>
                    Approve
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
