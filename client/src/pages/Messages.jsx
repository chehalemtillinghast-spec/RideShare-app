import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { onSocketEvent } from '../socket';

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}...` : text;
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
    <div className="page">
      <h1>Messages</h1>
      {error && <p className="error">{error}</p>}
      {conversations.length === 0 && <p className="muted">No conversations yet. Open a ride to message a driver or rider.</p>}
      {conversations.map((c) => (
        <Link
          key={`${c.other_id}-${c.ride_id || 'general'}`}
          to={`/messages?with=${c.other_id}${c.ride_id ? `&ride_id=${c.ride_id}` : ''}`}
          style={{ display: 'block' }}
        >
          <div className="card" style={{ background: c.unread_count > 0 ? '#fff3cd' : '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <strong>
                {c.other_name} {c.other_verification === 'verified' && <span className="badge">Verified</span>}
              </strong>
              <span className="muted" style={{ fontSize: 12 }}>{new Date(c.last_message_at).toLocaleString()}</span>
            </div>
            <p className="muted">{truncate(c.last_body, 80)}</p>
            {c.unread_count > 0 && <span className="badge pending">{c.unread_count} unread</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

function MessageThread({ otherId, rideId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

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

  return (
    <div className="page">
      <Link to="/messages" className="muted">&larr; All conversations</Link>
      <h1>Conversation</h1>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            className="card"
            style={{ alignSelf: m.sender_id === user.id ? 'flex-end' : 'flex-start', background: m.sender_id === user.id ? '#d8f3dc' : '#fff' }}
          >
            <p>{m.body}</p>
            <p className="muted">{new Date(m.created_at).toLocaleString()}</p>
          </div>
        ))}
        {messages.length === 0 && <p className="muted">No messages yet. Say hello!</p>}
      </div>
      <form onSubmit={send} style={{ display: 'flex', gap: 8 }}>
        <input style={{ flex: 1 }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message..." />
        <button className="btn" type="submit">Send</button>
      </form>
      {error && <p className="error">{error}</p>}
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
