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

  return (
    <div className="page">
      <h1>Welcome back</h1>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Password</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>
      <p className="muted"><Link to="/forgot-password">Forgot your password?</Link></p>
      <p className="muted">New here? <Link to="/register">Create an account</Link></p>
    </div>
  );
}
