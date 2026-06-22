import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { api } from './api';
import { onSocketEvent } from './socket';

export default function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const { count } = await api.get('/notifications/unacknowledged-count');
        if (active) setCount(count);
      } catch {
        // ignore transient errors
      }
    }
    poll();
    // Socket gives near-instant updates; this interval is just a safety net
    // in case a socket event is missed (e.g. brief disconnect/reconnect gap).
    const interval = setInterval(poll, 60000);
    const offNotification = onSocketEvent('notification:new', () => poll());
    return () => { active = false; clearInterval(interval); offNotification(); };
  }, []);

  return (
    <NavLink to="/notifications" className="relative w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
      <Bell className="w-4 h-4 text-foreground" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-destructive text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
          {count}
        </span>
      )}
    </NavLink>
  );
}
