import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, Send, Flag } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { onSocketEvent } from '../socket';
import { Avatar, Verified } from '../components/primitives';

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

function DriverRow() {
  const [drivers, setDrivers] = useState([]);

  function load() {
    api.get('/users/drivers/available').then(setDrivers).catch(() => {});
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('drivers:changed', load), []);

  if (drivers.length === 0) return null;

  return (
    <div className="px-4 pb-3">
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Designated Drivers</p>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {drivers.map((d) => (
          <Link key={d.id} to={`/messages?with=${d.id}`} className="flex flex-col items-center gap-1 shrink-0 w-14">
            <div className="relative">
              <Avatar name={d.full_name} size="md" color="teal" />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </div>
            <span className="text-[11px] text-foreground font-medium truncate w-full text-center">
              {d.full_name.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MessagesInbox() {
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState('');

  function load() {
    api.get('/messages/conversations').then(setConversations).catch((e) => setError(e.message));
  }

  useEffect(() => { load(); }, []);
  useEffect(() => onSocketEvent('message:new', load), []);

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-black text-foreground" style={{ fontFamily: 'var(--font-display)' }}>
          Messages
        </h1>
      </div>

      <DriverRow />

      <div className="flex-1 px-4 pb-6 space-y-3">
        {error && <p className="text-sm text-destructive">{error}</p>}
        {conversations.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">No conversations yet. Open a ride to message a driver or rider.</p>
        )}

        {conversations.map((c) => (
          <Link
            key={`${c.other_id}-${c.ride_id || 'general'}`}
            to={`/messages?with=${c.other_id}${c.ride_id ? `&ride_id=${c.ride_id}` : ''}`}
            className={`block rounded-2xl p-4 border shadow-sm transition-all hover:shadow-md active:scale-[0.985] ${
              c.unread_count > 0 ? 'bg-accent/5 border-accent/30' : 'bg-card border-border'
            }`}
          >
            <div className="flex items-start gap-3">
              <Avatar name={c.other_name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-bold text-sm text-foreground truncate">{c.other_name}</span>
                    {c.other_verification === 'verified' && <Verified sm />}
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {new Date(c.last_message_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{truncate(c.last_body, 80)}</p>
                {c.unread_count > 0 && (
                  <span className="inline-block mt-1.5 text-[10px] font-bold text-white bg-accent px-2 py-0.5 rounded-full">
                    {c.unread_count} unread
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ReportUserModal({ otherUser, onClose, onSubmit }) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function confirmReport() {
    setSubmitting(true);
    try {
      await onSubmit(notes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div className="w-full max-w-md bg-card rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-black text-lg text-foreground mb-1.5" style={{ fontFamily: 'var(--font-display)' }}>
          Report {otherUser?.full_name || 'this user'}?
        </h3>
        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
          An admin will review this conversation. Add any notes that might help them.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={3}
          className="w-full px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors resize-none mb-3"
        />
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 bg-secondary text-foreground rounded-2xl py-3 font-bold text-sm border border-border hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmReport}
            disabled={submitting}
            className="flex-1 bg-destructive text-white rounded-2xl py-3 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Reporting...' : 'Report'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MessageThread({ otherId, rideId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    api.get(`/users/${otherId}`).then(setOtherUser).catch(() => {});
  }, [otherId]);

  async function load() {
    const query = rideId ? `?with=${otherId}&ride_id=${rideId}` : `?with=${otherId}`;
    const data = await api.get(`/messages/thread${query}`);
    setMessages(data);
  }

  useEffect(() => { load(); }, [otherId, rideId]);

  useEffect(() => {
    return onSocketEvent('message:new', (message) => {
      const isThisThread =
        (message.sender_id === Number(otherId) || message.recipient_id === Number(otherId)) &&
        (!rideId || message.ride_id === Number(rideId));
      if (isThisThread) load();
    });
  }, [otherId, rideId]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    try {
      await api.post('/messages', { recipient_id: Number(otherId), body, ride_id: rideId ? Number(rideId) : undefined });
      setBody('');
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitReport(notes) {
    await api.post('/flags', {
      reported_user_id: Number(otherId),
      ride_id: rideId ? Number(rideId) : undefined,
      reason: 'Reported from messages',
      details: notes || undefined,
    });
  }

  return (
    <div className="flex flex-col bg-background min-h-full">
      <div className="px-4 pt-6 pb-3 border-b border-border flex items-center gap-3">
        <Link
          to="/messages"
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </Link>
        {otherUser && <Avatar name={otherUser.full_name} size="sm" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h1 className="font-bold text-sm text-foreground truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {otherUser?.full_name || 'Conversation'}
            </h1>
            {otherUser?.verification_status === 'verified' && <Verified sm />}
          </div>
        </div>
        <button
          onClick={() => setShowReport(true)}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center hover:bg-muted transition-colors shrink-0"
          title="Report this user"
        >
          <Flag className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {showReport && (
        <ReportUserModal otherUser={otherUser} onClose={() => setShowReport(false)} onSubmit={submitReport} />
      )}

      <div className="flex-1 px-4 py-4 space-y-2.5">
        {messages.length === 0 && <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] px-4 py-2.5 ${
                m.sender_id === user.id
                  ? 'bg-accent text-white rounded-2xl rounded-br-sm'
                  : 'bg-card border border-border text-foreground rounded-2xl rounded-bl-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{m.body}</p>
              <p className={`text-[10px] mt-1 ${m.sender_id === user.id ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                {new Date(m.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={send} className="px-4 pb-5 pt-3 border-t border-border bg-background">
        <div className="flex items-center gap-2">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 bg-secondary rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
          />
          <button
            type="submit"
            className="w-11 h-11 bg-accent rounded-xl flex items-center justify-center hover:bg-accent/90 active:scale-95 transition-all shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
      </form>
    </div>
  );
}

export default function Messages() {
  const [params] = useSearchParams();
  const otherId = params.get('with');
  const rideId = params.get('ride_id');

  if (!otherId) return <MessagesInbox />;
  return <MessageThread otherId={otherId} rideId={rideId} />;
}
