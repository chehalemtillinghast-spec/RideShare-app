import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`).then(setEvent).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!event) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <h1>{event.title}</h1>
      <p className="muted">{new Date(event.start_time).toLocaleString()} {event.location && `· ${event.location}`}</p>
      <p>{event.description}</p>
      <button className="btn" onClick={() => navigate(`/rides/new?event_id=${id}`)}>Post a ride to this event</button>
      <h2>Rides to this event</h2>
      {event.rides.length === 0 && <p className="muted">No rides posted yet.</p>}
      {event.rides.map((r) => (
        <Link key={r.id} to={`/rides/${r.id}`} style={{ display: 'block' }}>
          <div className="card">
            <h3>{r.origin} → {r.destination}</h3>
            <p className="muted">{r.creator_name} · {r.status}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
