import { useEffect, useState } from 'react';
import { BadgeCheck, Trophy, Car } from 'lucide-react';
import { api } from '../api';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function total(person) {
  return person.rides_offered + person.rides_taken;
}

function PodiumSpot({ person, place }) {
  const sizes = {
    1: { avatar: 'w-14 h-14 text-base', block: 'h-14', text: 'text-base', name: 'text-xs font-black' },
    2: { avatar: 'w-10 h-10 text-sm', block: 'h-10', text: 'text-sm', name: 'text-xs font-bold' },
    3: { avatar: 'w-10 h-10 text-sm', block: 'h-7', text: 'text-sm', name: 'text-xs font-bold' },
  }[place];
  const blockColor = { 1: 'bg-amber-400', 2: 'bg-slate-300', 3: 'bg-amber-700/50' }[place];
  const textColor = { 1: 'text-white', 2: 'text-slate-600', 3: 'text-white' }[place];
  const avatarColor = place === 1 ? 'bg-accent text-accent-foreground' : 'bg-primary text-primary-foreground';

  return (
    <div className={`flex flex-col items-center gap-1.5 ${place === 1 ? '-mb-2' : place === 3 ? 'mb-4' : ''}`}>
      {place === 1 && <Trophy className="w-5 h-5 text-amber-500 mb-0.5" />}
      <div className={`${sizes.avatar} ${avatarColor} rounded-full flex items-center justify-center font-bold shrink-0`}>
        {initials(person.full_name)}
      </div>
      <div className="flex items-center gap-1">
        <p className={`${sizes.name} text-foreground`}>{person.full_name.split(' ')[0]}</p>
        {person.verification_status === 'verified' && <BadgeCheck className="w-3 h-3 text-[#2E8B7A]" strokeWidth={2.5} />}
      </div>
      <p className="text-[10px] text-muted-foreground">{total(person)} rides</p>
      <div className={`w-16 ${sizes.block} ${blockColor} rounded-t-lg flex items-center justify-center shadow-inner`}>
        <span className={`${sizes.text} font-black ${textColor}`}>{place}</span>
      </div>
    </div>
  );
}

function Rank({ list }) {
  if (list.length === 0) return <p className="text-sm text-muted-foreground">No rides yet in this period.</p>;

  const podium = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="space-y-3">
      {podium.length > 0 && (
        <div className="bg-gradient-to-b from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200/60">
          <div className="flex items-end justify-center gap-5">
            {podium[1] && <PodiumSpot person={podium[1]} place={2} />}
            {podium[0] && <PodiumSpot person={podium[0]} place={1} />}
            {podium[2] && <PodiumSpot person={podium[2]} place={3} />}
          </div>
        </div>
      )}

      {rest.map((person, i) => (
        <div key={person.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3">
          <span className="text-sm font-black text-muted-foreground w-6 shrink-0">#{i + 4}</span>
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
            {initials(person.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-foreground truncate">{person.full_name}</span>
              {person.verification_status === 'verified' && <BadgeCheck className="w-3.5 h-3.5 text-[#2E8B7A]" strokeWidth={2.5} />}
            </div>
            <p className="text-xs text-muted-foreground">{person.rides_offered} offered · {person.rides_taken} taken</p>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5 shrink-0">
            <Car className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{total(person)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('weekly');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/leaderboard').then(setData).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Leaderboard
        </h1>
        <p className="text-sm text-muted-foreground">Top neighbors keeping our town moving.</p>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('weekly')}
            className={`text-xs font-bold px-3.5 py-2 rounded-full transition-colors ${
              period === 'weekly' ? 'bg-accent text-white' : 'bg-secondary text-foreground hover:bg-muted'
            }`}
          >
            This week
          </button>
          <button
            onClick={() => setPeriod('all_time')}
            className={`text-xs font-bold px-3.5 py-2 rounded-full transition-colors ${
              period === 'all_time' ? 'bg-accent text-white' : 'bg-secondary text-foreground hover:bg-muted'
            }`}
          >
            All-time
          </button>
        </div>

        {data && <Rank list={period === 'weekly' ? data.weekly : data.all_time} />}
      </div>
    </div>
  );
}
