import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { api } from '../api';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`).then(setEvent).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="px-4 pt-8"><p className="text-sm text-destructive">{error}</p></div>;
  if (!event) return <div className="px-4 pt-8 text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {event.title}
        </h1>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>{new Date(event.start_time).toLocaleString()}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
            <MapPin className="w-4 h-4 shrink-0" />
            <span>{event.location}</span>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        {event.description && (
          <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
            <p className="text-sm text-foreground leading-relaxed">{event.description}</p>
          </div>
        )}

        <button
          onClick={() => navigate(`/rides/new?event_id=${id}`)}
          className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Post a ride to this event
        </button>

        <div>
          <h2 className="font-bold text-base text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            Rides to this event
          </h2>
          {event.rides.length === 0 && <p className="text-sm text-muted-foreground">No rides posted yet.</p>}
          <div className="space-y-3">
            {event.rides.map((r) => (
              <Link
                key={r.id}
                to={`/rides/${r.id}`}
                className="block bg-card rounded-2xl p-4 border border-border shadow-sm hover:shadow-md active:scale-[0.985] transition-all duration-150"
              >
                <h3 className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  {r.origin} → {r.destination}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 capitalize">{r.creator_name} · {r.status}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
