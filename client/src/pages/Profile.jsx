import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Bell, Lock } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { enablePush, disablePush, getPushSubscription, isPushSupported } from '../push';
import { Avatar, Verified, Stars } from '../components/primitives';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const btnSecondary =
  'bg-secondary text-foreground rounded-2xl py-3 px-4 font-bold text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50';
const btnDanger =
  'bg-destructive text-white rounded-2xl py-3 px-4 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50';

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [bio, setBio] = useState(user.bio || '');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushError, setPushError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function loadContacts() {
    setContacts(await api.get('/users/me/emergency-contacts'));
  }
  useEffect(() => { loadContacts(); }, []);
  useEffect(() => {
    isPushSupported().then((supported) => {
      setPushSupported(supported);
      if (supported) getPushSubscription().then((sub) => setPushEnabled(!!sub));
    });
  }, []);

  async function togglePush() {
    setPushError('');
    try {
      if (pushEnabled) {
        await disablePush();
        setPushEnabled(false);
      } else {
        await enablePush();
        setPushEnabled(true);
      }
    } catch (err) {
      setPushError(err.message);
    }
  }

  async function addContact(e) {
    e.preventDefault();
    await api.post('/users/me/emergency-contacts', newContact);
    setNewContact({ name: '', phone: '', email: '', relationship: '' });
    loadContacts();
  }

  async function removeContact(id) {
    await api.del(`/users/me/emergency-contacts/${id}`);
    loadContacts();
  }

  async function saveBio() {
    await api.patch('/users/me', { bio });
    refresh();
  }

  async function requestVerification() {
    await api.post('/users/me/verification-request', {});
    refresh();
    alert('Verification requested. An admin will review your account.');
  }

  async function deleteAccount(e) {
    e.preventDefault();
    setDeleteError('');
    if (!confirm('Permanently delete your account? This removes your rides, messages, ratings, and emergency contacts. This cannot be undone.')) {
      return;
    }
    setDeleting(true);
    try {
      await api.del('/users/me', { password: deletePassword });
      logout();
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
    }
  }

  const stats = user.stats || {};
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;
  const badges = [
    user.verification_status === 'verified' && { label: 'Verified', cls: 'bg-secondary text-foreground' },
    Number(stats.rides_offered || 0) + Number(stats.rides_taken || 0) >= 10 && { label: '10+ Rides', cls: 'bg-amber-100 text-amber-700' },
    user.driver_available && { label: 'Designated Driver', cls: 'bg-[#2E8B7A]/10 text-[#2E8B7A]' },
  ].filter(Boolean);

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-[26px] font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Profile</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <Link to="/driver" className="text-xs font-bold px-3.5 py-2 rounded-full bg-secondary text-foreground hover:bg-muted transition-colors whitespace-nowrap">
            Designated driver
          </Link>
          <Link to="/events" className="text-xs font-bold px-3.5 py-2 rounded-full bg-secondary text-foreground hover:bg-muted transition-colors whitespace-nowrap">
            Events
          </Link>
          <Link to="/history" className="text-xs font-bold px-3.5 py-2 rounded-full bg-secondary text-foreground hover:bg-muted transition-colors whitespace-nowrap">
            My ride history
          </Link>
          {user.role === 'admin' && (
            <Link to="/admin" className="text-xs font-bold px-3.5 py-2 rounded-full bg-secondary text-foreground hover:bg-muted transition-colors whitespace-nowrap flex items-center gap-1">
              <Lock className="w-3 h-3" /> Admin
            </Link>
          )}
        </div>

        {/* Hero */}
        <div className={cardCls}>
          <div className="flex items-center gap-4">
            <Avatar name={user.full_name} size="xl" color="accent" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{user.full_name}</h2>
                {user.verification_status === 'verified' && <Verified />}
              </div>
              {memberSince && <p className="text-xs text-muted-foreground">Member since {memberSince}</p>}
              <Stars rating={stats.avg_rating} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {[
              { label: 'Offered', value: stats.rides_offered ?? 0 },
              { label: 'Taken', value: stats.rides_taken ?? 0 },
              { label: 'Rating', value: stats.avg_rating ? `${stats.avg_rating}★` : '—' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-accent" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-display)' }}>Badges Earned</h3>
            <div className="flex gap-2 flex-wrap">
              {badges.map((b) => (
                <span key={b.label} className={`text-xs font-bold px-3 py-1.5 rounded-full ${b.cls}`}>{b.label}</span>
              ))}
            </div>
          </div>
        )}

        <div className={cardCls}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-secondary text-foreground capitalize">
              {user.verification_status}
            </span>
            {user.verification_status === 'unverified' && (
              <button onClick={requestVerification} className="text-xs font-bold text-accent hover:opacity-70 transition-opacity">
                Request verification
              </button>
            )}
          </div>
          <label className={labelCls}>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${inputCls} resize-none mb-3`} />
          <button onClick={saveBio} className={btnSecondary}>Save bio</button>
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <Bell className="w-4 h-4 text-foreground" />
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Push notifications
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            Turn this on so you get notified immediately if a friend who lists you as an emergency contact triggers an alert.
          </p>
          {pushSupported ? (
            <button onClick={togglePush} className={btnSecondary}>
              {pushEnabled ? 'Disable push notifications' : 'Enable push notifications'}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">Push notifications aren't supported in this browser.</p>
          )}
          {pushError && <p className="text-sm text-destructive mt-2">{pushError}</p>}
        </div>

        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-[#2E8B7A]" />
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              Emergency contacts
            </h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            If a contact below is also a Town Rides user (matched by phone or email), they'll be notified in-app and via
            push if they triggered or were listed in an alert.
          </p>

          {contacts.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-semibold text-foreground">{c.name} ({c.relationship})</p>
                <p className="text-xs text-muted-foreground">{c.phone} {c.email}</p>
              </div>
              <button onClick={() => removeContact(c.id)} className="text-xs font-bold text-destructive hover:opacity-70 transition-opacity">
                Remove
              </button>
            </div>
          ))}

          <form onSubmit={addContact} className="space-y-3 mt-3 pt-3 border-t border-border">
            <div>
              <label className={labelCls}>Name</label>
              <input required value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Relationship</label>
              <input value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} className={inputCls} />
            </div>
            <button type="submit" className={`w-full ${btnSecondary}`}>+ Add contact</button>
          </form>
        </div>

        <div className="bg-[#FFF4F0] rounded-2xl p-4 border border-accent/20">
          <p className="text-xs text-muted-foreground text-center mb-3 leading-relaxed">
            Use the SOS button (bottom right of any screen) to send a safety alert to your emergency contacts and Town Rides support.
          </p>
          <div className="w-full bg-accent text-white rounded-2xl py-4 font-black text-sm flex items-center justify-center gap-2 shadow-md" style={{ fontFamily: 'var(--font-display)' }}>
            <Shield className="w-5 h-5" />
            SOS Always Available
          </div>
        </div>

        <button onClick={logout} className={`w-full ${btnDanger}`}>Log out</button>

        <div className="bg-[#FFF4F0] rounded-2xl p-4 border border-destructive/20">
          <h3 className="font-bold text-sm text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            Delete account
          </h3>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            This permanently removes your account along with your rides, requests, messages, ratings, flags,
            emergency contacts, and notifications. This cannot be undone.
          </p>
          <form onSubmit={deleteAccount} className="space-y-3">
            <div>
              <label className={labelCls}>Confirm your password</label>
              <input
                type="password"
                required
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className={inputCls}
              />
            </div>
            {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
            <button type="submit" disabled={deleting} className={`w-full ${btnDanger}`}>
              {deleting ? 'Deleting...' : 'Permanently delete my account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
