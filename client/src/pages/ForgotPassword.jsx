import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

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
      <div className="page">
        <h1>Check your email</h1>
        <p className="muted">
          If an account exists for {email}, we've sent a link to reset your password. It expires in 1 hour.
        </p>
        <Link to="/login">Back to login</Link>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Forgot your password?</h1>
      <p className="muted">Enter your email and we'll send you a link to reset it.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>
      <p className="muted"><Link to="/login">Back to login</Link></p>
    </div>
  );
}
