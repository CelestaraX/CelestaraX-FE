'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Header from '@/components/layout/Header';
import { X, Upload, HelpCircle } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import CustomStarsPlanet from '@/components/CustomStarsPlanet';

import { simulateContract, waitForTransactionReceipt } from 'wagmi/actions';
import { config, mammothon } from '@/wagmi'; // your global wagmi config
import { defaultThumbnailBase64 } from '@/const'; // your default thumbnail in base64

/**
 * CircularProgress - ring around the planet to show progress
 */
const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 90;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const strokeColor = progress === 100 ? 'limegreen' : 'orange';

  return (
    <svg className='absolute left-0 top-0 h-full w-full' viewBox='0 0 200 200'>
      <defs>
        <filter id='glow'>
          <feGaussianBlur stdDeviation='4.5' result='coloredBlur' />
          <feMerge>
            <feMergeNode in='coloredBlur' />
            <feMergeNode in='SourceGraphic' />
          </feMerge>
        </filter>
      </defs>

      <circle
        cx='100'
        cy='100'
        r={radius}
        stroke='#222'
        strokeWidth={strokeWidth}
        fill='none'
      />
      <circle
        cx='100'
        cy='100'
        r={radius}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill='none'
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap='round'
        className='transition-all duration-500'
        filter={progress === 100 ? 'url(#glow)' : 'none'}
      />
    </svg>
  );
};

/**
 * Spinner component for indicating TX in progress
 */
function Spinner() {
  return (
    <svg
      className='h-5 w-5 animate-spin text-white'
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
 * FormData interface for planet creation
 */
interface FormData {
  name: string;
  immutable: string; // "True" | "False"
  ownership: string; // "Single" | "MultiSig" | "Permissionless"
  fee: string;
  thumbnail: string; // base64
  htmlFile: string; // must have <!DOCTYPE html> ... </html>
  singleAddress: string;
  multiAddresses: string[];
  multiThreshold: string;
}

/**
 * Calculate total steps for progress
 */
function getTotalSteps(form: FormData) {
  let steps = 0;
  // 1) Name
  steps++;
  // 2) Immutable
  steps++;
  // 3) Ownership
  steps++;

  // 4) Fee if not disabled
  const feeDisabled =
    form.immutable !== 'False' || form.ownership === 'Permissionless';
  if (!feeDisabled) steps++;

  // 5) Thumbnail
  steps++;
  // 6) HTML file
  steps++;

  // If Single or Permissionless => singleAddress
  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    steps++;
  }
  // If MultiSig => threshold + each address
  if (form.ownership === 'MultiSig') {
    steps++; // threshold
    steps += form.multiAddresses.length; // each address
  }

  return steps;
}

/**
 * Calculate completed steps
 */
function getCompletedSteps(form: FormData) {
  let completed = 0;
  if (form.name.trim() !== '') completed++;
  if (form.immutable !== '') completed++;
  if (form.ownership !== '') completed++;

  // fee check if not disabled
  const feeDisabled =
    form.immutable !== 'False' || form.ownership === 'Permissionless';
  if (!feeDisabled) {
    if (form.fee.trim() !== '') completed++;
  }

  if (form.thumbnail.trim() !== '') completed++;
  if (form.htmlFile.trim() !== '') completed++;

  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    if (form.singleAddress.trim() !== '') completed++;
  }
  if (form.ownership === 'MultiSig') {
    const threshNum = parseInt(form.multiThreshold, 10);
    if (
      !isNaN(threshNum) &&
      threshNum > 0 &&
      threshNum <= form.multiAddresses.length
    ) {
      completed++;
    }
    form.multiAddresses.forEach((addr) => {
      if (addr.trim() !== '') completed++;
    });
  }

  return completed;
}

/**
 * Validate fields
 */
