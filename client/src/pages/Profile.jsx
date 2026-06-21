import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { enablePush, disablePush, getPushSubscription, isPushSupported } from '../push';

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

  return (
    <div className="page">
      <h1>{user.full_name}</h1>
      <p className="muted">{user.email}</p>
      <p>
        Verification:{' '}
        <span className={`badge ${user.verification_status === 'pending' ? 'pending' : ''}`}>{user.verification_status}</span>
        {user.verification_status === 'unverified' && (
          <button className="btn secondary" style={{ marginLeft: 8 }} onClick={requestVerification}>Request verification</button>
        )}
      </p>

      <div className="field">
        <label>Bio</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>
      <button className="btn secondary" onClick={saveBio}>Save bio</button>

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Push notifications</h2>
        <p className="muted">
          Turn this on so you get notified immediately if a friend who lists you as an emergency contact triggers an alert.
        </p>
        {pushSupported ? (
          <button className="btn secondary" onClick={togglePush}>
            {pushEnabled ? 'Disable push notifications' : 'Enable push notifications'}
          </button>
        ) : (
          <p className="muted">Push notifications aren't supported in this browser.</p>
        )}
        {pushError && <p className="error">{pushError}</p>}
      </div>

      <h2 style={{ marginTop: 24 }}>Emergency contacts</h2>
      <p className="muted">
        If a contact below is also a Town Rides user (matched by phone or email), they'll be notified in-app and via
        push if they triggered or were listed in an alert.
      </p>
      {contacts.map((c) => (
        <div key={c.id} className="card">
          <p>{c.name} ({c.relationship}) — {c.phone} {c.email}</p>
          <button className="btn danger" onClick={() => removeContact(c.id)}>Remove</button>
        </div>
      ))}
      <form onSubmit={addContact}>
        <div className="field"><label>Name</label><input required value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} /></div>
        <div className="field"><label>Phone</label><input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} /></div>
        <div className="field"><label>Email</label><input value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} /></div>
        <div className="field"><label>Relationship</label><input value={newContact.relationship} onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })} /></div>
        <button className="btn secondary" type="submit">Add contact</button>
      </form>

      <button className="btn danger" style={{ marginTop: 24 }} onClick={logout}>Log out</button>

      <div className="card" style={{ marginTop: 24, borderColor: '#c0392b' }}>
        <h2>Delete account</h2>
        <p className="muted">
          This permanently removes your account along with your rides, requests, messages, ratings, flags,
          emergency contacts, and notifications. This cannot be undone.
        </p>
        <form onSubmit={deleteAccount}>
          <div className="field">
            <label>Confirm your password</label>
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>
          {deleteError && <p className="error">{deleteError}</p>}
          <button className="btn danger" type="submit" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Permanently delete my account'}
          </button>
        </form>
      </div>
    </div>
  );
}
