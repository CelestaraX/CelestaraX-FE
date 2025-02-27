import { JsonRpcProvider, Contract, ethers } from 'ethers';

// Check environment variables
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
 * Contract ABI including createPage and getCurrentHtml.
 * You can add more functions if needed (vote, requestUpdate, etc.)
 */
const CONTRACT_ABI = [
  {
    // createPage function
    inputs: [
      { internalType: 'string', name: '_name', type: 'string' },
      { internalType: 'string', name: '_thumbnail', type: 'string' },
      { internalType: 'string', name: '_initialHtml', type: 'string' },
      {
        components: [
          {
            internalType: 'enum IWeb3ite.OwnershipType',
            name: 'ownershipType',
            type: 'uint8',
          },
          {
            internalType: 'address[]',
            name: 'multiSigOwners',
            type: 'address[]',
          },
          {
            internalType: 'uint256',
            name: 'multiSigThreshold',
            type: 'uint256',
          },
        ],
        internalType: 'struct IWeb3ite.OwnershipConfig',
        name: '_ownerConfig',
        type: 'tuple',
      },
      { internalType: 'uint256', name: '_updateFee', type: 'uint256' },
      { internalType: 'bool', name: '_imt', type: 'bool' },
    ],
    name: 'createPage',
    outputs: [{ internalType: 'uint256', name: 'pageId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    // getCurrentHtml function
    constant: true,
    inputs: [{ name: 'pageId', type: 'uint256' }],
    name: 'getCurrentHtml',
    outputs: [{ name: 'htmlContent', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

/**
 * createPageOnContract
 * Sends a transaction to create a new page.
 *
 * @param name string page name
 * @param thumbnail string base64 encoded thumbnail
 * @param initialHtml string HTML content (must start with <!DOCTYPE html> and end with </html>)
 * @param ownerConfig { ownershipType, multiSigOwners, multiSigThreshold }
 * @param updateFee number update fee
 * @param imt boolean immutability
 * @param signerOrProvider ethers.Signer or Provider (Signer required for TX)
 * @returns Transaction receipt
 */
export async function createPageOnContract(
  name: string,
  thumbnail: string,
  initialHtml: string,
  ownerConfig: {
    ownershipType: number; // 0=Single,1=MultiSig,2=Permissionless
    multiSigOwners: string[];
    multiSigThreshold: number;
  },
  updateFee: number,
  imt: boolean,
  signerOrProvider: ethers.Signer | ethers.Provider,
) {
  // Initialize contract with signer (for write operations)
  const contract = new Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signerOrProvider,
  );

  // Call createPage
  const tx = await contract.createPage(
    name,
    thumbnail,
    initialHtml,
    {
      ownershipType: ownerConfig.ownershipType,
      multiSigOwners: ownerConfig.multiSigOwners,
      multiSigThreshold: ownerConfig.multiSigThreshold,
    },
    updateFee,
    imt,
  );

  // Wait for the transaction to confirm
  const receipt = await tx.wait();
  return receipt;
}

/**
 * fetchPageDataFromContract
 * Reads HTML content from the chain by pageId.
 *
 * @param pageId string
 * @returns HTML string if found
 */
export async function fetchPageDataFromContract(pageId: string) {
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    console.log(`🔍 Fetching HTML for pageId: ${pageId}`);
    const htmlContent = await contract.getCurrentHtml(pageId);
    console.log(`✅ HTML fetched for pageId ${pageId}:`, htmlContent);

    return htmlContent;
  } catch (err) {
    console.error(`Error fetching page data for pageId ${pageId}:`, err);
    return '<p>Error loading content from blockchain</p>';
  }
}
