'use client';

import { FC, ReactNode } from 'react';
import { NextUIProvider } from '@nextui-org/react';

export const PetNextUIProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <NextUIProvider>
      {children}
    </NextUIProvider>
  )
}