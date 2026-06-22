import { useEffect, useState } from 'react';
import { api } from '../api';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-bold px-3.5 py-2 rounded-full whitespace-nowrap transition-colors ${
        active ? 'bg-accent text-white' : 'bg-secondary text-foreground hover:bg-muted'
      }`}
    >
      {children}
    </button>
  );
}

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flags, setFlags] = useState([]);
  const [unreachable, setUnreachable] = useState([]);
  const [tab, setTab] = useState('stats');
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    api.get('/admin/stats').then(setStats);
    api.get('/admin/users').then(setUsers);
    api.get('/flags').then(setFlags);
    api.get('/admin/unreachable-contacts').then(setUnreachable);
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

  async function deleteUser(u) {
    if (!confirm(`Permanently delete the account for ${u.email}? This also deletes their rides, messages, ratings, and other data. This cannot be undone.`)) {
      return;
    }
    try {
      await api.del(`/admin/users/${u.id}`);
      setUsers(await api.get('/admin/users'));
    } catch (err) {
      alert(err.message);
    }
  }

  const filteredUsers = users.filter((u) => u.email.toLowerCase().includes(userSearch.trim().toLowerCase()));

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Admin dashboard
        </h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <TabButton active={tab === 'stats'} onClick={() => setTab('stats')}>Stats</TabButton>
          <TabButton active={tab === 'users'} onClick={() => setTab('users')}>Users</TabButton>
          <TabButton active={tab === 'flags'} onClick={() => setTab('flags')}>Flags</TabButton>
          <TabButton active={tab === 'unreachable'} onClick={() => setTab('unreachable')}>
            Unreachable contacts {unreachable.length > 0 && `(${unreachable.length})`}
          </TabButton>
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {tab === 'stats' && stats && (
          <div className={cardCls}>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Total users', value: stats.total_users },
                { label: 'Total rides', value: stats.total_rides },
                { label: 'Open flags', value: stats.open_flags },
                { label: 'Active alerts', value: stats.active_alerts },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-2xl font-black text-accent" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                  <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <>
            <div>
              <label className={labelCls}>Search by email</label>
              <input value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="someone@example.com" className={inputCls} />
            </div>
            {filteredUsers.length === 0 && <p className="text-sm text-muted-foreground">No users match that search.</p>}
            {filteredUsers.map((u) => (
              <div key={u.id} className={cardCls}>
                <p className="text-sm text-foreground">
                  <span className="font-bold">{u.full_name}</span> ({u.email}) — {u.role} — {u.verification_status}
                  {u.is_suspended && <span className="ml-1.5 text-xs font-bold text-destructive">SUSPENDED</span>}
                </p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <button onClick={() => verify(u.id, 'verified')} className="text-xs font-bold text-foreground bg-secondary rounded-full px-3 py-1.5 hover:bg-muted transition-colors">
                    Verify
                  </button>
                  <button onClick={() => verify(u.id, 'unverified')} className="text-xs font-bold text-foreground bg-secondary rounded-full px-3 py-1.5 hover:bg-muted transition-colors">
                    Unverify
                  </button>
                  <button onClick={() => suspend(u.id, !u.is_suspended)} className="text-xs font-bold text-white bg-destructive rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity">
                    {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                  </button>
                  <button onClick={() => deleteUser(u)} className="text-xs font-bold text-white bg-destructive rounded-full px-3 py-1.5 hover:opacity-90 transition-opacity">
                    Delete account
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {tab === 'flags' && flags.map((f) => (
          <div key={f.id} className={cardCls}>
            <p className="text-sm text-foreground"><span className="font-bold">{f.reason}</span> — <span className="capitalize">{f.status}</span></p>
            {f.details && <p className="text-xs text-muted-foreground mt-1">{f.details}</p>}
            <p className="text-xs text-muted-foreground mt-1">
              Reported by {f.reporter_name} {f.reported_name && `against ${f.reported_name}`}
            </p>
            <select
              value={f.status}
              onChange={(e) => resolveFlag(f.id, e.target.value)}
              className={`${inputCls} mt-3`}
            >
              {['open', 'reviewed', 'resolved', 'dismissed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}

        {tab === 'unreachable' && (
          <>
            {unreachable.length === 0 && <p className="text-sm text-muted-foreground">No unreachable emergency contacts on file.</p>}
            {unreachable.map((u) => (
              <div key={u.alert_recipient_id} className={cardCls}>
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-bold">{u.triggerer_name}</span> ({u.triggerer_phone || 'no phone on file'}) triggered an emergency alert
                  {u.alert_message && `: "${u.alert_message}"`} — their contact <span className="font-bold">{u.contact_name}</span>
                  {u.relationship && ` (${u.relationship})`} isn't a registered user and couldn't be notified in-app.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Reach them directly: {u.contact_phone || 'no phone'} {u.contact_email && `· ${u.contact_email}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1 capitalize">
                  Alert status: {u.alert_status} · {new Date(u.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
