import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Navigation, Clock, Users, MessageCircle, BadgeCheck } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { onSocketEvent } from '../socket';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const btnPrimary =
  'bg-accent text-white rounded-2xl py-3.5 px-5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150';
const btnSecondary =
  'bg-secondary text-foreground rounded-2xl py-3.5 px-5 font-bold text-sm border border-border hover:bg-muted transition-colors';

function StatusBadge({ status }) {
  return (
    <span className="text-xs font-bold text-accent bg-accent/10 px-2.5 py-1 rounded-full capitalize">{status}</span>
  );
}

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

  useEffect(() => {
    const offUpdated = onSocketEvent('ride:updated', (e) => { if (String(e.rideId) === id) load(); });
    const offChanged = onSocketEvent('rides:changed', (e) => { if (String(e.rideId) === id) load(); });
    const offReqNew = onSocketEvent('ride:request:new', (e) => { if (String(e.rideId) === id) load(); });
    const offReqUpdated = onSocketEvent('ride:request:updated', (e) => { if (String(e.rideId) === id) load(); });
    return () => { offUpdated(); offChanged(); offReqNew(); offReqUpdated(); };
  }, [id]);

  if (error) return <div className="px-4 pt-8"><p className="text-sm text-destructive">{error}</p></div>;
  if (!ride) return <div className="px-4 pt-8 text-sm text-muted-foreground">Loading...</div>;

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
    <div className="flex flex-col bg-background min-h-[calc(100vh-56px)]">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          {ride.origin} → {ride.destination}
        </h1>
        <div className="flex items-center gap-1.5 mt-1">
          <p className="text-sm text-muted-foreground">
            Posted by {ride.creator_name} as {ride.creator_role}
          </p>
          {ride.creator_verification === 'verified' && (
            <BadgeCheck className="w-3.5 h-3.5 text-[#2E8B7A]" strokeWidth={2.5} />
          )}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-4">
        <div className={cardCls}>
          <div className="flex items-center gap-2 mb-3">
            <StatusBadge status={ride.status} />
          </div>
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center gap-1 mt-0.5 shrink-0">
              <div className="w-3 h-3 bg-accent rounded-full" />
              <div className="w-0.5 h-7 bg-muted" />
              <div className="w-3 h-3 bg-[#2E8B7A] rounded-full" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Pickup</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" /> {ride.origin}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Drop-off</p>
                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#2E8B7A] shrink-0" /> {ride.destination}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 pt-3 mt-3 border-t border-border">
            {ride.departure_time && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(ride.departure_time).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span>{ride.available_seats} seats open</span>
            </div>
          </div>
          {ride.distance_miles && (
            <p className="text-xs text-muted-foreground mt-2">
              {ride.distance_miles} mi · ~{ride.estimated_minutes} min
              {ride.cost_estimate ? ` · ~$${ride.cost_estimate} gas` : ''}
            </p>
          )}
          {ride.notes && <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{ride.notes}</p>}
        </div>

        {!isOwner && !myRequest && ride.status === 'open' && (
          <div className="space-y-2">
            <button onClick={requestRide} className={`w-full ${btnPrimary}`} style={{ fontFamily: 'var(--font-display)' }}>
              {ride.creator_role === 'driver' ? 'Connect with this driver' : 'Connect with this rider'}
            </button>
            <p className="text-xs text-center text-muted-foreground leading-relaxed">
              This sends a request and opens up messaging — {ride.creator_role === 'driver' ? 'the driver' : 'the rider'} can
              chat with you before deciding.
            </p>
          </div>
        )}
        {myRequest && (
          <p className="text-sm text-muted-foreground">
            Your request status: <span className="font-semibold text-foreground capitalize">{myRequest.status}</span>
          </p>
        )}

        {isOwner && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-display)' }}>Connection requests</h3>
            {ride.requests.length === 0 && <p className="text-sm text-muted-foreground">No requests yet.</p>}
            <div className="space-y-3">
              {ride.requests.map((r) => (
                <div key={r.id} className="border border-border rounded-xl p-3">
                  <p className="text-sm text-foreground">
                    {r.requester_name} — seats: {r.seats_requested} — <span className="font-bold capitalize">{r.status}</span>
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {r.status === 'pending' && (
                      <>
                        <button onClick={() => respond(r.id, 'accepted')} className="text-xs font-bold text-white bg-accent rounded-full px-3 py-1.5 hover:bg-accent/90 transition-colors">
                          Accept
                        </button>
                        <button onClick={() => respond(r.id, 'declined')} className="text-xs font-bold text-foreground bg-secondary rounded-full px-3 py-1.5 hover:bg-muted transition-colors">
                          Decline
                        </button>
                      </>
                    )}
                    <Link to={`/messages?with=${r.requester_id}&ride_id=${ride.id}`} className="text-xs font-bold text-accent hover:opacity-70 transition-opacity">
                      Message
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {otherPartyId && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-display)' }}>After the ride</h3>
            <Link
              to={`/messages?with=${otherPartyId}&ride_id=${ride.id}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:opacity-70 transition-opacity mb-4"
            >
              <MessageCircle className="w-4 h-4" /> Message the other rider
            </Link>

            <div className="space-y-2 mb-4">
              <label className={labelCls}>Rate them</label>
              <div className="flex gap-2">
                <select value={rateScore} onChange={(e) => setRateScore(e.target.value)} className={inputCls}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
                </select>
              </div>
              <input
                placeholder="Comment (optional)"
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                className={inputCls}
              />
              <button onClick={() => submitRating(otherPartyId)} className={`w-full ${btnSecondary}`}>
                Submit rating
              </button>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>Record gas money / split paid</label>
              <input
                type="number"
                step="0.01"
                placeholder="$"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputCls}
              />
              <button onClick={() => recordPayment(otherPartyId)} className={`w-full ${btnSecondary}`}>
                Record payment
              </button>
            </div>
          </div>
        )}

        <Link
          to={`/flag?ride_id=${ride.id}&reported_user_id=${otherPartyId || ride.creator_id}`}
          className="block text-center text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          Report a problem with this ride
        </Link>
      </div>
    </div>
  );
}
