import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { onSocketEvent } from '../socket';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

export default function DesignatedDriver() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState('');
  const [request, setRequest] = useState({ origin: '', destination: '', notes: '' });

  function loadDrivers() {
    api.get('/users/drivers/available').then(setDrivers).catch((e) => setError(e.message));
  }

  useEffect(() => { loadDrivers(); }, []);
  useEffect(() => onSocketEvent('drivers:changed', loadDrivers), []);

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

  const otherDrivers = drivers.filter((d) => d.id !== user.id);
  const canRequest = request.origin && request.destination;

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Designated driver
        </h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        <div className={cardCls}>
          <h3 className="font-bold text-sm mb-1" style={{ fontFamily: 'var(--font-display)' }}>Your availability</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Toggle this on when you're available to give rides right now.
          </p>
          <button
            onClick={toggleAvailable}
            className="w-full bg-accent text-white rounded-2xl py-3 font-bold text-sm shadow-md hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {user.driver_available ? 'Go offline' : 'Go available as a designated driver'}
          </button>
        </div>

        <div>
          <h2 className="font-bold text-base text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Available drivers nearby
          </h2>
          {error && <p className="text-sm text-destructive mb-3">{error}</p>}

          <div className="space-y-3 mb-4">
            <div>
              <label className={labelCls}>Pickup location</label>
              <input value={request.origin} onChange={(e) => setRequest({ ...request, origin: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Destination</label>
              <input value={request.destination} onChange={(e) => setRequest({ ...request, destination: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Notes</label>
              <input value={request.notes} onChange={(e) => setRequest({ ...request, notes: e.target.value })} className={inputCls} />
            </div>
          </div>

          {otherDrivers.length === 0 && (
            <p className="text-sm text-muted-foreground">No drivers available right now.</p>
          )}

          <div className="space-y-3">
            {otherDrivers.map((d) => (
              <div key={d.id} className={cardCls}>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-foreground">{d.full_name}</h3>
                  {d.verification_status === 'verified' && <BadgeCheck className="w-3.5 h-3.5 text-[#2E8B7A]" strokeWidth={2.5} />}
                </div>
                {d.bio && <p className="text-xs text-muted-foreground mt-1">{d.bio}</p>}
                <button
                  disabled={!canRequest}
                  onClick={() => requestDriver(d.id)}
                  className="w-full mt-3 bg-accent text-white rounded-xl py-2.5 font-bold text-sm hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-40 disabled:active:scale-100"
                >
                  Request ride now
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
