'use client';

import { create } from 'zustand';

interface QrScannerState {
  isOpen: boolean;
  openScanner: () => void;
  closeScanner: () => void;
  setIsOpen: (isOpen: boolean) => void;
}

export const useQrScannerStore = create<QrScannerState>((set) => ({
  isOpen: false,
  openScanner: () => set({ isOpen: true }),
  closeScanner: () => set({ isOpen: false }),
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));
