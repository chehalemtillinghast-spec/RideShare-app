import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { onSocketEvent } from '../socket';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

  async function load() {
    try {
      setNotifications(await api.get('/notifications'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('notification:new', () => load()), []);

  async function acknowledge(id) {
    await api.patch(`/notifications/${id}/acknowledge`, {});
    load();
  }

  async function acknowledgeAll() {
    await api.patch('/notifications/acknowledge-all', {});
    load();
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Notifications
        </h1>
        {notifications.some((n) => !n.acknowledged_at) && (
          <button onClick={acknowledgeAll} className="text-xs font-bold text-accent hover:opacity-70 transition-opacity">
            Mark all as read
          </button>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {notifications.length === 0 && !error && <p className="text-sm text-muted-foreground">No notifications yet.</p>}

        {notifications.map((n) => (
          <div
            key={n.id}
            className={`rounded-2xl p-4 border shadow-sm ${
              n.acknowledged_at ? 'bg-card border-border' : 'bg-accent/5 border-accent/30'
            }`}
          >
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{n.title}</h3>
            <p className="text-sm text-foreground mt-1">{n.body}</p>
            <p className="text-xs text-muted-foreground mt-1.5">{new Date(n.created_at).toLocaleString()}</p>
            <div className="flex items-center gap-3 mt-2">
              {n.type === 'message' && n.related_user_id && (
                <Link
                  to={`/messages?with=${n.related_user_id}${n.ride_id ? `&ride_id=${n.ride_id}` : ''}`}
                  onClick={() => !n.acknowledged_at && acknowledge(n.id)}
                  className="text-xs font-bold text-accent hover:opacity-70 transition-opacity"
                >
                  Open conversation
                </Link>
              )}
              {!n.acknowledged_at && (
                <button onClick={() => acknowledge(n.id)} className="text-xs font-bold text-foreground hover:opacity-70 transition-opacity">
                  Acknowledge
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
