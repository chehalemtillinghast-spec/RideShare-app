import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { onSocketEvent } from '../socket';

export default function History() {
  const [rides, setRides] = useState([]);

  function load() {
    api.get('/rides/mine').then(setRides);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('rides:changed', load), []);

  return (
    <div className="page">
      <h1>My rides</h1>
      <p className="muted">Rides you've posted or offered.</p>
      {rides.length === 0 && <p className="muted">You haven't posted any rides yet.</p>}
      {rides.map((r) => (
        <Link key={r.id} to={`/rides/${r.id}`} style={{ display: 'block' }}>
          <div className="card">
            <h3>{r.origin} → {r.destination}</h3>
            <p className="muted">{r.status} · {r.ride_type} · {new Date(r.created_at).toLocaleDateString()}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
