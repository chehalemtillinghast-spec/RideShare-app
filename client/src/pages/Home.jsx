import { Link } from 'react-router-dom';
import { Car, Plus, Shield, Calendar, History, ArrowRight } from 'lucide-react';
import { useAuth } from '../AuthContext';

function ActionCard({ to, icon: Icon, title, subtitle }) {
  return (
    <Link
      to={to}
      className="w-full bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center justify-between gap-3 hover:shadow-md active:scale-[0.985] transition-all duration-150"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <div className="text-left min-w-0">
          <p className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
            {title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
}

export default function Home() {
  const { user } = useAuth();
  const firstName = user.full_name.split(' ')[0];

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          Town Rides
        </p>
        <h1
          className="text-[26px] font-black text-foreground leading-tight"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Hi, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">What would you like to do?</p>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        <Link
          to="/rides/new"
          className="w-full bg-accent text-white rounded-2xl p-4 flex items-center justify-between shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>
                Post a Ride
              </p>
              <p className="text-xs opacity-80">Share your route with neighbors</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 opacity-70" />
        </Link>

        <div className="space-y-3">
          <ActionCard to="/rides" icon={Car} title="Browse posted rides" subtitle="See who's heading your way" />
          <ActionCard to="/driver" icon={Shield} title="Designated driver" subtitle="Request an on-call ride home" />
          <ActionCard to="/events" icon={Calendar} title="Community events" subtitle="Find a ride to what's happening" />
          <ActionCard to="/history" icon={History} title="My ride history" subtitle="Past rides you've given or taken" />
        </div>
      </div>
    </div>
  );
}