function getErrors(form: FormData) {
  const errors: {
    name?: string;
    immutable?: string;
    ownership?: string;
    fee?: string;
    thumbnail?: string;
    htmlFile?: string;
    singleAddress?: string;
    multiAddresses?: string[];
    multiThreshold?: string;
  } = {};

  if (!form.name.trim()) errors.name = 'Name is required.';
  if (!form.immutable) errors.immutable = 'You must choose True or False.';
  if (!form.ownership) errors.ownership = 'You must select ownership.';

  if (form.immutable === 'False' && form.ownership !== 'Permissionless') {
    if (!form.fee.trim()) {
      errors.fee = 'Fee is required (immutable = False).';
    }
  }

  if (!form.thumbnail.trim()) errors.thumbnail = 'Thumbnail is required.';
  if (!form.htmlFile.trim()) errors.htmlFile = 'HTML file is required.';

  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    if (!form.singleAddress.trim()) {
      errors.singleAddress = 'Owner address is required.';
    }
  }

  if (form.ownership === 'MultiSig') {
    // addresses
    const multiErr: string[] = [];
    form.multiAddresses.forEach((addr, idx) => {
      if (!addr.trim()) {
        multiErr[idx] = `Address #${idx + 1} is required.`;
      }
    });
    if (multiErr.filter(Boolean).length > 0) {
      errors.multiAddresses = multiErr;
    }
    // threshold
    if (!form.multiThreshold.trim()) {
      errors.multiThreshold = 'Threshold is required.';
    } else {
      const n = parseInt(form.multiThreshold, 10);
      if (isNaN(n) || n <= 0) {
        errors.multiThreshold = 'Threshold must be positive number.';
      } else if (n > form.multiAddresses.length) {
        errors.multiThreshold = 'Threshold cannot exceed addresses count.';
      }
    }
  }

  return errors;
}

/**
 * Convert "Single|MultiSig|Permissionless" => 0|1|2
 */
function getOwnershipTypeIndex(val: string) {
  if (val === 'Single') return 0;
  if (val === 'MultiSig') return 1;
  return 2;
}

/** If "True" => boolean true */
function parseImmutable(val: string): boolean {
  return val === 'True';
}

/** Use default thumbnail base64 from a const file */
const DEFAULT_THUMBNAIL_URL = defaultThumbnailBase64;

