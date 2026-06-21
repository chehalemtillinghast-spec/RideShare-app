import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function RideDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [ride, setRide] = useState(null);
  const [error, setError] = useState('');
  const [rateScore, setRateScore] = useState(5);
  const [rateComment, setRateComment] = useState('');
  const [amount, setAmount] = useState('');

  async function load() {
    try {
      const data = await api.get(`/rides/${id}`);
      setRide(data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => { load(); }, [id]);

  if (error) return <div className="page"><p className="error">{error}</p></div>;
  if (!ride) return <div className="page">Loading...</div>;

  const isOwner = ride.creator_id === user.id;
  const myRequest = ride.requests?.find((r) => r.requester_id === user.id);
  const otherPartyId = isOwner ? myRequest?.requester_id : ride.creator_id;

  async function requestRide() {
    await api.post(`/rides/${id}/requests`, { seats_requested: 1 });
    load();
  }

  async function respond(requestId, status) {
    await api.patch(`/rides/${id}/requests/${requestId}`, { status });
    load();
  }

  async function submitRating(rateeId) {
    await api.post('/ratings', { ride_id: ride.id, ratee_id: rateeId, score: Number(rateScore), comment: rateComment });
    alert('Rating submitted.');
  }

  async function recordPayment(payeeId) {
    if (!amount) return;
    await api.post('/payments', { ride_id: ride.id, payee_id: payeeId, amount: Number(amount) });
    setAmount('');
    alert('Payment recorded.');
  }

  return (
    <div className="page">
      <h1>{ride.origin} → {ride.destination}</h1>
      <p className="muted">
        Posted by {ride.creator_name} as {ride.creator_role}
        {ride.creator_verification === 'verified' && <span className="badge" style={{ marginLeft: 6 }}>Verified</span>}
      </p>
      <p><span className="badge">{ride.status}</span></p>
      {ride.departure_time && <p>Departs: {new Date(ride.departure_time).toLocaleString()}</p>}
      <p>Seats available: {ride.available_seats}</p>
      {ride.distance_miles && <p>Distance: {ride.distance_miles} mi · ~{ride.estimated_minutes} min</p>}
      {ride.cost_estimate && <p>Estimated cost: ${ride.cost_estimate}</p>}
      {ride.notes && <p className="muted">{ride.notes}</p>}

      {!isOwner && !myRequest && ride.status === 'open' && (
        <button className="btn" onClick={requestRide}>Request this ride</button>
      )}
      {myRequest && <p className="muted">Your request status: {myRequest.status}</p>}

      {isOwner && (
        <>
          <h2>Requests</h2>
          {ride.requests.length === 0 && <p className="muted">No requests yet.</p>}
          {ride.requests.map((r) => (
            <div key={r.id} className="card">
              <p>{r.requester_name} — seats: {r.seats_requested} — <strong>{r.status}</strong></p>
              {r.status === 'pending' && (
                <>
                  <button className="btn" onClick={() => respond(r.id, 'accepted')}>Accept</button>{' '}
                  <button className="btn secondary" onClick={() => respond(r.id, 'declined')}>Decline</button>
                </>
              )}
              <Link to={`/messages?with=${r.requester_id}&ride_id=${ride.id}`}> Message</Link>
            </div>
          ))}
        </>
      )}

      {otherPartyId && (
        <div className="card">
          <h2>After the ride</h2>
          <Link to={`/messages?with=${otherPartyId}&ride_id=${ride.id}`}>Message the other rider</Link>
          <div style={{ marginTop: 12 }}>
            <label>Rate them: </label>
            <select value={rateScore} onChange={(e) => setRateScore(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <input placeholder="Comment (optional)" value={rateComment} onChange={(e) => setRateComment(e.target.value)} />
            <button className="btn secondary" onClick={() => submitRating(otherPartyId)}>Submit rating</button>
          </div>
          <div style={{ marginTop: 12 }}>
            <label>Record gas money / split paid: </label>
            <input type="number" step="0.01" placeholder="$" value={amount} onChange={(e) => setAmount(e.target.value)} style={{ width: 80 }} />
            <button className="btn secondary" onClick={() => recordPayment(otherPartyId)}>Record payment</button>
          </div>
        </div>
      )}

      <Link to={`/flag?ride_id=${ride.id}&reported_user_id=${otherPartyId || ride.creator_id}`} className="muted">
        Report a problem with this ride
      </Link>
    </div>
  );
}
