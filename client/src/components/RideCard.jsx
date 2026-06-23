import { Link } from 'react-router-dom';
import { MapPin, Navigation, Users } from 'lucide-react';
import { Avatar, Verified, Stars } from './primitives';

export default function RideCard({ ride }) {
  return (
    <Link
      to={`/rides/${ride.id}`}
      className="block w-full bg-card rounded-2xl p-4 shadow-sm border border-border text-left hover:shadow-md active:scale-[0.985] transition-all duration-150"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 min-w-0">
          <Avatar name={ride.creator_name} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-foreground">{ride.creator_name}</span>
              {ride.creator_verification === 'verified' && <Verified sm />}
              <Stars rating={ride.creator_rating} />
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
