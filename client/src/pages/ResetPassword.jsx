import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

const PAGE_CLS = 'flex flex-col min-h-full px-5 pt-10 pb-6 bg-background';
const HEADING_CLS = 'text-2xl font-black text-foreground mb-1';
const INPUT_CLS =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const LABEL_CLS = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const BUTTON_CLS =
  'w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      await api.public.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className={PAGE_CLS}>
        <h1 className={HEADING_CLS} style={{ fontFamily: 'var(--font-display)' }}>
          Invalid reset link
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          This link is missing its reset token. Request a new one from the login page.
        </p>
        <Link to="/forgot-password" className="text-accent font-semibold text-sm hover:opacity-70 transition-opacity">
          Request a new link
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={PAGE_CLS}>
        <h1 className={HEADING_CLS} style={{ fontFamily: 'var(--font-display)' }}>
          Password updated
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          You can now log in with your new password.
        </p>
        <button
          onClick={() => navigate('/login')}
          className={BUTTON_CLS}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Go to login
        </button>
      </div>
    );
  }

  return (
    <div className={PAGE_CLS}>
      <h1 className={`${HEADING_CLS} mb-6`} style={{ fontFamily: 'var(--font-display)' }}>
        Choose a new password
      </h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLS}>New password (8+ characters)</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>Confirm new password</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={loading} className={BUTTON_CLS} style={{ fontFamily: 'var(--font-display)' }}>
          {loading ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}
