import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Navigation, Users, Plus, ArrowRight, BadgeCheck } from 'lucide-react';
import { api } from '../api';
import { onSocketEvent } from '../socket';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function RideCard({ ride }) {
  return (
    <Link
      to={`/rides/${ride.id}`}
      className="block w-full bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:shadow-md active:scale-[0.985] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
            {initials(ride.creator_name)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{ride.creator_name}</span>
              {ride.creator_verification === 'verified' && (
                <BadgeCheck className="w-4 h-4 text-[#2E8B7A]" strokeWidth={2.5} />
              )}
              <span className="text-[11px] text-muted-foreground">
                {ride.creator_role === 'driver' ? 'Driver' : 'Rider'}
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3 text-accent shrink-0" />
                <span className="truncate">{ride.origin}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                <Navigation className="w-3 h-3 text-[#2E8B7A] shrink-0" />
                <span className="truncate">{ride.destination}</span>
              </div>
            </div>
            {(ride.distance_miles || ride.estimated_minutes || ride.cost_estimate) && (
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {ride.distance_miles ? `${ride.distance_miles} mi` : ''}
                {ride.estimated_minutes ? ` · ~${ride.estimated_minutes} min` : ''}
                {ride.cost_estimate ? ` · ~$${ride.cost_estimate} gas` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          {ride.departure_time && (
            <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full">
              {new Date(ride.departure_time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </span>
          )}
          {ride.available_seats != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3 h-3" />
              <span>{ride.available_seats} seats</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

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
