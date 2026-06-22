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
    <div className="page">
      <h1>Notifications</h1>
      {error && <p className="error">{error}</p>}
      {notifications.some((n) => !n.acknowledged_at) && (
        <button className="btn secondary" onClick={acknowledgeAll}>Mark all as read</button>
      )}
      {notifications.length === 0 && <p className="muted">No notifications yet.</p>}
      {notifications.map((n) => (
        <div
          key={n.id}
          className="card"
          style={{ background: n.acknowledged_at ? '#fff' : '#fff3cd', borderColor: n.acknowledged_at ? undefined : '#e0c46c' }}
        >
          <h3>{n.title}</h3>
          <p>{n.body}</p>
          <p className="muted">{new Date(n.created_at).toLocaleString()}</p>
          {n.type === 'message' && n.related_user_id && (
            <Link
              to={`/messages?with=${n.related_user_id}${n.ride_id ? `&ride_id=${n.ride_id}` : ''}`}
              onClick={() => !n.acknowledged_at && acknowledge(n.id)}
            >
              Open conversation
            </Link>
          )}
          {!n.acknowledged_at && (
            <button className="btn secondary" onClick={() => acknowledge(n.id)}>Acknowledge</button>
          )}
        </div>
      ))}
    </div>
  );
}
