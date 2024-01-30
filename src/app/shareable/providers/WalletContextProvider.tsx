'use client';
import { FC, ReactNode, useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { RPC_URL } from '@/app/utils/constants';
require('@solana/wallet-adapter-react-ui/styles.css');
export const WalletContextProvider: FC<{children: ReactNode}> = ({ children }) => {
  const wallets = useMemo(() => {
    return [
    ]
  }, []);

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => RPC_URL, []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={true}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}