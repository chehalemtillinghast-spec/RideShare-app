import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Onboarding() {
  const navigate = useNavigate();
  const [contact, setContact] = useState({ name: '', phone: '', email: '', relationship: '' });
  const [saved, setSaved] = useState([]);
  const [error, setError] = useState('');

  async function addContact(e) {
    e.preventDefault();
    setError('');
    try {
      const created = await api.post('/users/me/emergency-contacts', contact);
      setSaved((s) => [...s, created]);
      setContact({ name: '', phone: '', email: '', relationship: '' });
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Add an emergency contact</h1>
      <p className="muted">
        These contacts can be alerted in-app if you ever use the emergency button during a ride.
        You can add more later from your profile.
      </p>
      <form onSubmit={addContact}>
        <div className="field">
          <label>Name</label>
          <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
        </div>
        <div className="field">
          <label>Phone</label>
          <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} />
        </div>
        <div className="field">
          <label>Email</label>
          <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} />
        </div>
        <div className="field">
          <label>Relationship</label>
          <input value={contact.relationship} onChange={(e) => setContact({ ...contact, relationship: e.target.value })} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn secondary" type="submit">Add contact</button>
      </form>
      {saved.length > 0 && (
        <ul>
          {saved.map((c) => <li key={c.id}>{c.name} ({c.relationship})</li>)}
        </ul>
      )}
      <button className="btn" onClick={() => navigate('/')}>
        {saved.length > 0 ? 'Done' : 'Skip for now'}
      </button>
    </div>
  );
}
