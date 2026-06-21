import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function Flag() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    try {
      await api.post('/flags', {
        reason,
        details,
        ride_id: params.get('ride_id') ? Number(params.get('ride_id')) : undefined,
        reported_user_id: params.get('reported_user_id') ? Number(params.get('reported_user_id')) : undefined,
      });
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (done) {
    return (
      <div className="page">
        <h1>Report submitted</h1>
        <p className="muted">Thanks for letting us know. An admin will review this.</p>
        <button className="btn" onClick={() => navigate('/')}>Back home</button>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>Report a problem</h1>
      <form onSubmit={submit}>
        <div className="field">
          <label>Reason</label>
          <input required value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. No-show, unsafe driving, harassment" />
        </div>
        <div className="field">
          <label>Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} />
        </div>
        {error && <p className="error">{error}</p>}
        <button className="btn" type="submit">Submit report</button>
      </form>
    </div>
  );
}
