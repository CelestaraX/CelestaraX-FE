'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Header from '@/components/layout/Header';
import { X, Upload } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import CustomStarsPlanet from '@/components/CustomStarsPlanet';

/**
 * CircularProgress component to display a ring of progress around the planet
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
 * FormData interface to manage form states
 */
interface FormData {
  name: string; // Planet name
  immutable: string; // "True" or "False"
  ownership: string; // "Single" | "MultiSig" | "Permissionless"
  fee: string; // Modification fee
  thumbnail: string; // Base64 representation of the uploaded thumbnail
  htmlFile: string; // Contents of the uploaded HTML file as a string
  singleAddress: string; // Address input if ownership is Single OR Permissionless
  multiAddresses: string[]; // Addresses for multi-sig
  multiThreshold: string; // Approval threshold for multi-sig
}

/**
 * A helper to define dynamic total steps for progress calculation
 * (Used to compute progress %)
 */
const getTotalSteps = (form: FormData) => {
  let steps = 0;

  // (1) Name
  steps++;

  // (2) Immutable (true/false)
  steps++;

  // (3) Ownership
  steps++;

  // (4) Fee (only if immutable = 'False' and ownership != 'Permissionless')
  const feeDisabled =
    form.immutable !== 'False' || form.ownership === 'Permissionless';
  if (!feeDisabled) {
    steps++;
  }

  // (5) Thumbnail
  steps++;

  // (6) HTML file
  steps++;

  // Ownership detail steps:
  // If Single or Permissionless => 1 step for singleAddress
  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    steps++;
  }

  // If MultiSig => threshold + each address is a step
  if (form.ownership === 'MultiSig') {
    // threshold is a step
    steps++;
    // each address is a step
    steps += form.multiAddresses.length;
  }

  return steps;
};

/**
 * A helper to define how many steps have been completed
 * (Used to compute progress %)
 */
const getCompletedSteps = (form: FormData) => {
  let completed = 0;

  // (1) Name
  if (form.name.trim() !== '') completed++;

  // (2) Immutable
  if (form.immutable !== '') completed++;

  // (3) Ownership
  if (form.ownership !== '') completed++;

  // (4) Fee (only if immutable = 'False' && ownership != 'Permissionless')
  const feeDisabled =
    form.immutable !== 'False' || form.ownership === 'Permissionless';
  if (!feeDisabled) {
    if (form.fee.trim() !== '') completed++;
  }

  // (5) Thumbnail
  if (form.thumbnail.trim() !== '') completed++;

  // (6) HTML file
  if (form.htmlFile.trim() !== '') completed++;

  // Single or Permissionless => check singleAddress
  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    if (form.singleAddress.trim() !== '') completed++;
  }

  // MultiSig => threshold + each address
  if (form.ownership === 'MultiSig') {
    // threshold must be valid
    const thresholdNum = parseInt(form.multiThreshold, 10);
    if (
      !isNaN(thresholdNum) &&
      thresholdNum > 0 &&
      thresholdNum <= form.multiAddresses.length
    ) {
      completed++;
    }
    // each address must be non-empty
    form.multiAddresses.forEach((addr) => {
      if (addr.trim() !== '') {
        completed++;
      }
    });
  }

  return completed;
};

/**
 * A helper to gather validation errors for each form field (and sub-fields).
 */
