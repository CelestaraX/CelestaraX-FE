'use client';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function WalletConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: { opacity: 0, pointerEvents: 'none' },
            })}
          >
            {connected ? (
              <button
                onClick={openAccountModal}
                className='transform rounded-md bg-[#ff00ff] px-4 py-2 font-mono text-lg text-white shadow-lg transition hover:scale-105 hover:shadow-[0_0_12px_#ff00ff]'
              >
                {account.displayName}
              </button>
            ) : (
              <button
                onClick={openConnectModal}
                className='transform rounded-md bg-[#ff00ff] px-4 py-2 font-mono text-lg text-white shadow-lg transition hover:scale-105 hover:shadow-[0_0_12px_#ff00ff]'
              >
                CONNECT
              </button>
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
