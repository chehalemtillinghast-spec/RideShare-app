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

  return (
    <div className="page">
      <h1>Create your account</h1>
      <p className="muted">Town Rides is for neighbors 18 and older.</p>
      <form onSubmit={onSubmit}>
        <div className="field">
          <label>Full name</label>
          <input required value={form.full_name} onChange={update('full_name')} />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" required value={form.email} onChange={update('email')} />
        </div>
        <div className="field">
          <label>Password (8+ characters)</label>
          <input type="password" required minLength={8} value={form.password} onChange={update('password')} />
        </div>
        <div className="field">
          <label>Date of birth</label>
          <input type="date" required value={form.date_of_birth} onChange={update('date_of_birth')} />
        </div>
        <div className="field">
          <label>Phone (optional)</label>
          <input value={form.phone} onChange={update('phone')} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>
      <p className="muted">Already have an account? <Link to="/login">Log in</Link></p>
    </div>
  );
}
