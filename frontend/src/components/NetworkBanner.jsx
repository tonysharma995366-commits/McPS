import React, { useState, useEffect } from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { onNetworkStatusChange } from '../lib/api.js';

/**
 * Global Network Status Banner.
 * Displays offline alerts and API connection failure warnings right below TopBar.
 */
export default function NetworkBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isApiDown, setIsApiDown] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = onNetworkStatusChange((hasIssue) => {
      setIsApiDown(hasIssue);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (isOffline) {
    return (
      <div className="fixed top-[52px] left-0 right-0 z-40 max-w-[480px] mx-auto bg-[#ef4444] text-white px-3 py-1.5 text-[11.5px] font-medium flex items-center justify-center gap-1.5 shadow-md animate-in fade-in duration-150 select-none">
        <WifiOff size={13} className="shrink-0" />
        <span>You are offline — changes won't save</span>
      </div>
    );
  }

  if (isApiDown) {
    return (
      <div className="fixed top-[52px] left-0 right-0 z-40 max-w-[480px] mx-auto bg-[#fbbf24] text-[#0f1115] px-3 py-1.5 text-[11.5px] font-medium flex items-center justify-center gap-1.5 shadow-md animate-in fade-in duration-150 select-none">
        <AlertTriangle size={13} className="shrink-0" />
        <span>Connection issue — retrying server...</span>
      </div>
    );
  }

  return null;
}
