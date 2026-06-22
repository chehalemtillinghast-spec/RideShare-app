import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Users, Minus, Plus, Repeat2 } from 'lucide-react';
import { api } from '../api';

function Toggle({ on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-[#2E8B7A]' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`}
      />
    </button>
  );
}

const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

export default function PostRide() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const eventId = params.get('event_id');
  const [form, setForm] = useState({
    creator_role: 'driver',
    origin: '',
    destination: '',
    departure_time: '',
    available_seats: 1,
    distance_miles: '',
    estimated_minutes: '',
    cost_estimate: '',
    notes: '',
    is_recurring: false,
    recurrence_rule: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key) {
    return (e) => {
      const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
      setForm((f) => ({ ...f, [key]: value }));
    };
  }

  function setSeats(n) {
    setForm((f) => ({ ...f, available_seats: Math.max(1, n) }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const ride = await api.post('/rides', { ...form, ride_type: 'posted', event_id: eventId ? Number(eventId) : undefined });
      navigate(`/rides/${ride.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Post a ride
        </h1>
      </div>

      <form onSubmit={onSubmit} className="flex-1 px-4 pb-6 space-y-4">
        <div>
          <label className={labelCls}>I am the...</label>
          <select value={form.creator_role} onChange={update('creator_role')} className={inputCls}>
            <option value="driver">Driver offering a ride</option>
            <option value="rider">Rider looking for a ride</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-accent pointer-events-none" />
            <input
              required
              value={form.origin}
              onChange={update('origin')}
              placeholder="Pickup location..."
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>To</label>
          <div className="relative">
            <Navigation className="absolute left-3 top-3.5 w-4 h-4 text-[#2E8B7A] pointer-events-none" />
            <input
              required
              value={form.destination}
              onChange={update('destination')}
              placeholder="Drop-off location..."
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Departure time</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="datetime-local"
              value={form.departure_time}
              onChange={update('departure_time')}
              className={`${inputCls} pl-9`}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Available Seats</label>
          <div className="flex items-center gap-3 bg-secondary rounded-xl border border-border px-4 py-3">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm flex-1 text-foreground">Passenger seats</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSeats(Number(form.available_seats) - 1)}
                className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-bold w-4 text-center">{form.available_seats}</span>
              <button
                type="button"
                onClick={() => setSeats(Number(form.available_seats) + 1)}
                className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Miles</label>
            <input type="number" step="0.1" value={form.distance_miles} onChange={update('distance_miles')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Minutes</label>
            <input type="number" value={form.estimated_minutes} onChange={update('estimated_minutes')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Gas $</label>
            <input type="number" step="0.01" value={form.cost_estimate} onChange={update('cost_estimate')} className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={update('notes')}
            placeholder="Anything passengers should know?"
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        <div className="flex items-center justify-between bg-secondary rounded-xl border border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <Repeat2 className="w-4 h-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">Recurring Ride</p>
              <p className="text-xs text-muted-foreground">Repeat same route weekly</p>
            </div>
          </div>
          <Toggle on={form.is_recurring} onToggle={() => setForm((f) => ({ ...f, is_recurring: !f.is_recurring }))} />
        </div>

        {form.is_recurring && (
          <div>
            <label className={labelCls}>Days (e.g. MON,TUE,WED,THU,FRI)</label>
            <input value={form.recurrence_rule} onChange={update('recurrence_rule')} className={inputCls} />
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-2xl py-4 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? 'Posting...' : 'Post ride'}
        </button>
      </form>
    </div>
  );
}
