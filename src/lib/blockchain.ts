import { JsonRpcProvider, Contract } from 'ethers';

// 📌 환경 변수 확인
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

// ✅ 환경 변수 체크 (값이 없으면 에러 발생)
if (!RPC_URL)
  throw new Error('Missing NEXT_PUBLIC_RPC_URL in environment variables');
if (!CONTRACT_ADDRESS)
  throw new Error(
    'Missing NEXT_PUBLIC_CONTRACT_ADDRESS in environment variables',
  );

// 📌 컨트랙트 ABI (필요한 함수만 추가)
const CONTRACT_ABI = [
  {
    constant: true,
    inputs: [{ name: 'pageId', type: 'uint256' }],
    name: 'getCurrentHtml',
    outputs: [{ name: 'htmlContent', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
];

// 📌 `pageId`로 블록체인에서 HTML 데이터 조회
export const fetchPageDataFromContract = async (pageId: string) => {
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
};
