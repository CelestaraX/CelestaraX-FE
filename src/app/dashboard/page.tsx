'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { useAccount } from 'wagmi';
import { Canvas } from '@react-three/fiber';
import { Planet } from './_components/Planet'; // Adjust import path
import Header from '@/components/layout/Header'; // Adjust import path

import { GET_PAGES_BY_OWNER, GET_PAGE_UPDATES } from '@/lib/graphql/queries'; // Adjust path
import {
  fetchPageDataFromContract,
  fetchUpdateRequestFromContract,
} from '@/lib/blockchain'; // The code from blockchain.ts
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PageCreated } from '@/types';

/**
 * Example type for updateRequests
 */
interface UpdateRequestSubgraph {
  requestId: string;
  requester: string;
}

/**
 * Helper function to parse ownershipType => "Single", "MultiSig", "Permissionless".
 * If subgraph returns numeric values 0,1,2, we convert accordingly.
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
 * Safe parse string to number
 */
function safeNum(val?: string | null) {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isNaN(n) ? 0 : n;
}

/**
 * StatBar component
 */
export function StatBar({
  label,
  color,
  value,
  max,
}: {
  label: string;
  color: string;
  value: number;
  max: number;
}) {
  return (
    <div className='mb-2'>
      <div className='mb-1 text-xs font-bold text-white'>{label}:</div>
      <div className='relative h-4 w-40 overflow-hidden rounded border border-pink-500'>
        <div
          className={`${color} h-full transition-all duration-300`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
      <div className='text-xs text-gray-400'>
        {value} / {max}
      </div>
    </div>
  );
}

export default function Mypage() {
  const { address } = useAccount();

  // 1) Query to fetch "My Deployments" => GET_PAGES_BY_OWNER
  const {
    data: myDeploymentsData,
    loading: myDeploymentsLoading,
    error: myDeploymentsError,
  } = useQuery<{ pages: PageCreated[] }>(GET_PAGES_BY_OWNER, {
    variables: { ownerAddress: address?.toLowerCase() || '' },
    skip: !address, // skip if not connected
  });

  // Local states
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedHtml, setSelectedHtml] = useState<string | null>(null);

  // 2) Query to fetch "Requests" => GET_PAGE_UPDATES
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
   * When user clicks a row in "My Deployments," fetch HTML from contract
   * and store it in selectedHtml.
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
   * Generate planet attributes based on pageId (sample logic)
   */
  function generatePlanetAttributes(id: string) {
    const hashCode = (str: string) => {
      return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    };
    const numericId = hashCode(id);
    return {
      color: `#${((numericId * 9973) % 0xffffff).toString(16).padStart(6, '0')}`,
      planetSize: (numericId % 6) + 2,
      rotationSpeed: (numericId % 5) * 0.3 + 0.5,
    };
  }
  const selectedFile = selectedPageId
    ? generatePlanetAttributes(selectedPageId)
    : null;

  // For "Requests" => handle modal
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
   * "Requests" column => user clicks => open modal
   * We'll fetch the new data from chain by (pageId, requestId)
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

  /**
   * close modal
   */
  const closeModal = () => {
    setShowRequestModal(false);
    setRequestData(null);
  };

  // ----------------------------------------------------------------
  // [FIX] We define isImmutableOrPerm as a normal variable instead of using a Hook,
  // to avoid "React Hook is called conditionally" error.
  // ----------------------------------------------------------------
  const isImmutableOrPerm = (() => {
    if (!selectedPage) return false;
    // ownershipType is number => 2 means Permissionless
    const ownerNum = selectedPage.ownershipType ?? -1;
    const isPerm = ownerNum === 2;
    // immutable flag
    const isImm = selectedPage.imt ?? false;
    return isPerm || isImm;
  })();

  // Loading / error states. We put them AFTER all Hook definitions to avoid early returns
  if (myDeploymentsLoading) {
    return (
      <div>
        <Header />
        <main className='flex h-screen items-center justify-center text-white'>
          Loading your deployments...
        </main>
      </div>
    );
  }
  if (myDeploymentsError) {
    return (
      <div>
        <Header />
        <main className='flex h-screen items-center justify-center text-red-500'>
          Error: {myDeploymentsError.message}
        </main>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <main className='flex h-[calc(100vh-100px)] flex-col items-center justify-center bg-black'>
        <div className='relative flex h-[1000px] w-[1200px] flex-col items-center justify-center border-2 border-pink-500 p-4 text-pink-500'>
          {/* Left stats + planet */}
          <div className='absolute left-4 top-16 w-[150px] space-y-4'>
            {/* Example: Show totalLikes, totalDislikes, etc. from selected page */}
            <StatBar
              label='Likes'
              color='bg-pink-500'
              value={selectedPage ? safeNum(selectedPage.totalLikes) : 0}
              max={100} // arbitrary
            />
            <StatBar
              label='Dislikes'
              color='bg-blue-400'
              value={selectedPage ? safeNum(selectedPage.totalDislikes) : 0}
              max={100}
            />
            <StatBar
              label='Update Fee'
              color='bg-green-600'
              value={selectedPage ? safeNum(selectedPage.updateFee) : 0}
              max={10000} // arbitrary
            />

            {/* 3D Planet */}
            <div className='mt-6 h-48 w-full'>
              <Canvas>
                <ambientLight intensity={0.8} />
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

            {/* ID or something */}
            <div className='mt-2 text-xs text-white'>
              {selectedPageId ? `#ID: ${selectedPageId}` : '#ID: N/A'}
            </div>
          </div>

          {/* Right info panel - for example, ownershipType, balance, owners, etc. */}
          <div className='absolute right-4 top-16 flex w-[200px] flex-col gap-2 text-sm text-white'>
            <div className='font-bold text-pink-300'>Ownership</div>
            <div>
              Type:&nbsp;
              {selectedPage
                ? parseOwnershipType(selectedPage.ownershipType)
                : '--'}
            </div>
            <div>Threshold: {selectedPage?.multiSigThreshold ?? '--'}</div>
            <div className='border-b border-pink-500 pb-2' />

            <div className='font-bold text-pink-300'>Balance</div>
            <div className='mb-2'>
              BALANCE REMAINING:{' '}
              <span className='text-green-400'>
                {selectedPage?.balance ?? '0'} wei
              </span>
            </div>

            <div className='font-bold text-pink-300'>Owners</div>
            {selectedPage?.multiSigOwners &&
            selectedPage.multiSigOwners.length > 0 ? (
              <ul className='ml-4 list-disc text-xs'>
                {selectedPage.multiSigOwners.map((owner, idx) => (
                  <li key={idx}>{owner}</li>
                ))}
              </ul>
            ) : (
              <div className='text-xs'>No owners (maybe permissionless?)</div>
            )}
          </div>

          {/* Middle: iframe preview */}
          <div className='mb-10 flex h-[600px] w-[600px] max-w-4xl items-center justify-center overflow-hidden border border-pink-500 bg-white'>
            {selectedHtml ? (
              <iframe className='h-full w-full' srcDoc={selectedHtml} />
            ) : (
              <span className='text-pink-500'>Select a page to preview</span>
            )}
          </div>

          {/* Bottom: My Deployments + Requests */}
          <div className='mt-6 flex w-full max-w-6xl space-x-6'>
            {/* Left - My Deployments with new columns */}
            <div className='flex-1 border border-pink-500 p-4'>
              <h2 className='mb-3 text-lg font-bold text-pink-500'>
                My Deployments
              </h2>
              {myDeploymentsData?.pages?.length === 0 && (
                <p className='text-sm text-gray-300'>
                  No pages found for your address.
                </p>
              )}
              <table className='w-full border-collapse'>
                <thead>
                  <tr className='border-b border-pink-500 text-pink-300'>
                    <th className='p-2 text-left'>Name</th>
                    <th className='p-2 text-left'>PageId</th>
                    {/* Ownership + Immutable */}
                    <th className='p-2 text-left'>Ownership</th>
                    <th className='p-2 text-left'>Immutable</th>
                    {/* Likes, Dislikes */}
                    <th className='p-2 text-left'>Likes</th>
                    <th className='p-2 text-left'>Dislikes</th>
                  </tr>
                </thead>
                <tbody>
                  {myDeploymentsData?.pages?.map((page) => {
                    const ownershipStr = parseOwnershipType(page.ownershipType);
                    return (
                      <tr
                        key={page.id}
                        className='cursor-pointer border-b border-gray-700 hover:bg-gray-800'
                        onClick={() => {
                          setSelectedPageId(page.pageId);
                        }}
                      >
                        <td className='p-2 text-cyan-300'>{page.name}</td>
                        <td className='p-2'>{page.pageId}</td>
                        <td className='p-2'>{ownershipStr}</td>
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
            <div className='w-[300px] border border-pink-500 p-4'>
              <h2 className='mb-3 text-lg font-bold text-pink-500'>Requests</h2>

              {/* If selected page is immutable or permissionless => show special message */}
              {selectedPage && isImmutableOrPerm && (
                <div className='text-sm text-gray-300'>
                  {parseOwnershipType(selectedPage.ownershipType) ===
                  'Permissionless'
                    ? 'This page is Permissionless. Updates do not require requests, or it cannot be updated in a controlled manner.'
                    : 'This page is Immutable. No modification allowed.'}
                </div>
              )}

              {/* If user hasn't chosen a page yet */}
              {!selectedPageId && (
                <div className='text-sm text-gray-300'>
                  Select a page to see requests
                </div>
              )}

              {/* If the page is updatable, show requests data */}
              {!isImmutableOrPerm && selectedPageId && (
                <>
                  {requestsLoading && (
                    <div className='text-sm text-gray-300'>
                      Loading requests...
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
                              className='flex cursor-pointer justify-between border-b border-gray-700 py-1 text-cyan-300 hover:bg-gray-800'
                              onClick={() => handleRequestClick(req.requestId)}
                            >
                              {/* columns: name, id, requestId, requester */}
                              <div>
                                <div className='text-sm'>
                                  Name: {requestsData.pages[0].name || 'N/A'}
                                </div>
                                <div className='text-xs text-gray-400'>
                                  PageId: {requestsData.pages[0].pageId}
                                </div>
                              </div>
                              <div className='text-right text-xs text-gray-300'>
                                <div>ReqID: {req.requestId}</div>
                                <div>By: {req.requester}</div>
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

      {/* Modal for a single request: left=old data, right=new data */}
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
              className='relative w-full max-w-4xl rounded bg-gray-900 p-6 text-white shadow-2xl'
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()} // prevent closing
            >
              <button
                onClick={closeModal}
                className='absolute right-8 top-8 rounded bg-gray-700 p-1 text-gray-200 hover:bg-gray-600'
              >
                <X size={18} />
              </button>
              <h2 className='mb-4 text-2xl font-bold text-pink-300'>
                Update Request
              </h2>

              <div className='grid grid-cols-2 gap-6'>
                {/* Left: existing data */}
                <div className='border-r border-gray-700 pr-4'>
                  <h3 className='mb-2 text-pink-400'>Current Page Info</h3>
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
                  <div className='mt-2 h-32 overflow-auto rounded bg-gray-800 p-2 text-xs'>
                    {selectedHtml
                      ? selectedHtml.substring(0, 300) +
                        (selectedHtml.length > 300 ? '...' : '')
                      : 'N/A'}
                  </div>
                </div>

                {/* Right: new update data */}
                <div>
                  <h3 className='mb-2 text-pink-400'>Proposed Changes</h3>
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
                  <div className='mt-2 h-32 overflow-auto rounded bg-gray-800 p-2 text-xs'>
                    {requestData.newHtml
                      ? requestData.newHtml.substring(0, 300) +
                        (requestData.newHtml.length > 300 ? '...' : '')
                      : 'N/A'}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
