import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { onSocketEvent } from '../socket';
import RideCard from '../components/RideCard';

export default function Rides() {
  const [rides, setRides] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.get('/rides?ride_type=posted&status=open').then(setRides).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('rides:changed', load), []);

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Posted rides
        </h1>
        <Link
          to="/rides/new"
          className="w-9 h-9 rounded-full bg-accent text-white flex items-center justify-center hover:bg-accent/90 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {rides.length === 0 && !error && (
          <div className="bg-card rounded-2xl p-5 border border-border text-center">
            <p className="text-sm text-muted-foreground mb-3">No open rides yet. Be the first to post one!</p>
            <Link
              to="/rides/new"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:opacity-70 transition-opacity"
            >
              Post a ride <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {rides.map((ride) => (
          <RideCard key={ride.id} ride={ride} />
        ))}
      </div>
    </div>
  );
}
