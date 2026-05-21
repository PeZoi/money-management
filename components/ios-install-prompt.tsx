'use client';

import { useState, useEffect } from 'react';
import { Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    
    // Detect standalone mode (already installed)
    const isStandaloneMode = ('standalone' in window.navigator) && (window.navigator as unknown as { standalone: boolean }).standalone;
    
    // Check standard matchMedia for standalone
    const isMatchMediaStandalone = window.matchMedia('(display-mode: standalone)').matches;

    // Show prompt if on iOS and not in standalone mode
    if (isIosDevice && !isStandaloneMode && !isMatchMediaStandalone) {
      const hasSeenPrompt = localStorage.getItem('hasSeenIosPrompt');
      if (!hasSeenPrompt) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShowPrompt(true);
      }
    }
  }, []);

  if (!showPrompt) return null;

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('hasSeenIosPrompt', 'true');
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background border-t shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.3)] dark:shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.8)] pb-safe animate-in slide-in-from-bottom-full duration-500">
      <div className="flex items-start justify-between gap-3 max-w-md mx-auto">
        <div className="flex-1">
          <h3 className="font-semibold text-sm">Cài đặt Money+</h3>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            Thêm ứng dụng vào Màn hình chính để trải nghiệm nhanh hơn. Nhấn <Share className="inline-block w-4 h-4 mx-1 pb-0.5" /> ở thanh dưới cùng và chọn <strong>Thêm vào MH chính</strong> (Add to Home Screen).
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleDismiss} className="shrink-0 -mt-1 -mr-1 h-8 w-8 rounded-full">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
