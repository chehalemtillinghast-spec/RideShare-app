import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api';

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
    <div className="page">
      <h1>Post a ride</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>I am the...</label>
          <select value={form.creator_role} onChange={update('creator_role')}>
            <option value="driver">Driver offering a ride</option>
            <option value="rider">Rider looking for a ride</option>
          </select>
        </div>
        <div className="field">
          <label>From</label>
          <input required value={form.origin} onChange={update('origin')} />
        </div>
        <div className="field">
          <label>To</label>
          <input required value={form.destination} onChange={update('destination')} />
        </div>
        <div className="field">
          <label>Departure time</label>
          <input type="datetime-local" value={form.departure_time} onChange={update('departure_time')} />
        </div>
        <div className="field">
          <label>Available seats</label>
          <input type="number" min="1" value={form.available_seats} onChange={update('available_seats')} />
        </div>
        <div className="field">
          <label>Distance (miles)</label>
          <input type="number" step="0.1" value={form.distance_miles} onChange={update('distance_miles')} />
        </div>
        <div className="field">
          <label>Estimated time (minutes)</label>
          <input type="number" value={form.estimated_minutes} onChange={update('estimated_minutes')} />
        </div>
        <div className="field">
          <label>Gas money / cost estimate ($)</label>
          <input type="number" step="0.01" value={form.cost_estimate} onChange={update('cost_estimate')} />
        </div>
        <div className="field">
          <label>Notes</label>
          <textarea value={form.notes} onChange={update('notes')} />
        </div>
        <div className="field">
          <label>
            <input type="checkbox" checked={form.is_recurring} onChange={update('is_recurring')} /> This is a recurring ride
          </label>
        </div>
        {form.is_recurring && (
          <div className="field">
            <label>Days (e.g. MON,TUE,WED,THU,FRI)</label>
            <input value={form.recurrence_rule} onChange={update('recurrence_rule')} />
          </div>
        )}
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>{loading ? 'Posting...' : 'Post ride'}</button>
      </form>
    </div>
  );
}
