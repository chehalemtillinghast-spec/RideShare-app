import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Shield, Lock, BadgeCheck } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { enablePush, disablePush, getPushSubscription, isPushSupported } from '../push';
import { BackButton } from '../components/primitives';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const btnSecondary =
  'bg-secondary text-foreground rounded-2xl py-3 px-4 font-bold text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50';
const btnDanger =
  'bg-destructive text-white rounded-2xl py-3 px-4 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50';

export default function Settings() {
  const { logout, user, refresh } = useAuth();
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushError, setPushError] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  async function requestVerification() {
    await api.post('/users/me/verification-request', {});
    refresh();
    alert('Verification requested. An admin will review your account.');
  }

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

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-8 pb-4 flex items-center gap-3">
        <BackButton onPress={() => navigate('/profile')} />
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Settings</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        {user.role === 'admin' && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-2 text-sm font-bold px-3.5 py-2.5 rounded-xl bg-secondary text-foreground hover:bg-muted transition-colors"
          >
            <Lock className="w-4 h-4" /> Admin
          </button>
        )}

        {user.verification_status === 'unverified' && (
          <div className={cardCls}>
            <div className="flex items-center gap-2 mb-1">
              <BadgeCheck className="w-4 h-4 text-[#2E8B7A]" />
              <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                Account verification
              </h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              Verified accounts get a badge on their profile and build more trust with neighbors.
            </p>
            <button onClick={requestVerification} className={btnSecondary}>Request verification</button>
          </div>
        )}

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
            If a contact below is also a Ride user (matched by phone or email), they'll be notified in-app and via
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
