import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    api.get('/admin/stats').then(setStats);
    api.get('/admin/users').then(setUsers);
    api.get('/flags').then(setFlags);
  }, []);

  async function suspend(id, suspended) {
    await api.patch(`/admin/users/${id}/suspend`, { suspended });
    setUsers(await api.get('/admin/users'));
  }

  async function verify(id, status) {
    await api.patch(`/admin/users/${id}/verify`, { status });
    setUsers(await api.get('/admin/users'));
  }

  async function resolveFlag(id, status) {
    await api.patch(`/flags/${id}`, { status });
    setFlags(await api.get('/flags'));
  }

  return (
    <div className="page">
      <h1>Admin dashboard</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className="btn secondary" onClick={() => setTab('stats')}>Stats</button>
        <button className="btn secondary" onClick={() => setTab('users')}>Users</button>
        <button className="btn secondary" onClick={() => setTab('flags')}>Flags</button>
      </div>

      {tab === 'stats' && stats && (
        <div className="card">
          <p>Total users: {stats.total_users}</p>
          <p>Total rides: {stats.total_rides}</p>
          <p>Open flags: {stats.open_flags}</p>
          <p>Active emergency alerts: {stats.active_alerts}</p>
        </div>
      )}

      {tab === 'users' && users.map((u) => (
        <div key={u.id} className="card">
          <p>{u.full_name} ({u.email}) — {u.role} — {u.verification_status} {u.is_suspended && <strong>SUSPENDED</strong>}</p>
          <button className="btn secondary" onClick={() => verify(u.id, 'verified')}>Verify</button>{' '}
          <button className="btn secondary" onClick={() => verify(u.id, 'unverified')}>Unverify</button>{' '}
          <button className="btn danger" onClick={() => suspend(u.id, !u.is_suspended)}>
            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
          </button>
        </div>
      ))}

      {tab === 'flags' && flags.map((f) => (
        <div key={f.id} className="card">
          <p><strong>{f.reason}</strong> — {f.status}</p>
          <p className="muted">{f.details}</p>
          <p className="muted">Reported by {f.reporter_name} {f.reported_name && `against ${f.reported_name}`}</p>
          <select value={f.status} onChange={(e) => resolveFlag(f.id, e.target.value)}>
            {['open', 'reviewed', 'resolved', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
