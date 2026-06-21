import { useEffect, useState } from 'react';
import { onSlowRequest } from './api';

export default function WakingBanner() {
  const [waking, setWaking] = useState(false);

  useEffect(() => onSlowRequest(setWaking), []);

  if (!waking) return null;

  return (
    <div className="waking-banner">
      <span className="waking-spinner" aria-hidden="true" />
      Waking up the server... this can take up to a minute if no one's used the app in a while.
    </div>
  );
}
