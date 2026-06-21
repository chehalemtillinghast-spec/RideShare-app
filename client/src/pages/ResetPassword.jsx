import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';

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
      <div className="page">
        <h1>Invalid reset link</h1>
        <p className="muted">This link is missing its reset token. Request a new one from the login page.</p>
        <Link to="/forgot-password">Request a new link</Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="page">
        <h1>Password updated</h1>
        <p className="muted">You can now log in with your new password.</p>
        <button className="btn" onClick={() => navigate('/login')}>Go to login</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Choose a new password</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>New password (8+ characters)</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <div className="field">
          <label>Confirm new password</label>
          <input type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}
