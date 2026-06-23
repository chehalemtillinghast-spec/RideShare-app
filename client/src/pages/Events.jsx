import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Plus } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import SwipeToDelete from '../components/SwipeToDelete';

const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', location: '', start_time: '' });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const data = await api.get('/events');
    setEvents(data);
  }
  useEffect(() => { load(); }, []);

  async function deleteEvent(id) {
    if (!confirm('Delete this event? This cannot be undone.')) return;
    await api.del(`/events/${id}`);
    load();
  }

  async function createEvent(e) {
    e.preventDefault();
    try {
      await api.post('/events', { ...form, start_time: new Date(form.start_time).toISOString() });
      setForm({ title: '', description: '', location: '', start_time: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Community events
        </h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shrink-0"
        >
          <Plus className={`w-4 h-4 transition-transform ${showForm ? 'rotate-45' : ''}`} />
        </button>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-3">
        {showForm && (
          <form onSubmit={createEvent} className="bg-card rounded-2xl p-4 border border-border shadow-sm space-y-3">
            <div>
              <label className={labelCls}>Title</label>
              <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Start time</label>
              <input
                type="datetime-local"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className={inputCls}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <button
              type="submit"
              className="w-full bg-accent text-white rounded-2xl py-3 font-bold text-sm shadow-md hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Save event
            </button>
          </form>
        )}

        {events.length === 0 && <p className="text-sm text-muted-foreground">No upcoming events yet.</p>}

        <div className="space-y-3">
          {events.map((ev) => (
            <SwipeToDelete key={ev.id} disabled={ev.created_by !== user.id} onDelete={() => deleteEvent(ev.id)}>
              <Link
                to={`/events/${ev.id}`}
                className="block bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md active:scale-[0.985] transition-all duration-150"
              >
                <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {ev.title}
                </h3>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span>{new Date(ev.start_time).toLocaleString()}</span>
                </div>
                {ev.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span>{ev.location}</span>
                  </div>
                )}
              </Link>
            </SwipeToDelete>
          ))}
        </div>
      </div>
    </div>
  );
}
