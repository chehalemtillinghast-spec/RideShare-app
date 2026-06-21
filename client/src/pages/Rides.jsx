import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/rides?ride_type=posted&status=open').then(setRides).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="page">
      <h1>Posted rides</h1>
      <Link className="btn" to="/rides/new">Post a ride</Link>
      {error && <p className="error">{error}</p>}
      <div style={{ marginTop: 16 }}>
        {rides.length === 0 && <p className="muted">No open rides yet. Be the first to post one!</p>}
        {rides.map((ride) => (
          <Link key={ride.id} to={`/rides/${ride.id}`} style={{ display: 'block' }}>
            <div className="card">
              <h3>{ride.origin} → {ride.destination}</h3>
              <p className="muted">
                {ride.creator_role === 'driver' ? 'Driver' : 'Rider'}: {ride.creator_name}{' '}
                {ride.creator_verification === 'verified' && <span className="badge">Verified</span>}
              </p>
              {ride.departure_time && <p className="muted">Departs {new Date(ride.departure_time).toLocaleString()}</p>}
              <p className="muted">
                {ride.distance_miles ? `${ride.distance_miles} mi` : ''}
                {ride.estimated_minutes ? ` · ~${ride.estimated_minutes} min` : ''}
                {ride.cost_estimate ? ` · ~$${ride.cost_estimate} gas` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
