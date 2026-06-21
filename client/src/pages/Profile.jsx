import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Profile() {
  const { user, logout, refresh } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [bio, setBio] = useState(user.bio || '');

  async function loadContacts() {
    setContacts(await api.get('/users/me/emergency-contacts'));
  }
  useEffect(() => { loadContacts(); }, []);

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

      <h2 style={{ marginTop: 24 }}>Emergency contacts</h2>
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
    </div>
  );
}
