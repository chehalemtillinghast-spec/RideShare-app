import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { onSocketEvent } from '../socket';
import SwipeToDelete from '../components/SwipeToDelete';

export default function History() {
  const [rides, setRides] = useState([]);

  function load() {
    api.get('/rides/mine').then(setRides);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('rides:changed', load), []);

  async function deleteRide(id) {
    if (!confirm('Delete this ride? This cannot be undone.')) return;
    await api.del(`/rides/${id}`);
    load();
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          My rides
        </h1>
        <p className="text-sm text-muted-foreground">Rides you've posted or offered. Swipe left to delete.</p>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-3">
        {rides.length === 0 && <p className="text-sm text-muted-foreground">You haven't posted any rides yet.</p>}
        {rides.map((r) => (
          <SwipeToDelete key={r.id} onDelete={() => deleteRide(r.id)}>
            <Link
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
          </SwipeToDelete>
        ))}
      </div>
    </div>
  );
}