const getErrors = (form: FormData) => {
  const errors: {
    name?: string;
    immutable?: string;
    ownership?: string;
    fee?: string;
    thumbnail?: string;
    htmlFile?: string;
    singleAddress?: string;
    multiAddresses?: string[]; // array of address errors
    multiThreshold?: string;
  } = {};

  // Name check
  if (!form.name.trim()) {
    errors.name = 'Name is required.';
  }

  // Immutable check
  if (!form.immutable) {
    errors.immutable = 'You must choose True or False.';
  }

  // Ownership check
  if (!form.ownership) {
    errors.ownership = 'You must select ownership.';
  }

  // Fee check (only if immutable === 'False' && ownership !== 'Permissionless')
  if (form.immutable === 'False' && form.ownership !== 'Permissionless') {
    if (!form.fee.trim()) {
      errors.fee = 'Fee is required (because immutable = False).';
    }
  }

  // Thumbnail check
  if (!form.thumbnail.trim()) {
    errors.thumbnail = 'Thumbnail is required.';
  }

  // HTML File check
  if (!form.htmlFile.trim()) {
    errors.htmlFile = 'HTML file is required.';
  }

  // Single or Permissionless => singleAddress check
  if (form.ownership === 'Single' || form.ownership === 'Permissionless') {
    if (!form.singleAddress.trim()) {
      errors.singleAddress = 'Address is required.';
    }
  }

  // MultiSig => addresses + threshold checks
  if (form.ownership === 'MultiSig') {
    // For addresses, gather individual errors if empty
    const multiAddrErrors: string[] = [];
    form.multiAddresses.forEach((addr, idx) => {
      if (!addr.trim()) {
        multiAddrErrors[idx] = `Address #${idx + 1} is required.`;
      }
    });
    if (multiAddrErrors.filter(Boolean).length > 0) {
      errors.multiAddresses = multiAddrErrors;
    }

    // Threshold must not be empty, must be a number, must not exceed #addresses
    if (!form.multiThreshold.trim()) {
      errors.multiThreshold = 'Threshold is required.';
    } else {
      const thresholdNum = parseInt(form.multiThreshold, 10);
      if (isNaN(thresholdNum) || thresholdNum <= 0) {
        errors.multiThreshold = 'Threshold must be a valid positive number.';
      } else if (thresholdNum > form.multiAddresses.length) {
        errors.multiThreshold =
          'Threshold cannot exceed the number of addresses.';
      }
    }
  }

  return errors;
};

