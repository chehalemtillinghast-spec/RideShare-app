import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapPin, Navigation, Calendar, Users, Minus, Plus, Repeat2 } from 'lucide-react';
import { api } from '../api';
import LocationInput from '../components/LocationInput';

function toLocalInputValue(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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

const labelCls = 'text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1';
const inputCls =
  'w-full h-[38px] px-3.5 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

export default function PostRide() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
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
    recurrence_frequency: '',
    recurrence_rule: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRide, setLoadingRide] = useState(isEdit);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/rides/${id}`).then((ride) => {
      setForm({
        creator_role: ride.creator_role,
        origin: ride.origin,
        destination: ride.destination,
        departure_time: toLocalInputValue(ride.departure_time),
        available_seats: ride.available_seats,
        distance_miles: ride.distance_miles ?? '',
        estimated_minutes: ride.estimated_minutes ?? '',
        cost_estimate: ride.cost_estimate ?? '',
        notes: ride.notes || '',
        is_recurring: ride.is_recurring,
        recurrence_frequency: ride.recurrence_frequency || '',
        recurrence_rule: ride.recurrence_rule || '',
      });
      setLoadingRide(false);
    }).catch((err) => {
      setError(err.message);
      setLoadingRide(false);
    });
  }, [id, isEdit]);

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
      const departure_time = form.departure_time ? new Date(form.departure_time).toISOString() : null;
      if (isEdit) {
        await api.patch(`/rides/${id}`, { ...form, departure_time });
        navigate(`/rides/${id}`);
      } else {
        const ride = await api.post('/rides', {
          ...form,
          departure_time,
          ride_type: 'posted',
          event_id: eventId ? Number(eventId) : undefined,
        });
        navigate(`/rides/${ride.id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingRide) return <div className="px-4 pt-8 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-1.5 pb-0.5">
        <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {isEdit ? 'Edit ride' : 'Post a ride'}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="flex-1 px-4 pb-1 space-y-2.5">
        <div>
          <label className={labelCls}>I am the...</label>
          <select value={form.creator_role} onChange={update('creator_role')} className={inputCls}>
            <option value="driver">Driver offering a ride</option>
            <option value="rider">Rider looking for a ride</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <LocationInput
            icon={MapPin}
            iconClassName="text-accent"
            required
            value={form.origin}
            onChange={(v) => setForm((f) => ({ ...f, origin: v }))}
            placeholder="Pickup..."
          />

          <LocationInput
            icon={Navigation}
            iconClassName="text-[#2E8B7A]"
            required
            value={form.destination}
            onChange={(v) => setForm((f) => ({ ...f, destination: v }))}
            placeholder="Drop-off..."
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className={labelCls}>Departure time</label>
            <div className="relative min-w-0">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <input
                type="datetime-local"
                value={form.departure_time}
                onChange={update('departure_time')}
                className={`${inputCls} pl-8 min-w-0`}
              />
            </div>
          </div>

          <div className="min-w-0">
            <label className={labelCls}>Seats</label>
            <div className="flex items-center justify-between gap-1 bg-secondary rounded-xl border border-border px-2.5 py-1">
              <button
                type="button"
                onClick={() => setSeats(Number(form.available_seats) - 1)}
                className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-colors shrink-0"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-base font-bold flex items-center gap-1 text-foreground">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                {form.available_seats}
              </span>
              <button
                type="button"
                onClick={() => setSeats(Number(form.available_seats) + 1)}
                className="w-7 h-7 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent hover:border-accent hover:text-white transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <input
            type="number"
            step="0.1"
            placeholder="Miles"
            value={form.distance_miles}
            onChange={update('distance_miles')}
            className={inputCls}
          />
          <input
            type="number"
            placeholder="Minutes/Hours"
            value={form.estimated_minutes}
            onChange={update('estimated_minutes')}
            className={inputCls}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Gas $"
            value={form.cost_estimate}
            onChange={update('cost_estimate')}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            value={form.notes}
            onChange={update('notes')}
            placeholder="Anything passengers should know?"
            rows={2}
            className={`${inputCls} h-auto py-1 resize-none`}
          />
        </div>

        <div className="flex items-center justify-between bg-secondary rounded-xl border border-border px-3 py-1">
          <div className="flex items-center gap-2.5">
            <Repeat2 className="w-4 h-4 text-muted-foreground shrink-0" />
            <div>
              <p className="text-sm font-semibold text-foreground leading-tight">Recurring Ride</p>
              <p className="text-[11px] text-muted-foreground leading-tight">Repeat this route on a schedule</p>
            </div>
          </div>
          <Toggle
            on={form.is_recurring}
            onToggle={() =>
              setForm((f) => ({
                ...f,
                is_recurring: !f.is_recurring,
                recurrence_frequency: f.is_recurring ? '' : 'weekly',
              }))
            }
          />
        </div>

        {form.is_recurring && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={`${labelCls} whitespace-nowrap`}>Repeats</label>
              <select value={form.recurrence_frequency} onChange={update('recurrence_frequency')} className={inputCls}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {form.recurrence_frequency === 'weekly' && (
              <div>
                <label className={`${labelCls} whitespace-nowrap`}>Days</label>
                <input
                  value={form.recurrence_rule}
                  onChange={update('recurrence_rule')}
                  placeholder="Mon, Tue..."
                  className={inputCls}
                />
              </div>
            )}
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-2xl py-2 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? (isEdit ? 'Saving...' : 'Posting...') : isEdit ? 'Save changes' : 'Post ride'}
        </button>
      </form>
    </div>
  );
}
