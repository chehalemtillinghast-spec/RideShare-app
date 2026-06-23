import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

  return (
    <div className="flex flex-col min-h-full px-5 pt-10 pb-6 bg-background">
      <h1
        className="text-2xl font-black text-foreground mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Welcome back
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputCls}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-5">
        <Link to="/forgot-password" className="text-accent font-semibold hover:opacity-70 transition-opacity">
          Forgot your password?
        </Link>
      </p>
      <p className="text-sm text-muted-foreground mt-2">
        New here?{' '}
        <Link to="/register" className="text-accent font-semibold hover:opacity-70 transition-opacity">
          Create an account
        </Link>
      </p>
    </div>
  );
}
