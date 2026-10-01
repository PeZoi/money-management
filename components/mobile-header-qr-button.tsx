'use client';

import * as React from 'react';
import { QrCodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQrScannerStore } from '@/hooks/use-qr-scanner-store';

export function MobileHeaderQrButton() {
  const { openScanner } = useQrScannerStore();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openScanner}
      className="md:hidden flex items-center gap-1.5 h-9 px-2.5 rounded-xl border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium text-xs shadow-2xs transition-transform active:scale-95"
      aria-label="Quét QR thanh toán"
    >
      <QrCodeIcon className="size-4" />
      <span>Quét QR</span>
    </Button>
  );
}
