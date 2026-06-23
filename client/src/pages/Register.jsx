import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', date_of_birth: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form);
      navigate('/onboarding');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';
  const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';

  return (
    <div className="flex flex-col min-h-full px-5 pt-10 pb-6 bg-background">
      <h1
        className="text-2xl font-black text-foreground mb-1"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        Create your account
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Ride is for neighbors 18 and older.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Full name</label>
          <input required value={form.full_name} onChange={update('full_name')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" required value={form.email} onChange={update('email')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Password (8+ characters)</label>
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={update('password')}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Date of birth</label>
          <input
            type="date"
            required
            value={form.date_of_birth}
            onChange={update('date_of_birth')}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Phone (optional)</label>
          <input value={form.phone} onChange={update('phone')} className={inputCls} />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150 disabled:opacity-50 disabled:active:scale-100"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-sm text-muted-foreground mt-5">
        Already have an account?{' '}
        <Link to="/login" className="text-accent font-semibold hover:opacity-70 transition-opacity">
          Log in
        </Link>
      </p>
    </div>
  );
}