/** The contract ABI for createPage */
const CREATE_PAGE_ABI = [
  {
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
];

const CREATE_PAGE_CONTRACT_ADDRESS = process.env
  .NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export default function DeployPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // from useWriteContract (like Explorer)
  const {
    data: txHash,
    isPending,
    writeContract,
  } = useWriteContract({ config });

  // Form data
  const [formData, setFormData] = useState<FormData>({
    name: '',
    immutable: '',
    ownership: '',
    fee: '',
    thumbnail: '',
    htmlFile: '',
    singleAddress: '',
    multiAddresses: [],
    multiThreshold: '',
  });

  // Use default thumbnail
  const [useDefaultThumbnail, setUseDefaultThumbnail] = useState(false);

  // progress & errors
  const [progress, setProgress] = useState(0);
  const [errors, setErrors] = useState<{ [key: string]: string | string[] }>(
    {},
  );

  // touched
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [touchedMultiAddresses, setTouchedMultiAddresses] = useState<boolean[]>(
    [],
  );

  const [hasSubmitted, setHasSubmitted] = useState(false);

  // dropdown states
  const [isOpen, setIsOpen] = useState<{ [key in keyof FormData]?: boolean }>(
    {},
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // deploying spinner
  const [isDeploying, setIsDeploying] = useState(false);

  /**
   * Close dropdown if user clicks outside (DOM event)
   */
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen({});
      }
    }
    document.addEventListener('mousedown', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside as EventListener,
      );
    };
  }, []);

  /**
   * Toggle dropdown
   */
  const handleDropdownToggle = (field: keyof FormData) => {
    setIsOpen((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /**
   * updateForm => recalc progress & errors
   */
  const updateForm = (updatedForm: FormData) => {
    setFormData(updatedForm);

    const totalSteps = getTotalSteps(updatedForm);
    const done = getCompletedSteps(updatedForm);
    setProgress(Math.round((done / totalSteps) * 100));

    const newErr = getErrors(updatedForm);
    setErrors(newErr);
  };

  const shouldShowError = (field: keyof FormData) => {
    return touched[field] || hasSubmitted;
  };
  const shouldShowMultiAddressError = (index: number) => {
    return touchedMultiAddresses[index] || hasSubmitted;
  };

  /**
   * Handle input changes
   */
  const handleInputChange = async (
    field: keyof FormData,
    value: string | File | null,
  ) => {
    // If user chooses default thumbnail, we now override formData.thumbnail
    // with default base64 so the step is considered complete.
    if (field === 'thumbnail' && useDefaultThumbnail) {
      // If user tries to upload a file while default is checked, we can ignore or override.
      // Here let's just ignore the file. But we keep the default base64 in the form data
      return;
    }

    // If it's a file for thumbnail
    if (field === 'thumbnail' && value instanceof File) {
      const file = value;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        updateForm({ ...formData, [field]: base64 });
      };
      reader.readAsDataURL(file);
      return;
    }

    // A helper to ensure `</html>` is present
    const ensureHtmlClosingTag = (html: string): string => {
      const trimmed = html.trim();
      return trimmed.endsWith('</html>') ? trimmed : `${trimmed}</html>`;
    };

    // If it's a file for HTML
    if (field === 'htmlFile' && value instanceof File) {
      const file = value;
      const reader = new FileReader();

      reader.onload = () => {
        let content = reader.result as string;

        // Remove trailing spaces
        content = content.replace(/\s+$/g, '');
        // Convert Windows line-endings to Unix
        content = content.replace(/\r\n/g, '\n');
        // Collapse multiple blank lines
        content = content.replace(/\n{2,}/g, '\n');

        // Ensure closing </html>
        content = ensureHtmlClosingTag(content);

        updateForm({ ...formData, htmlFile: content });
      };

      reader.readAsText(file);
      return;
    }

    // Otherwise it's normal text
    updateForm({ ...formData, [field]: value || '' });
  };

  // blur
  const handleFieldBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  // multi-sig address
  const addMultiAddress = () => {
    const updated = {
      ...formData,
      multiAddresses: [...formData.multiAddresses, ''],
    };
    updateForm(updated);
    setTouchedMultiAddresses((prev) => [...prev, false]);
  };
  const removeMultiAddress = (index: number) => {
    const newArr = formData.multiAddresses.filter((_, i) => i !== index);
    updateForm({ ...formData, multiAddresses: newArr });
    setTouchedMultiAddresses((prev) => prev.filter((_, i) => i !== index));
  };
  const handleMultiAddressChange = (index: number, val: string) => {
    const newArr = [...formData.multiAddresses];
    newArr[index] = val;
    updateForm({ ...formData, multiAddresses: newArr });
  };
  const handleMultiAddressBlur = (index: number) => {
    setTouchedMultiAddresses((prev) => {
      const newT = [...prev];
      newT[index] = true;
      return newT;
    });
  };

  // isFeeDisabled
  const isFeeDisabled =
    formData.immutable !== 'False' || formData.ownership === 'Permissionless';
  // progress
  const validProgress = isNaN(progress) ? 0 : progress;

  /**
   * Deploy logic => simulate => writeContract => wait for txHash => wait for receipt
   */
  const handleDeploy = useCallback(async () => {
    setHasSubmitted(true);

    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert('Cannot open wallet modal.');
      }
      return;
    }

    if (validProgress < 100 || Object.keys(errors).length > 0) {
      alert('Please fix errors and complete all fields before deploying.');
      return;
    }

    try {
      setIsDeploying(true);

      // If "Use default thumbnail" is checked, we force the formData.thumbnail to default
      let finalThumbnail = formData.thumbnail;
      if (useDefaultThumbnail) {
        finalThumbnail = DEFAULT_THUMBNAIL_URL;
      }

      // ownership index
      const ownershipIndex = getOwnershipTypeIndex(formData.ownership);
      // parse immutable
      const imt = parseImmutable(formData.immutable);

      // multi-sig
      let multiSigOwners: string[] = [];
      let multiSigThreshold = 0;
      if (ownershipIndex === 0) {
        // Single
        multiSigOwners = [formData.singleAddress];
        multiSigThreshold = 1;
      } else if (ownershipIndex === 1) {
        // MultiSig
        multiSigOwners = formData.multiAddresses;
        multiSigThreshold = parseInt(formData.multiThreshold, 10) || 1;
      }
      // If ownershipIndex=2 => permissionless => no owners/threshold needed

      // fee
      let updateFee = 0;
      if (!isFeeDisabled) {
        updateFee = parseInt(formData.fee, 10) || 0;
      }

      // simulate
      const simResult = await simulateContract(config, {
        chainId: mammothon.id,
        address: CREATE_PAGE_CONTRACT_ADDRESS,
        abi: CREATE_PAGE_ABI,
        functionName: 'createPage',
        args: [
          formData.name,
          finalThumbnail,
          formData.htmlFile,
          {
            ownershipType: ownershipIndex,
            multiSigOwners,
            multiSigThreshold,
          },
          updateFee,
          imt,
        ],
      });

      // broadcast
      writeContract(
        {
          ...simResult.request,
        },
        {
          onError: (err) => {
            console.error('CreatePage TX Error:', err);
            setIsDeploying(false);
          },
          onSuccess: () => {
            console.log('CreatePage TX broadcast success');
            // Optionally reset the form
            setFormData({
              name: '',
              immutable: '',
              ownership: '',
              fee: '',
              thumbnail: '',
              htmlFile: '',
              singleAddress: '',
              multiAddresses: [],
              multiThreshold: '',
            });
            setUseDefaultThumbnail(false);
            // wait for txHash in useEffect
          },
        },
      );
    } catch (err) {
      console.error('Deployment error:', err);
      alert('Deployment failed. Check console for details.');
      setIsDeploying(false);
    }
  }, [
    isConnected,
    openConnectModal,
    validProgress,
    errors,
    formData,
    useDefaultThumbnail,
    isFeeDisabled,
    writeContract,
  ]);

  /**
   * Wait for txHash => waitForTransactionReceipt => done
   */
  useEffect(() => {
    if (!txHash) return;
    let canceled = false;

    async function waitReceipt() {
      try {
        await waitForTransactionReceipt(config, {
          hash: txHash as `0x${string}`,
          chainId: mammothon.id,
          confirmations: 1,
        });
        if (!canceled) {
          setIsDeploying(false);
          alert(`Deployment successful! Tx Hash: ${txHash}`);
        }
      } catch (err) {
        console.error('Error waiting for receipt:', err);
        if (!canceled) {
          setIsDeploying(false);
        }
      }
    }
    waitReceipt();

    return () => {
      canceled = true;
    };
  }, [txHash]);

  /**
   * Close dropdown if user clicks outside
   */
  const handleClickOutside = (event: Event) => {
    if (
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setIsOpen({});
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside as EventListener);
    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside as EventListener,
      );
    };
  }, []);

  return (
    <div>
      <Header />
      <main className='flex h-[calc(100vh-100px)] items-center justify-center'>
        {/* Left: Form Section */}
        <div className='flex w-full flex-col gap-10 space-y-6 pl-[100px] md:w-1/2'>
          <div className='flex flex-col gap-5 font-mono'>
            <h1 className='text-3xl font-bold text-white'>
              Deploy Your Own Planet
            </h1>
            <div>Deploy your own page to Celestia.</div>
          </div>

          <div className='flex flex-col gap-7' ref={dropdownRef}>
            {/* 1) Name */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Name</label>
              <input
                type='text'
                placeholder='Enter name'
                className='w-full rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 text-gray-300 outline-none focus:ring-2 focus:ring-gray-600'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
              />
              {shouldShowError('name') && errors.name && (
                <p className='text-sm text-red-500'>{errors.name as string}</p>
              )}
            </div>

            {/* 2) Immutable */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Immutable</label>
              <div className='relative'>
                <div
                  className='cursor-pointer rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 pr-10 text-gray-300'
                  onClick={() => handleDropdownToggle('immutable')}
                  onBlur={() => handleFieldBlur('immutable')}
                  tabIndex={0}
                >
                  {formData.immutable || 'Select immutable option'}
                </div>
                <div
                  className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                    isOpen.immutable ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 text-gray-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                {isOpen.immutable && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-gray-700 bg-[#1c1c1e] shadow-lg'>
                    {['True', 'False'].map((opt) => (
                      <div
                        key={opt}
                        className='cursor-pointer px-4 py-2 text-gray-300 hover:bg-gray-700'
                        onClick={() => {
                          handleInputChange('immutable', opt);
                          setTimeout(
                            () => handleDropdownToggle('immutable'),
                            100,
                          );
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {shouldShowError('immutable') && errors.immutable && (
                <p className='text-sm text-red-500'>
                  {errors.immutable as string}
                </p>
              )}
            </div>

            {/* 3) Ownership */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Ownership</label>
              <div className='relative'>
                <div
                  className='cursor-pointer rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 pr-10 text-gray-300'
                  onClick={() => handleDropdownToggle('ownership')}
                  onBlur={() => handleFieldBlur('ownership')}
                  tabIndex={0}
                >
                  {formData.ownership || 'Select ownership'}
                </div>
                <div
                  className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                    isOpen.ownership ? 'rotate-180' : ''
                  }`}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className='h-4 w-4 text-gray-400'
                    viewBox='0 0 20 20'
                    fill='currentColor'
                  >
                    <path
                      fillRule='evenodd'
                      d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                      clipRule='evenodd'
                    />
                  </svg>
                </div>
                {isOpen.ownership && (
                  <div className='absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-gray-700 bg-[#1c1c1e] shadow-lg'>
                    {['Single', 'MultiSig', 'Permissionless'].map((opt) => (
                      <div
                        key={opt}
                        className='cursor-pointer px-4 py-2 text-gray-300 hover:bg-gray-700'
                        onClick={() => {
                          handleInputChange('ownership', opt);
                          setTimeout(
                            () => handleDropdownToggle('ownership'),
                            100,
                          );
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {shouldShowError('ownership') && errors.ownership && (
                <p className='text-sm text-red-500'>
                  {errors.ownership as string}
                </p>
              )}
            </div>

            {/* If Single/Permissionless => singleAddress */}
            {(formData.ownership === 'Single' ||
              formData.ownership === 'Permissionless') && (
              <div className='relative flex flex-col gap-2'>
                <label className='text-sm text-cyan-300'>Owner Address</label>
                <input
                  type='text'
                  placeholder='Enter owner address'
                  className='w-full rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 text-gray-300 outline-none focus:ring-2 focus:ring-gray-600'
                  value={formData.singleAddress}
                  onChange={(e) =>
                    handleInputChange('singleAddress', e.target.value)
                  }
                  onBlur={() => handleFieldBlur('singleAddress')}
                />
                {shouldShowError('singleAddress') && errors.singleAddress && (
                  <p className='text-sm text-red-500'>
                    {errors.singleAddress as string}
                  </p>
                )}
              </div>
            )}

            {/* If MultiSig => addresses + threshold */}
            {formData.ownership === 'MultiSig' && (
              <>
                <div className='relative flex flex-col gap-2'>
                  <label className='text-sm text-cyan-300'>
                    Multi-Sig Addresses
                  </label>
                  {formData.multiAddresses.map((addr, idx) => (
                    <div key={idx} className='mb-2 flex items-center space-x-2'>
                      <input
                        type='text'
                        placeholder={`Address #${idx + 1}`}
                        className={`w-full rounded-xl border border-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-gray-600 ${
                          formData.ownership !== 'MultiSig'
                            ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                            : 'bg-[#1c1c1e] text-gray-300'
                        }`}
                        value={addr}
                        onChange={(e) =>
                          handleMultiAddressChange(idx, e.target.value)
                        }
                        onBlur={() => handleMultiAddressBlur(idx)}
                        disabled={formData.ownership !== 'MultiSig'}
                      />
                      <X
                        className='cursor-pointer text-gray-400'
                        size={18}
                        onClick={() => removeMultiAddress(idx)}
                      />
                    </div>
                  ))}
                  <button
                    type='button'
                    className='w-full rounded-md bg-cyan-700 px-4 py-2 text-sm text-white hover:bg-cyan-800'
                    onClick={addMultiAddress}
                    disabled={formData.ownership !== 'MultiSig'}
                  >
                    + Add Address
                  </button>
                  {Array.isArray(errors.multiAddresses) &&
                    errors.multiAddresses.map((err, i) => {
                      if (!err) return null;
                      if (!shouldShowMultiAddressError(i)) return null;
                      return (
                        <p key={i} className='text-sm text-red-500'>
                          {err}
                        </p>
                      );
                    })}
                </div>

                <div className='relative flex flex-col gap-2'>
                  <label className='text-sm text-cyan-300'>
                    Approval Threshold
                  </label>
                  <input
                    type='number'
                    placeholder='Enter threshold'
                    className={`w-full rounded-xl border border-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-gray-600 ${
                      formData.ownership !== 'MultiSig'
                        ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                        : 'bg-[#1c1c1e] text-gray-300'
                    }`}
                    value={formData.multiThreshold}
                    onChange={(e) =>
                      handleInputChange('multiThreshold', e.target.value)
                    }
                    onBlur={() => handleFieldBlur('multiThreshold')}
                    disabled={formData.ownership !== 'MultiSig'}
                  />
                  {shouldShowError('multiThreshold') &&
                    errors.multiThreshold && (
                      <p className='text-sm text-red-500'>
                        {errors.multiThreshold as string}
                      </p>
                    )}
                </div>
              </>
            )}

            {/* 4) Fee */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Modification Fee</label>
              <input
                type='number'
                placeholder='Enter modification fee'
                className={`w-full rounded-xl border border-gray-700 px-4 py-3 outline-none focus:ring-2 focus:ring-gray-600 ${
                  formData.immutable !== 'False' ||
                  formData.ownership === 'Permissionless'
                    ? 'cursor-not-allowed bg-gray-800 text-gray-500'
                    : 'bg-[#1c1c1e] text-gray-300'
                }`}
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                onBlur={() => handleFieldBlur('fee')}
                disabled={
                  formData.immutable !== 'False' ||
                  formData.ownership === 'Permissionless'
                }
              />
              {shouldShowError('fee') && errors.fee && (
                <p className='text-sm text-red-500'>{errors.fee as string}</p>
              )}
            </div>

            {/* 5) Thumbnail: default or custom */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Thumbnail Image</label>
              <div className='flex items-center space-x-2'>
                <input
                  type='checkbox'
                  checked={useDefaultThumbnail}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setUseDefaultThumbnail(checked);
                    if (checked) {
                      // If checked => set default
                      updateForm({
                        ...formData,
                        thumbnail: DEFAULT_THUMBNAIL_URL,
                      });
                    } else {
                      // If unchecked => clear
                      updateForm({ ...formData, thumbnail: '' });
                    }
                  }}
                />
                <span className='text-sm text-cyan-300'>
                  Use Default Thumbnail
                </span>
              </div>
              {!useDefaultThumbnail && (
                <div className='relative flex items-center space-x-2'>
                  <input
                    type='file'
                    accept='image/png, image/jpeg'
                    className='hidden'
                    id='thumbnailFile'
                    onChange={(e) =>
                      handleInputChange(
                        'thumbnail',
                        e.target.files?.[0] || null,
                      )
                    }
                    onBlur={() => handleFieldBlur('thumbnail')}
                  />
                  <label
                    htmlFor='thumbnailFile'
                    className={`flex w-[300px] cursor-pointer items-center justify-center rounded-xl ${
                      formData.thumbnail ? 'bg-gray-800' : 'bg-[#1c1c1e]'
                    } px-4 py-3 text-gray-300 outline-none transition-all duration-200 hover:bg-gray-800`}
                  >
                    <Upload size={18} className='mr-2' />
                    {formData.thumbnail
                      ? 'Thumbnail Selected'
                      : 'Upload Thumbnail'}
                  </label>
                  {formData.thumbnail && (
                    <X
                      className='cursor-pointer text-gray-400'
                      size={18}
                      onClick={() => handleInputChange('thumbnail', null)}
                    />
                  )}
                </div>
              )}
              {shouldShowError('thumbnail') && errors.thumbnail && (
                <p className='text-sm text-red-500'>
                  {errors.thumbnail as string}
                </p>
              )}
            </div>

            {/* 6) HTML File */}
            <div className='relative flex flex-col gap-2'>
              <label className='flex items-center gap-1 text-sm text-cyan-300'>
                <span>HTML File</span>
                <HelpCircle
                  size={16}
                  className='cursor-pointer text-gray-400 hover:text-gray-200'
                />
              </label>
              <div className='relative flex items-center space-x-2'>
                <input
                  type='file'
                  accept='text/html'
                  className='hidden'
                  id='htmlFile'
                  onChange={(e) =>
                    handleInputChange('htmlFile', e.target.files?.[0] || null)
                  }
                  onBlur={() => handleFieldBlur('htmlFile')}
                />
                <label
                  htmlFor='htmlFile'
                  className={`flex w-[300px] cursor-pointer items-center justify-center rounded-xl ${
                    formData.htmlFile ? 'bg-gray-800' : 'bg-[#1c1c1e]'
                  } px-4 py-3 text-gray-300 outline-none transition-all duration-200 hover:bg-gray-800`}
                >
                  <Upload size={18} className='mr-2' />
                  {formData.htmlFile
                    ? 'HTML File Selected'
                    : 'Upload HTML File'}
                </label>
                {formData.htmlFile && (
                  <X
                    className='cursor-pointer text-gray-400'
                    size={18}
                    onClick={() => handleInputChange('htmlFile', null)}
                  />
                )}
              </div>
              {shouldShowError('htmlFile') && errors.htmlFile && (
                <p className='text-sm text-red-500'>
                  {errors.htmlFile as string}
                </p>
              )}
            </div>

            {/* Deploy button */}
            <button
              className='relative w-full rounded-md bg-blue-500 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-600 disabled:bg-gray-500'
              onClick={handleDeploy}
              disabled={isDeploying || isPending}
            >
              {isDeploying && (
                <span className='absolute left-5 top-1/2 -translate-y-1/2'>
                  <Spinner />
                </span>
              )}
              <span className={isDeploying ? 'ml-6' : ''}>
                {isDeploying ? 'Deploying...' : 'Deploy'}
              </span>
            </button>
          </div>
        </div>

        {/* Right: Planet with progress ring */}
        <div className='relative flex w-full items-center justify-center md:w-1/2'>
          <div className='relative h-[500px] w-[500px]'>
            <CircularProgress progress={isNaN(progress) ? 0 : progress} />
            <Canvas className='absolute h-full w-full'>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <CustomStarsPlanet
                radius={1 + (progress / 100) * 1.5}
                starCount={3000}
                rotationSpeed={0.02}
                color1='#4A90E2'
                color2='#F5A623'
                minSize={0.1}
                maxSize={0.2}
                fade
              />
            </Canvas>
          </div>
        </div>
      </main>
    </div>
  );
}
