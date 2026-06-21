import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await api.get('/events');
    setEvents(data);
  }
  useEffect(() => { load(); }, []);

  async function createEvent(e) {
    e.preventDefault();
    try {
      await api.post('/events', form);
      setForm({ title: '', description: '', location: '', start_time: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Community events</h1>
      <button className="btn secondary" onClick={() => setShowForm((s) => !s)}>
        {showForm ? 'Cancel' : 'Add an event'}
      </button>
      {showForm && (
        <form onSubmit={createEvent} style={{ marginTop: 12 }}>
          <div className="field"><label>Title</label><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="field"><label>Location</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="field"><label>Start time</label><input type="datetime-local" required value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} /></div>
          {error && <p className="error">{error}</p>}
          <button className="btn" type="submit">Save event</button>
        </form>
      )}
      <div style={{ marginTop: 16 }}>
        {events.length === 0 && <p className="muted">No upcoming events yet.</p>}
        {events.map((ev) => (
          <Link key={ev.id} to={`/events/${ev.id}`} style={{ display: 'block' }}>
            <div className="card">
              <h3>{ev.title}</h3>
              <p className="muted">{new Date(ev.start_time).toLocaleString()} {ev.location && `· ${ev.location}`}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
