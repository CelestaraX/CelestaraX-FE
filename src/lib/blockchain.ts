// lib/blockchain.ts
import { ethers } from 'ethers';

/**
 * Check environment variables
 */
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL as string;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as string;

if (!RPC_URL) {
  throw new Error('Missing NEXT_PUBLIC_RPC_URL in environment variables');
}
if (!CONTRACT_ADDRESS) {
  throw new Error(
    'Missing NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables',
  );
}

/**
 * Contract ABI for reading HTML and update requests
 * You can add more if needed (vote, requestUpdate, etc.)
 */
const CONTRACT_ABI = [
  {
    constant: true,
    inputs: [{ name: 'pageId', type: 'uint256' }],
    name: 'getCurrentHtml',
    outputs: [{ name: 'htmlContent', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      { name: 'pageId', type: 'uint256' },
      { name: 'requestId', type: 'uint256' },
    ],
    name: 'getUpdateRequest',
    outputs: [
      { name: 'newName', type: 'string' },
      { name: 'newThumbnail', type: 'string' },
      { name: 'newHtml', type: 'string' },
      { name: 'executed', type: 'bool' },
      { name: 'approvalCount', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * Fetch the current HTML from on-chain data
 * @param pageId string
 * @returns string of HTML or error message
 */
export async function fetchPageDataFromContract(
  pageId: string,
): Promise<string> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider,
    );

    console.log(`Fetching HTML for pageId=${pageId}...`);
    const htmlContent = await contract.getCurrentHtml(pageId);
    console.log(`Success: HTML fetched for pageId=${pageId}`);
    return htmlContent;
  } catch (err) {
    console.error(`Error fetching HTML for pageId=${pageId}:`, err);
    return '<p>Error loading content from blockchain</p>';
  }
}

/**
 * Fetch an update request data by pageId and requestId
 * @param pageId string
 * @param requestId string
 * @returns { newName, newThumbnail, newHtml, executed, approvalCount } or null on error
 */
export async function fetchUpdateRequestFromContract(
  pageId: string,
  requestId: string,
): Promise<{
  newName: string;
  newThumbnail: string;
  newHtml: string;
  executed: boolean;
  approvalCount: string;
} | null> {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      provider,
    );

    console.log(
      `Fetching update request #${requestId} for pageId=${pageId}...`,
    );
    const [newName, newThumbnail, newHtml, executed, approvalCount] =
      await contract.getUpdateRequest(pageId, requestId);
    console.log(
      `Success: Update request #${requestId} for pageId=${pageId} fetched.`,
    );

    return {
      newName,
      newThumbnail,
      newHtml,
      executed,
      approvalCount: approvalCount.toString(),
    };
  } catch (err) {
    console.error(
      `Error fetching update request for pageId=${pageId}, requestId=${requestId}:`,
      err,
    );
    return null;
  }
}
