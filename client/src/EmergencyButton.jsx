import { useState } from 'react';
import { api } from './api';

export default function EmergencyButton() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function trigger() {
    if (!confirm('Send an emergency alert now? This will notify your emergency contacts and admins.')) return;
    setSending(true);
    try {
      await api.post('/emergency', {});
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <button className="emergency-btn" onClick={trigger} disabled={sending} title="Emergency alert">
      {sent ? 'Sent' : 'SOS'}
    </button>
  );
}
