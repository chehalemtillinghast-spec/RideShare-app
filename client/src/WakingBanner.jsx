import { useEffect, useState } from 'react';
import { onSlowRequest } from './api';

export default function WakingBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => onSlowRequest(setWaking), []);

  if (!waking) return null;

  return (
    <div className="flex items-center gap-2.5 justify-center bg-[#FFF4F0] text-accent text-xs font-medium px-4 py-2.5 border-b border-accent/20 sticky top-0 z-20">
      <span className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin shrink-0" aria-hidden="true" />
      Waking up the server... this can take up to a minute if no one's used the app in a while.
    </div>
  );
}
