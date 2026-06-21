import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';

export default function Messages() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const otherId = params.get('with');
  const rideId = params.get('ride_id');
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!otherId) return;
    const query = rideId ? `?with=${otherId}&ride_id=${rideId}` : `?with=${otherId}`;
    const data = await api.get(`/messages/thread${query}`);
    setMessages(data);
  }

  useEffect(() => { load(); }, [otherId, rideId]);

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

  if (!otherId) {
    return <div className="page"><p className="muted">Open a ride to start a conversation with a driver or rider.</p></div>;
  }

  return (
    <div className="page">
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