export default function DeployPage() {
  // Wallet connection
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  // Initialize form data
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

  // Track overall form completion progress
  const [progress, setProgress] = useState<number>(0);

  // Store validation errors in state
  const [errors, setErrors] = useState<{
    [key: string]: string | string[];
  }>({});

  // Keep track of which fields have been "touched"
  // We'll also handle multiAddresses separately (so we can show per-address errors only after user has interacted)
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormData, boolean>>
  >({});
  const [touchedMultiAddresses, setTouchedMultiAddresses] = useState<boolean[]>(
    [],
  );

  // We'll also track if user has tried to submit
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Track which dropdowns are open
  const [isOpen, setIsOpen] = useState<{ [key in keyof FormData]?: boolean }>(
    {},
  );

  // For clicking outside to close dropdowns
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Toggles open/close for a particular dropdown field
   */
  const handleDropdownToggle = (field: keyof FormData) => {
    setIsOpen((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  /**
   * Closes dropdown if user clicks outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen({});
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /**
   * Calculates and updates the progress + errors whenever formData changes
   */
  const updateForm = (updatedForm: FormData) => {
    // Update state
    setFormData(updatedForm);

    // Calculate progress
    const totalSteps = getTotalSteps(updatedForm);
    const completedSteps = getCompletedSteps(updatedForm);
    const newProgress = Math.round((completedSteps / totalSteps) * 100);
    setProgress(newProgress);

    // Calculate and store errors
    const newErrors = getErrors(updatedForm);
    setErrors(newErrors);
  };

  /**
   * We show an error if the field is "touched" or user has "submitted".
   */
  const shouldShowError = (field: keyof FormData) => {
    return touched[field] || hasSubmitted;
  };

  /**
   * For multiAddresses, we show error for a specific index if that index is touched OR user has submitted.
   */
  const shouldShowMultiAddressError = (index: number) => {
    return touchedMultiAddresses[index] || hasSubmitted;
  };

  /**
   * Handles file or text input changes
   * Converts thumbnail to base64 and HTML file to text
   */
  const handleInputChange = async (
    field: keyof FormData,
    value: string | File | null,
  ) => {
    // If it's a file for thumbnail
    if (field === 'thumbnail' && value instanceof File) {
      const file = value;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const updatedForm = { ...formData, [field]: base64 };
        updateForm(updatedForm);
      };
      reader.readAsDataURL(file);
      return;
    }

    // If it's a file for HTML
    if (field === 'htmlFile' && value instanceof File) {
      const file = value;
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const updatedForm = { ...formData, [field]: content };
        updateForm(updatedForm);
      };
      reader.readAsText(file);
      return;
    }

    // Otherwise it's a normal text input
    const updatedForm = { ...formData, [field]: value || '' };
    updateForm(updatedForm);
  };

  /**
   * Mark a field as touched (for single fields)
   */
  const handleFieldBlur = (field: keyof FormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  /**
   * Adds a new empty address to the multiAddresses array
   * Also mark the new address as not touched
   */
  const addMultiAddress = () => {
    const updatedForm = {
      ...formData,
      multiAddresses: [...formData.multiAddresses, ''],
    };
    updateForm(updatedForm);

    // Also update touchedMultiAddresses
    setTouchedMultiAddresses((prev) => [...prev, false]);
  };

  /**
   * Removes a specific address from the multiAddresses array
   */
  const removeMultiAddress = (index: number) => {
    const updatedList = formData.multiAddresses.filter((_, i) => i !== index);
    const updatedForm = { ...formData, multiAddresses: updatedList };
    updateForm(updatedForm);

    // Also remove from touchedMultiAddresses
    setTouchedMultiAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Updates a specific address in the multiAddresses array
   */
  const handleMultiAddressChange = (index: number, newValue: string) => {
    const updatedList = [...formData.multiAddresses];
    updatedList[index] = newValue;
    const updatedForm = { ...formData, multiAddresses: updatedList };
    updateForm(updatedForm);
  };

  /**
   * Mark a specific multi-address input as touched on blur
   */
  const handleMultiAddressBlur = (index: number) => {
    setTouchedMultiAddresses((prev) => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };

  /**
   * Handles the Deploy logic
   */
  const handleDeploy = () => {
    // Mark that user has submitted (this will reveal all errors)
    setHasSubmitted(true);

    // If not connected, open wallet modal
    if (!isConnected) {
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert('Cannot open wallet modal for connection.');
      }
      return;
    }

    // If form is incomplete or has errors, block
    if (progress < 100 || Object.keys(errors).length > 0) {
      alert(
        'Please fix all errors and fill in all required fields before deploying.',
      );
      return;
    }

    // Here you would pass formData to your contract
    alert(
      'Deployment successful (simulation)!\nNow integrate with your contract logic.',
    );
  };

  /**
   * Utility function to handle disabled input styling
   */
  const getInputClass = (disabled: boolean) => {
    return `
      w-full 
      rounded-xl 
      border 
      border-gray-700 
      px-4 py-3
      outline-none 
      transition-all 
      duration-200 
      focus:ring-2 
      focus:ring-gray-600 
      ${
        disabled
          ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
          : 'bg-[#1c1c1e] text-gray-300'
      }
    `;
  };

  // Fee is disabled if immutable != 'False' OR ownership = 'Permissionless'
  const isFeeDisabled =
    formData.immutable !== 'False' || formData.ownership === 'Permissionless';

  // For multiSig addresses
  const isAddressDisabledForMultiSig = formData.ownership !== 'MultiSig';

  // Safely handle progress
  const validProgress = isNaN(progress) ? 0 : progress;

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
                className={getInputClass(false)}
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
                  className='cursor-pointer rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 pr-10 text-gray-300 transition-all duration-200 focus:ring-2 focus:ring-gray-600'
                  onClick={() => handleDropdownToggle('immutable')}
                  onBlur={() => handleFieldBlur('immutable')}
                  tabIndex={0} // To allow onBlur to fire
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
                    {['True', 'False'].map((option) => (
                      <div
                        key={option}
                        className='cursor-pointer px-4 py-2 text-gray-300 hover:bg-gray-700'
                        onClick={() => {
                          handleInputChange('immutable', option);
                          setTimeout(
                            () => handleDropdownToggle('immutable'),
                            100,
                          );
                        }}
                      >
                        {option}
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
                  className='cursor-pointer rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 pr-10 text-gray-300 transition-all duration-200 focus:ring-2 focus:ring-gray-600'
                  onClick={() => handleDropdownToggle('ownership')}
                  onBlur={() => handleFieldBlur('ownership')}
                  tabIndex={0} // To allow onBlur to fire
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
                    {['Single', 'MultiSig', 'Permissionless'].map((option) => (
                      <div
                        key={option}
                        className='cursor-pointer px-4 py-2 text-gray-300 hover:bg-gray-700'
                        onClick={() => {
                          handleInputChange('ownership', option);
                          setTimeout(
                            () => handleDropdownToggle('ownership'),
                            100,
                          );
                        }}
                      >
                        {option}
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

            {/* If Ownership = Single or Permissionless => singleAddress input */}
            {(formData.ownership === 'Single' ||
              formData.ownership === 'Permissionless') && (
              <div className='relative flex flex-col gap-2'>
                <label className='text-sm text-cyan-300'>Owner Address</label>
                <input
                  type='text'
                  placeholder='Enter owner address'
                  className={getInputClass(false)}
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

            {/* If Ownership = MultiSig => multiple addresses + threshold */}
            {formData.ownership === 'MultiSig' && (
              <>
                <div className='relative flex flex-col gap-2'>
                  <label className='text-sm text-cyan-300'>
                    Multi-Sig Addresses
                  </label>
                  {formData.multiAddresses.map((addr, index) => (
                    <div
                      key={index}
                      className='mb-2 flex items-center space-x-2'
                    >
                      <input
                        type='text'
                        placeholder={`Address #${index + 1}`}
                        className={getInputClass(
                          !formData.ownership.includes('MultiSig'),
                        )}
                        value={addr}
                        onChange={(e) =>
                          handleMultiAddressChange(index, e.target.value)
                        }
                        onBlur={() => handleMultiAddressBlur(index)}
                        disabled={isAddressDisabledForMultiSig}
                      />
                      <X
                        className='cursor-pointer text-gray-400'
                        size={18}
                        onClick={() => removeMultiAddress(index)}
                      />
                    </div>
                  ))}
                  <button
                    type='button'
                    className='w-full rounded-md bg-cyan-700 px-4 py-2 text-sm text-white hover:bg-cyan-800'
                    onClick={addMultiAddress}
                    disabled={isAddressDisabledForMultiSig}
                  >
                    + Add Address
                  </button>
                  {/* Show any errors about multiAddresses (like "Address #2 is required") */}
                  {Array.isArray(errors.multiAddresses) &&
                    errors.multiAddresses.map((err, i) => {
                      // Only show if that address has an error AND user has touched that address
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
                    className={getInputClass(
                      !formData.ownership.includes('MultiSig'),
                    )}
                    value={formData.multiThreshold}
                    onChange={(e) =>
                      handleInputChange('multiThreshold', e.target.value)
                    }
                    onBlur={() => handleFieldBlur('multiThreshold')}
                    disabled={isAddressDisabledForMultiSig}
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

            {/* 4) Modification Fee (disabled unless immutable==='False' && ownership!=='Permissionless') */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Modification Fee</label>
              <input
                type='number'
                placeholder='Enter modification fee'
                className={getInputClass(isFeeDisabled)}
                value={formData.fee}
                onChange={(e) => handleInputChange('fee', e.target.value)}
                onBlur={() => handleFieldBlur('fee')}
                disabled={isFeeDisabled}
              />
              {shouldShowError('fee') && errors.fee && (
                <p className='text-sm text-red-500'>{errors.fee as string}</p>
              )}
            </div>

            {/* 5) Thumbnail */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>Thumbnail Image</label>
              <div className='relative flex items-center space-x-2'>
                <input
                  type='file'
                  accept='image/png, image/jpeg'
                  className='hidden'
                  id='thumbnail'
                  onChange={(e) =>
                    handleInputChange('thumbnail', e.target.files?.[0] || null)
                  }
                  onBlur={() => handleFieldBlur('thumbnail')}
                />
                <label
                  htmlFor='thumbnail'
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
              {shouldShowError('thumbnail') && errors.thumbnail && (
                <p className='text-sm text-red-500'>
                  {errors.thumbnail as string}
                </p>
              )}
            </div>

            {/* 6) HTML File */}
            <div className='relative flex flex-col gap-2'>
              <label className='text-sm text-cyan-300'>HTML File</label>
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
              className='w-full rounded-md bg-blue-500 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-600 disabled:bg-gray-500'
              onClick={handleDeploy}
            >
              Deploy
            </button>
          </div>
        </div>

        {/* Right: Planet Section with progress */}
        <div className='relative flex w-full items-center justify-center md:w-1/2'>
          <div className='relative h-[500px] w-[500px]'>
            <CircularProgress progress={validProgress} />
            <Canvas className='absolute h-full w-full'>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <CustomStarsPlanet
                radius={1 + (validProgress / 100) * 1.5}
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
