'use client';
import { FC } from 'react';
import Link from 'next/link';

import dynamic from 'next/dynamic';
import { Navbar, NavbarContent, NavbarItem, Link as UILink} from '@nextui-org/react';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

export const AppHeader: FC = () => {

  return (
    <Navbar isBordered={true}>
      <NavbarContent justify={'start'}>
        <NavbarItem>
          <UILink className={'text-sm'} as={Link} href={'/'} color={'foreground'}>
            Find wallets and drop
          </UILink>
        </NavbarItem>
        <NavbarItem>
          <UILink className={'text-sm'} as={Link} href={'/close'} color={'foreground'}>
            Close lookup table
          </UILink>
        </NavbarItem>
      </NavbarContent>
      <NavbarContent justify={'end'}>
        <NavbarItem>
          <WalletMultiButtonDynamic className={'test-button-wallet'}></WalletMultiButtonDynamic>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  )
}