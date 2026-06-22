import { useEffect, useState } from 'react';
import { BadgeCheck, Car } from 'lucide-react';
import { api } from '../api';

function initials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
}

function Rank({ list }) {
  if (list.length === 0) return <p className="text-sm text-muted-foreground">No rides yet in this period.</p>;
  return (
    <div className="space-y-3">
      {list.map((person, i) => (
        <div key={person.id} className="bg-card rounded-2xl p-4 border border-border shadow-sm flex items-center gap-3">
          <span className="text-sm font-black text-muted-foreground w-6 shrink-0">#{i + 1}</span>
          <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0">
            {initials(person.full_name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-foreground truncate">{person.full_name}</span>
              {person.verification_status === 'verified' && <BadgeCheck className="w-3.5 h-3.5 text-[#2E8B7A]" strokeWidth={2.5} />}
            </div>
          </div>
          <div className="flex items-center gap-1.5 bg-secondary rounded-full px-3 py-1.5 shrink-0">
            <Car className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs font-bold text-foreground">{person.rides_offered} offered · {person.rides_taken} taken</span>
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
