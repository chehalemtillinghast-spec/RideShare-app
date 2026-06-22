import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const PAGE_CLS = 'flex flex-col min-h-[calc(100vh-56px)] px-5 pt-10 pb-6 bg-background';
const HEADING_CLS = 'text-2xl font-black text-foreground mb-1';
const INPUT_CLS =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
const LABEL_CLS = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const BUTTON_CLS =
  'w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100';
const LINK_CLS = 'text-accent font-semibold hover:opacity-70 transition-opacity';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.public.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className={PAGE_CLS}>
        <h1 className={HEADING_CLS} style={{ fontFamily: 'var(--font-display)' }}>
          Check your email
        </h1>
        <p className="text-sm text-muted-foreground mb-5">
          If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.
        </p>
        <Link to="/login" className={`text-sm ${LINK_CLS}`}>
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div className={PAGE_CLS}>
      <h1 className={HEADING_CLS} style={{ fontFamily: 'var(--font-display)' }}>
        Forgot your password?
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Enter your email and we'll send you a link to reset it.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={LABEL_CLS}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT_CLS}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button type="submit" disabled={loading} className={BUTTON_CLS} style={{ fontFamily: 'var(--font-display)' }}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-5">
        <Link to="/login" className={LINK_CLS}>
          Back to login
        </Link>
      </p>
    </div>
  );
}
