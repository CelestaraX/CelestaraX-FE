'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import Header from '@/components/layout/Header';
import { X, Upload } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import CustomStarsPlanet from '@/components/CustomStarsPlanet';

const CircularProgress = ({ progress }: { progress: number }) => {
  const radius = 90;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg className='absolute left-0 top-0 h-full w-full' viewBox='0 0 200 200'>
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
        stroke='orange'
        strokeWidth={strokeWidth}
        fill='none'
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap='round'
        className='transition-all duration-500'
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    thumbnail: null,
    htmlFile: null,
    ownership: '',
    immutable: '',
    fee: '',
  });

  const [progress, setProgress] = useState<number>(0);
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

  const handleDeploy = () => {
    if (!isConnected) {
      alert('You must connect your wallet.');
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
          {/* ✅ Left - Input Form */}
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
                      ? formData[field].name
                      : formData[field] || ''
                  }
                  onChange={(e) => handleInputChange(field, e.target.value)}
                />
              </div>
            ))}

            {/* ✅ Select Boxes */}
            {(['ownership', 'immutable'] as Array<keyof FormData>).map(
              (field) => (
                <div key={field} className='relative flex flex-col gap-2'>
                  <label className='text-sm text-cyan-300'>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <select
                    className='w-full rounded-xl border border-gray-700 bg-[#1c1c1e] px-4 py-3 text-gray-300 outline-none transition-all duration-200 focus:ring-2 focus:ring-gray-600'
                    value={
                      formData[field] instanceof File
                        ? formData[field].name
                        : formData[field] || ''
                    }
                    onChange={(e) => handleInputChange(field, e.target.value)}
                  >
                    <option value=''>Select {field}</option>
                    <option value='Single'>Single</option>
                    <option value='MultiSig'>MultiSig</option>
                    <option value='Permissionless'>Permissionless</option>
                  </select>
                </div>
              ),
            )}

            {/* ✅ File Upload */}
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

            {/* ✅ Deploy Button */}
            <button
              className={`w-full rounded-md px-6 py-3 text-lg font-semibold ${
                isConnected
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'cursor-not-allowed bg-gray-500'
              }`}
              onClick={handleDeploy}
              disabled={!isConnected}
            >
              {isConnected ? 'Deploy' : 'Connect Wallet First'}
            </button>
          </div>
        </div>
        {/* ✅ Right - Planet + Progress Bar */}
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
