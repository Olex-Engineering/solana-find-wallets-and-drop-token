'use client';

import { FC } from "react";
import { PetNextUIProvider } from "./NextUIProvider";
import { WalletContextProvider } from "./WalletContextProvider";

export const GlobalProvider: FC<{children: React.ReactNode}> = ({children}) => {
    return (
        <PetNextUIProvider>
          <WalletContextProvider>
              {children}
          </WalletContextProvider>
        </PetNextUIProvider>
    )
}