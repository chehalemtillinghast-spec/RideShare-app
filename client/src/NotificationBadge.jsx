import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { api } from './api';

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
    const interval = setInterval(poll, 30000);
    return () => { active = false; clearInterval(interval); };
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
