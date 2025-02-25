'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import Header from '@/components/layout/Header';
import { X, Upload } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import CustomStarsPlanet from '@/components/CustomStarsPlanet';

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

interface FormData {
  name: string;
  thumbnail: File | null;
  htmlFile: File | null;
  ownership: string;
  immutable: string;
  fee: string;
}

export default function DeployPage() {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal(); // ★ RainbowKit useConnectModal
  const [formData, setFormData] = useState<FormData>({
    name: '',
    thumbnail: null,
    htmlFile: null,
    ownership: '',
    immutable: '',
    fee: '',
  });
  const [progress, setProgress] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<{ [key in keyof FormData]?: boolean }>(
    {},
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleDropdownToggle = (field: keyof FormData) => {
    setIsOpen((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // 🔹 외부 클릭 감지하는 useEffect 추가
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen({}); // 모든 드롭다운 닫기
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const validProgress = isNaN(progress) ? 0 : progress;

  const calculateProgress = (updatedForm: FormData) => {
    if (!updatedForm) {
      setProgress(0);
      return;
    }
    const completedFields = Object.values(updatedForm).reduce(
      (count, value) => {
        if (typeof value === 'string' && value.trim() !== '') return count + 1;
        if (value instanceof File) return count + 1;
        return count;
      },
      0,
    );
    const newProgress = Math.max(0, Math.min(100, (completedFields / 6) * 100));
    setProgress(newProgress);
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | File | null,
  ) => {
    const updatedForm = { ...formData, [field]: value };
    setFormData(updatedForm);
    calculateProgress(updatedForm);
  };

  // ★ Deploy 버튼 로직
  const handleDeploy = () => {
    if (!isConnected) {
      // 지갑이 연결 안 됐다면 RainbowKit 모달 열기
      if (openConnectModal) {
        openConnectModal();
      } else {
        alert('지갑 연결을 위한 모달을 열 수 없습니다.');
      }
      return;
    }
    if (progress < 100) {
      alert('Please fill in all the fields before deploying.');
      return;
    }
    alert('Deployment successful!');
  };

  return (
    <div>
      <Header />
      <main className='flex h-[calc(100vh-100px)] items-center justify-center'>
        <div className='flex w-full flex-col gap-10 space-y-6 pl-[100px] md:w-1/2'>
          <div className='flex flex-col gap-5 font-mono'>
            <h1 className='text-3xl font-bold text-white'>
              Deploy Your Own Planet
            </h1>
            <div>Deploy your own page to Celestia.</div>
          </div>
          <div className='flex flex-col gap-7'>
            {(['name', 'fee'] as Array<keyof FormData>).map((field) => (
              <div key={field} className='relative flex flex-col gap-2'>
                <label className='text-sm text-cyan-300'>
                  {field.charAt(0).toUpperCase() + field.slice(1)}
                </label>
                <input
                  type={field === 'fee' ? 'number' : 'text'}
                  placeholder={`Enter ${field}`}
                  className='w-full rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 text-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-600'
                  value={
                    formData[field] instanceof File
                      ? formData[field]?.name
                      : formData[field] || ''
                  }
                  onChange={(e) => handleInputChange(field, e.target.value)}
                />
              </div>
            ))}

            {(['ownership', 'immutable'] as Array<keyof FormData>).map(
              (field) => {
                const options =
                  field === 'ownership'
                    ? ['Single', 'MultiSig', 'Permissionless']
                    : ['True', 'False'];

                return (
                  <div key={field} className='relative flex flex-col gap-2'>
                    <label className='text-sm text-cyan-300'>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <div className='relative'>
                      <div
                        className='w-full cursor-pointer rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 pr-10 text-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-600'
                        onClick={() => handleDropdownToggle(field)}
                      >
                        {formData[field] instanceof File
                          ? (formData[field] as File).name
                          : formData[field] || `Select ${field}`}
                      </div>
                      <div
                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                          isOpen[field] ? 'rotate-180' : ''
                        } pointer-events-none`}
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
                      {isOpen[field] && (
                        <div className='absolute left-0 top-full z-10 mt-2 w-full rounded-xl border border-gray-700 bg-[#1c1c1e] shadow-lg'>
                          {options.map((option) => (
                            <div
                              key={option}
                              className='cursor-pointer px-4 py-2 text-gray-300 hover:bg-gray-700'
                              onClick={() => {
                                handleInputChange(field, option);
                                setTimeout(
                                  () => handleDropdownToggle(field),
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
                  </div>
                );
              },
            )}

            {(['thumbnail', 'htmlFile'] as Array<keyof FormData>).map(
              (field) => (
                <div key={field} className='relative flex flex-col gap-2'>
                  <label className='text-sm text-cyan-300'>
                    {field === 'thumbnail' ? 'Thumbnail Image' : 'HTML File'}
                  </label>
                  <div className='relative flex items-center space-x-2'>
                    <input
                      type='file'
                      accept={
                        field === 'thumbnail'
                          ? 'image/png, image/jpeg'
                          : 'text/html'
                      }
                      className='hidden'
                      id={field}
                      onChange={(e) =>
                        handleInputChange(field, e.target.files?.[0] || null)
                      }
                    />
                    <label
                      htmlFor={field}
                      className='flex cursor-pointer items-center justify-center rounded-xl bg-[#1c1c1e] px-4 py-3 text-gray-300 outline-none transition-all duration-200 hover:bg-gray-800'
                    >
                      <Upload size={18} className='mr-2' />
                      {formData[field] instanceof File
                        ? formData[field]?.name
                        : `Upload ${field}`}
                    </label>
                    {formData[field] && (
                      <X
                        className='cursor-pointer text-gray-400'
                        size={18}
                        onClick={() => handleInputChange(field, null)}
                      />
                    )}
                  </div>
                </div>
              ),
            )}

            <button
              className='w-full rounded-md bg-blue-500 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-600 disabled:bg-gray-500'
              onClick={handleDeploy}
            >
              Deploy
            </button>
          </div>
        </div>

        <div className='relative flex w-full items-center justify-center md:w-1/2'>
          <div className='relative h-[500px] w-[500px]'>
            <CircularProgress progress={progress} />
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
