import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="page">
      <h1>Hi, {user.full_name.split(' ')[0]}</h1>
      <p className="muted">What would you like to do?</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        <Link className="btn" to="/rides">Browse posted rides</Link>
        <Link className="btn" to="/rides/new">Post a ride</Link>
        <Link className="btn secondary" to="/driver">Designated driver</Link>
        <Link className="btn secondary" to="/events">Community events</Link>
        <Link className="btn secondary" to="/history">My ride history</Link>
      </div>
    </div>
  );
}
