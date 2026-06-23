import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

const labelCls = 'text-[11px] font-bold text-muted-foreground uppercase tracking-widest block mb-1.5';
const inputCls =
  'w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors';

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
      <div className="flex flex-col min-h-full px-5 pt-10 pb-6 bg-background">
        <h1 className="text-2xl font-black text-foreground mb-1" style={{ fontFamily: 'var(--font-display)' }}>
          Report submitted
        </h1>
        <p className="text-sm text-muted-foreground mb-6">Thanks for letting us know. An admin will review this.</p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Back home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full px-5 pt-10 pb-6 bg-background">
      <h1 className="text-2xl font-black text-foreground mb-6" style={{ fontFamily: 'var(--font-display)' }}>
        Report a problem
      </h1>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={labelCls}>Reason</label>
          <input
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. No-show, unsafe driving, harassment"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Details</label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            className={`${inputCls} resize-none`}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          className="w-full bg-accent text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg hover:bg-accent/90 active:scale-[0.985] transition-all duration-150"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Submit report
        </button>
      </form>
    </div>
  );
}
