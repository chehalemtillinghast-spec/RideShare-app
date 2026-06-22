import { useState } from 'react';
import { Shield } from 'lucide-react';
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
    <button
      onClick={trigger}
      disabled={sending}
      title="Emergency alert"
      className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-destructive text-white font-black text-xs flex items-center justify-center gap-0.5 shadow-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
      style={{ right: 'max(16px, calc(50vw - 340px))' }}
    >
      {sent ? 'Sent' : (
        <span className="flex flex-col items-center gap-0.5">
          <Shield className="w-4 h-4" />
          SOS
        </span>
      )}
    </button>
  );
}
