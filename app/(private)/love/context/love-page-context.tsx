'use client';

import * as React from 'react';
import { useLovePage } from '../hooks/use-love-page';

type LovePageContextType = ReturnType<typeof useLovePage>;

const LovePageContext = React.createContext<LovePageContextType | undefined>(undefined);

export function LovePageProvider({ children }: { children: React.ReactNode }) {
  const value = useLovePage();
  return (
    <LovePageContext.Provider value={value}>
      {children}
    </LovePageContext.Provider>
  );
}

export function useLovePageContext() {
  const context = React.useContext(LovePageContext);
  if (context === undefined) {
    throw new Error('useLovePageContext must be used within a LovePageProvider');
  }
  return context;
}
export { LovePageContext };
