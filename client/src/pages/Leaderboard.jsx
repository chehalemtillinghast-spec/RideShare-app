import { useEffect, useState } from 'react';
import { api } from '../api';

function Rank({ list }) {
  if (list.length === 0) return <p className="muted">No rides yet in this period.</p>;
  return (
    <div>
      {list.map((person, i) => (
        <div key={person.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>#{i + 1} {person.full_name}</strong>{' '}
            {person.verification_status === 'verified' && <span className="badge">Verified</span>}
          </div>
          <div className="muted">
            {person.rides_offered} offered · {person.rides_taken} taken
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
    <div className="page">
      <h1>Leaderboard</h1>
      <p className="muted">Top neighbors keeping our town moving.</p>
      {error && <p className="error">{error}</p>}
      <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
        <button className={`btn ${period === 'weekly' ? '' : 'secondary'}`} onClick={() => setPeriod('weekly')}>This week</button>
        <button className={`btn ${period === 'all_time' ? '' : 'secondary'}`} onClick={() => setPeriod('all_time')}>All-time</button>
      </div>
      {data && <Rank list={period === 'weekly' ? data.weekly : data.all_time} />}
    </div>
  );
}
