import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function DesignatedDriver() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [request, setRequest] = useState({ origin: '', destination: '', notes: '' });

  useEffect(() => {
    api.get('/users/drivers/available').then(setDrivers).catch((e) => setError(e.message));
  }, []);

  async function toggleAvailable() {
    await api.post('/users/me/driver-availability', { available: !user.driver_available });
    await refresh();
  }

  async function requestDriver(driverId) {
    try {
      const result = await api.post('/rides/instant-request', { driver_id: driverId, ...request });
      navigate(`/rides/${result.ride.id}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>Designated driver</h1>
      <div className="card">
        <h2>Your availability</h2>
        <p className="muted">Toggle this on when you're available to give rides right now.</p>
        <button className="btn" onClick={toggleAvailable}>
          {user.driver_available ? 'Go offline' : 'Go available as a designated driver'}
        </button>
      </div>

      <h2>Available drivers nearby</h2>
      {error && <p className="error">{error}</p>}
      <div className="field">
        <label>Pickup location</label>
        <input value={request.origin} onChange={(e) => setRequest({ ...request, origin: e.target.value })} />
      </div>
      <div className="field">
        <label>Destination</label>
        <input value={request.destination} onChange={(e) => setRequest({ ...request, destination: e.target.value })} />
      </div>
      <div className="field">
        <label>Notes</label>
        <input value={request.notes} onChange={(e) => setRequest({ ...request, notes: e.target.value })} />
      </div>
      {drivers.filter((d) => d.id !== user.id).length === 0 && <p className="muted">No drivers available right now.</p>}
      {drivers.filter((d) => d.id !== user.id).map((d) => (
        <div key={d.id} className="card">
          <h3>{d.full_name} {d.verification_status === 'verified' && <span className="badge">Verified</span>}</h3>
          <p className="muted">{d.bio}</p>
          <button
            className="btn"
            disabled={!request.origin || !request.destination}
            onClick={() => requestDriver(d.id)}
          >
            Request ride now
          </button>
        </div>
      ))}
    </div>
  );
}
