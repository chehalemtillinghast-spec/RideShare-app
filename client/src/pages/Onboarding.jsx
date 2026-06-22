import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { api } from '../api';

const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

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
    <div className="flex flex-col min-h-[calc(100vh-56px)] px-5 pt-10 pb-6 bg-background">
      <div className="flex items-center gap-2 mb-1">
        <Shield className="w-5 h-5 text-[#2E8B7A]" />
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Add an emergency contact
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        These contacts can be alerted in-app if you ever use the emergency button during a ride.
        You can add more later from your profile.
      </p>

      <form onSubmit={addContact} className="space-y-4">
        <div>
          <label className={labelCls}>Name</label>
          <input required value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input value={contact.phone} onChange={(e) => setContact({ ...contact, phone: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Relationship</label>
          <input value={contact.relationship} onChange={(e) => setContact({ ...contact, relationship: e.target.value })} className={inputCls} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full bg-secondary text-foreground rounded-2xl py-3 font-bold text-sm border border-border hover:bg-muted transition-colors"
        >
          + Add contact
        </button>
      </form>

      {saved.length > 0 && (
        <div className="mt-4 space-y-2">
          {saved.map((c) => (
            <div key={c.id} className="bg-card rounded-xl px-4 py-2.5 border border-border text-sm text-foreground">
              {c.name} ({c.relationship})
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => navigate('/')}
        className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 mt-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {saved.length > 0 ? 'Done' : 'Skip for now'}
      </button>
    </div>
  );
}
