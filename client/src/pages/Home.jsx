import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Calendar, History, Flag } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { onSocketEvent } from '../socket';
import { Avatar, Toggle } from '../components/primitives';
import RideCard from '../components/RideCard';

function DesignatedDriversCard() {
  const { user, refresh } = useAuth();
  const [drivers, setDrivers] = useState([]);

  function load() {
    api.get('/users/drivers/available').then(setDrivers).catch(() => {});
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('drivers:changed', load), []);

  async function toggleAvailable() {
    await api.post('/users/me/driver-availability', { available: !user.driver_available });
    await refresh();
    load();
  }

  return (
    <div className="bg-card rounded-2xl p-4 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bold text-sm text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Designated Drivers</p>
          <p className="text-xs text-muted-foreground">On call for the community</p>
        </div>
        <Toggle on={!!user.driver_available} onToggle={toggleAvailable} />
      </div>
      {drivers.length === 0 ? (
        <p className="text-xs text-muted-foreground">No drivers available right now.</p>
      ) : (
        <div className="flex gap-3 flex-wrap">
          {drivers.map((d) => (
            <Link key={d.id} to={`/users/${d.id}`} className="flex flex-col items-center gap-1">
              <div className="relative">
                <Avatar name={d.full_name} size="sm" color="teal" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
              </div>
              <span className="text-[10px] text-muted-foreground font-medium">{d.full_name.split(' ')[0]}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);

  function load() {
    api.get('/rides?ride_type=posted&status=open').then(setRides).catch(() => {});
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('rides:changed', load), []);

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-5 pb-3">
        <h1 className="text-[26px] font-black text-foreground leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Hi, {user.full_name.split(' ')[0]}
        </h1>
      </div>

      <div className="flex-1 px-4 pb-4 space-y-3">
        <DesignatedDriversCard />

        <Link
          to="/rides/new"
          className="w-full bg-accent text-white rounded-2xl p-4 flex items-center justify-between shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="font-bold text-sm" style={{ fontFamily: 'var(--font-display)' }}>Post a Ride</p>
              <p className="text-xs opacity-80">Share your route with neighbors</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 opacity-70" />
        </Link>

        <div className="grid grid-cols-3 gap-2">
          <Link to="/events" className="bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col items-center gap-1.5 text-center hover:shadow-md transition-shadow">
            <Calendar className="w-4 h-4 text-accent" />
            <span className="text-[11px] font-bold text-foreground">Events</span>
          </Link>
          <Link to="/history" className="bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col items-center gap-1.5 text-center hover:shadow-md transition-shadow">
            <History className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-bold text-foreground">My Rides</span>
          </Link>
          <Link to="/flag" className="bg-card rounded-2xl p-3 border border-border shadow-sm flex flex-col items-center gap-1.5 text-center hover:shadow-md transition-shadow">
            <Flag className="w-4 h-4 text-muted-foreground" />
            <span className="text-[11px] font-bold text-foreground">Report</span>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-base text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Rides Today</h2>
            <Link to="/rides" className="text-xs font-semibold text-accent hover:opacity-70 transition-opacity">See all</Link>
          </div>
          {rides.length === 0 ? (
            <div className="bg-card rounded-2xl p-5 border border-border text-center">
              <p className="text-sm text-muted-foreground">No open rides yet. Be the first to post one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rides.slice(0, 5).map((ride) => (
                <RideCard key={ride.id} ride={ride} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
