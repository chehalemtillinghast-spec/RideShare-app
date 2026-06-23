import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Settings as SettingsIcon, X } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { Avatar, Verified, Stars } from '../components/primitives';

const cardCls = 'bg-card rounded-2xl p-2.5 border border-border shadow-sm';
const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const btnSecondary =
  'bg-secondary text-foreground rounded-2xl py-3 px-4 font-bold text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [bio, setBio] = useState(user.bio || '');
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [showBadges, setShowBadges] = useState(false);

  async function triggerSos() {
    if (!confirm('Send an emergency alert now? This will notify your emergency contacts and admins.')) return;
    setSosSending(true);
    try {
      await api.post('/emergency', {});
      setSosSent(true);
      setTimeout(() => setSosSent(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSosSending(false);
    }
  }

  async function saveBio() {
    await api.patch('/users/me', { bio });
    refresh();
  }

  const stats = user.stats || {};
  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    : null;
  const badges = [
    Number(stats.rides_offered || 0) + Number(stats.rides_taken || 0) >= 10 && {
      label: '10+ Rides',
      cls: 'bg-amber-100 text-amber-700',
      desc: "You've offered or taken 10 or more rides. Thanks for keeping the community moving.",
    },
    user.driver_available && {
      label: 'Designated Driver',
      cls: 'bg-[#2E8B7A]/10 text-[#2E8B7A]',
      desc: "You're signed up as an on-call designated driver for the community.",
    },
  ].filter(Boolean);
  const VISIBLE_BADGES = 3;
  const visibleBadges = badges.slice(0, VISIBLE_BADGES);
  const hiddenCount = badges.length - visibleBadges.length;

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-3 pb-1.5 flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>Profile</h1>
        <Link to="/settings" className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
          <SettingsIcon className="w-4 h-4 text-foreground" />
        </Link>
      </div>

      <div className="flex-1 px-4 pb-1.5 space-y-1.5 min-h-0 flex flex-col">
        {/* Hero */}
        <div className={cardCls}>
          <div className="flex items-center gap-3">
            <Avatar name={user.full_name} size="lg" color="accent" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>{user.full_name}</h2>
                {user.verification_status === 'verified' && <Verified />}
              </div>
              {memberSince && <p className="text-xs text-muted-foreground">Member since {memberSince}</p>}
              <Stars rating={stats.avg_rating} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-2.5 pt-2.5 border-t border-border">
            {[
              { label: 'Offered', value: stats.rides_offered ?? 0 },
              { label: 'Taken', value: stats.rides_taken ?? 0 },
              { label: 'Rating', value: stats.avg_rating ? `${stats.avg_rating}★` : '—' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-xl font-black text-accent" style={{ fontFamily: 'var(--font-display)' }}>{s.value}</p>
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              </div>
            ))}
          </div>
          {badges.length > 0 && (
            <button
              onClick={() => setShowBadges(true)}
              className="flex items-center gap-2 overflow-hidden mt-2.5 pt-2.5 border-t border-border w-full text-left"
            >
              {visibleBadges.map((b) => (
                <span key={b.label} className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${b.cls}`}>{b.label}</span>
              ))}
              {hiddenCount > 0 && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-secondary text-muted-foreground shrink-0">
                  +{hiddenCount}
                </span>
              )}
            </button>
          )}
        </div>

        {showBadges && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setShowBadges(false)}>
            <div
              className="w-full max-w-md bg-card rounded-t-3xl p-5 pb-7 max-h-[75vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-black text-lg text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
                  Badges Earned
                </h3>
                <button onClick={() => setShowBadges(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                {badges.map((b) => (
                  <div key={b.label} className="flex items-start gap-3 border border-border rounded-xl p-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${b.cls}`}>{b.label}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className={`${cardCls} flex-1 flex flex-col`}>
          <label className={labelCls}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${inputCls} resize-none mb-2 py-2 flex-1 min-h-0`}
          />
          <button onClick={saveBio} className={`${btnSecondary} py-2`}>Save bio</button>
        </div>

        <div className="bg-[#FFF4F0] rounded-2xl p-2.5 border border-accent/20">
          <p className="text-xs text-muted-foreground text-center mb-1.5 leading-relaxed">
            Sends a safety alert to your emergency contacts and Ride support.
          </p>
          <button
            onClick={triggerSos}
            disabled={sosSending}
            className="w-full bg-accent text-white rounded-2xl py-2 font-black text-sm flex items-center justify-center gap-2 shadow-md hover:bg-accent/90 active:scale-[0.985] transition-all disabled:opacity-60"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <Shield className="w-5 h-5" />
            {sosSent ? 'Alert sent' : sosSending ? 'Sending...' : 'Send SOS Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}
