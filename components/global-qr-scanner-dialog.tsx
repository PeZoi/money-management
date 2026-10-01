'use client';

import * as React from 'react';
import { useQrScannerStore } from '@/hooks/use-qr-scanner-store';
import { QrScannerDialog } from '@/components/qr-scanner-dialog';

export function GlobalQrScannerDialog() {
  const { isOpen, setIsOpen } = useQrScannerStore();

  return (
    <QrScannerDialog
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  );
}
