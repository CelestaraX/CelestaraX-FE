import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <div className='flex justify-between p-10'>
      <h1 className='text-2xl font-bold'>My Galaxy</h1>
      <ConnectButton />
    </div>
  );
};
