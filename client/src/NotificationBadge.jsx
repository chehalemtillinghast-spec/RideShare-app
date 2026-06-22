import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
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
    <NavLink to="/notifications" style={{ position: 'relative' }}>
      Alerts
      {count > 0 && (
        <span
          style={{
            background: '#c0392b', color: '#fff', borderRadius: 10,
            fontSize: 11, padding: '1px 6px', marginLeft: 4,
          }}
        >
          {count}
        </span>
      )}
    </NavLink>
  );
}
