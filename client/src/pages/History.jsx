import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function History() {
  const [rides, setRides] = useState([]);

  useEffect(() => {
    api.get('/rides/mine').then(setRides);
  }, []);

  return (
    <div className="page">
      <h1>Your ride history</h1>
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
