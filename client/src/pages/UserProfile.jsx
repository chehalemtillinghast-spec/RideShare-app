import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Flag, MapPin } from 'lucide-react';
import { api } from '../api';
import { Avatar, Verified, Stars, BackButton } from '../components/primitives';

const cardCls = 'bg-card rounded-2xl p-4 border border-border shadow-sm';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const btnSecondary =
  'bg-secondary text-foreground rounded-2xl py-3 px-4 font-bold text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50';

function RateModal({ profile, sharedRides, onClose }) {
  const [rideId, setRideId] = useState(sharedRides[0]?.id || '');
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      await api.post('/ratings', { ride_id: Number(rideId), ratee_id: profile.id, score: Number(score), comment });
      setDone(true);
      setTimeout(onClose, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-lg text-foreground mb-3" style={{ fontFamily: 'var(--font-display)' }}>
          Rate {profile.full_name}
        </h3>
        {done ? (
          <p className="text-sm text-muted-foreground">Thanks for the feedback!</p>
        ) : (
          <div className="space-y-3">
            {sharedRides.length > 1 && (
              <select value={rideId} onChange={(e) => setRideId(e.target.value)} className={inputCls}>
                {sharedRides.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.origin} → {r.destination}
                  </option>
                ))}
              </select>
            )}
            <select value={score} onChange={(e) => setScore(e.target.value)} className={inputCls}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
            </select>
            <input
              placeholder="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className={inputCls}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button onClick={onClose} className={`flex-1 ${btnSecondary}`}>Cancel</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-accent text-white rounded-2xl py-3 font-bold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit rating'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [sharedRides, setSharedRides] = useState([]);
  const [error, setError] = useState('');
  const [showRate, setShowRate] = useState(false);

  useEffect(() => {
    api.get(`/users/${id}`).then(setProfile).catch((e) => setError(e.message));
    api.get(`/rides/shared/${id}`).then(setSharedRides).catch(() => {});
  }, [id]);

  if (error) return <div className="px-4 pt-8"><p className="text-sm text-destructive">{error}</p></div>;
  if (!profile) return <div className="px-4 pt-8 text-sm text-muted-foreground">Loading...</div>;

  const stats = profile.stats || {};
  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-4 pt-6 pb-3 flex items-center gap-3">
        <BackButton onPress={() => navigate(-1)} />
        <h1 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Profile</h1>
      </div>

      <div className="flex-1 px-4 pb-6 space-y-3">
        <div className={cardCls}>
          <div className="flex items-center gap-4">
            <Avatar name={profile.full_name} size="xl" color="accent" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{profile.full_name}</h2>
                {profile.verification_status === 'verified' && <Verified />}
              </div>
              {memberSince && <p className="text-xs text-muted-foreground">Member since {memberSince}</p>}
              <Stars rating={stats.avg_rating} />
              {profile.driver_available && (
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#2E8B7A]/10 text-[#2E8B7A]">
                  Designated Driver
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
            {[
              { label: 'Offered', value: stats.rides_offered ?? 0 },
              { label: 'Taken', value: stats.rides_taken ?? 0 },
              { label: 'Rating', value: stats.avg_rating ? `${stats.avg_rating}★` : '—' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-accent" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/messages?with=${profile.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white rounded-2xl py-3 font-bold text-sm shadow-md hover:bg-accent/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Message
          </Link>
          <button
            onClick={() => sharedRides.length > 0 && setShowRate(true)}
            disabled={sharedRides.length === 0}
            title={sharedRides.length === 0 ? "You can rate someone after sharing a ride together" : undefined}
            className={`flex-1 ${btnSecondary}`}
          >
            Rate
          </button>
          <Link
            to={`/flag?reported_user_id=${profile.id}`}
            className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors shrink-0"
            title="Report this user"
          >
            <Flag className="w-4 h-4 text-muted-foreground" />
          </Link>
        </div>

        {profile.bio && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>Bio</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {profile.open_rides?.length > 0 && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-display)' }}>Open rides</h3>
            <div className="space-y-2">
              {profile.open_rides.map((r) => (
                <Link key={r.id} to={`/rides/${r.id}`} className="flex items-center gap-2 text-sm text-foreground hover:text-accent transition-colors">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="truncate">{r.origin} → {r.destination}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {profile.reviews?.length > 0 && (
          <div className={cardCls}>
            <h3 className="font-bold text-sm mb-3" style={{ fontFamily: 'var(--font-display)' }}>Reviews</h3>
            <div className="space-y-3">
              {profile.reviews.map((r, i) => (
                <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{r.rater_name}</span>
                    <Stars rating={r.score} />
                  </div>
                  {r.comment && <p className="text-xs text-muted-foreground mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showRate && <RateModal profile={profile} sharedRides={sharedRides} onClose={() => setShowRate(false)} />}
    </div>
  );
}
