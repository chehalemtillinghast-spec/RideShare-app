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
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          My rides
        </h1>
        <p className="text-sm text-muted-foreground">Rides you've posted or offered.</p>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {rides.length === 0 && <p className="text-sm text-muted-foreground">You haven't posted any rides yet.</p>}
        {rides.map((r) => (
          <Link
            key={r.id}
            to={`/rides/${r.id}`}
            className="block bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md active:scale-[0.985] transition-all duration-150"
          >
            <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
              {r.origin} → {r.destination}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              {r.status} · {r.ride_type} · {new Date(r.created_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
