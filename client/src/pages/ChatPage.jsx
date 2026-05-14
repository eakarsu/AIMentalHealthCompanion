import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import AIResponseDisplay from '../components/AIResponseDisplay';
import CrisisAlert from '../components/CrisisAlert';
import { MessageCircle, Send, Trash2, Bot, User } from 'lucide-react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [crisisAlert, setCrisisAlert] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      const data = res.data.data || res.data || [];
      setSessions(data);
    } catch (e) { console.error(e); }
  };

  const fetchMessages = async (sessionId) => {
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      const data = res.data.data || res.data;
      setMessages(data.messages || []);
      setCurrentSession(data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const startNewSession = async () => {
    try {
      const res = await api.post('/chat/sessions', { title: 'New Session' });
      const session = res.data.data || res.data;
      setCurrentSession(session);
      setMessages([]);
      fetchSessions();
    } catch (e) { console.error(e); }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const userMsg = input.trim();
    setInput('');
    setSending(true);

    const newMessages = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);

    try {
      let sessionId = currentSession?.id || currentSession?._id;
      if (!sessionId) {
        const res = await api.post('/chat/sessions', { title: userMsg.substring(0, 50) });
        const session = res.data.data || res.data;
        setCurrentSession(session);
        sessionId = session.id || session._id;
        fetchSessions();
      }

      const res = await api.post(`/chat/sessions/${sessionId}/message`, { message: userMsg });
      const data = res.data.data || res.data;
      const aiReply = data.aiMessage?.content || data.reply || data.response || data.message || data.content || 'I am here for you.';
      setMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
      if (data.crisis_alert) {
        setCrisisAlert(data.crisis_resources || []);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, I encountered an issue. Please try again.' }]);
    }
    setSending(false);
  };

  const deleteSession = async (id) => {
    if (!confirm('Delete this chat session?')) return;
    try {
      await api.delete(`/chat/sessions/${id}`);
      if ((currentSession?.id || currentSession?._id) === id) {
        setCurrentSession(null);
        setMessages([]);
      }
      fetchSessions();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="page" style={{ maxWidth: 1000, height: 'calc(100vh - 88px)', display: 'flex', gap: 20, padding: '16px 24px' }}>
      {crisisAlert && <CrisisAlert resources={crisisAlert} />}
      {/* Sidebar */}
      <div style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)',
        overflow: 'hidden'
      }}>
        <div style={{ padding: 16, borderBottom: '1px solid var(--border-light)' }}>
          <button className="btn btn-primary btn-sm" onClick={startNewSession} style={{ width: '100%', justifyContent: 'center' }}>
            <MessageCircle size={16} /> New Chat
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
          {sessions.map(s => (
            <div key={s.id || s._id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer', marginBottom: 4,
              background: (currentSession?.id || currentSession?._id) === (s.id || s._id) ? 'var(--lavender-light)' : 'transparent',
            }}
              onClick={() => fetchMessages(s.id || s._id)}
            >
              <span style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {s.title || 'Chat Session'}
              </span>
              <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id || s._id); }}
                style={{ background: 'none', padding: 4, color: 'var(--text-lighter)' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: 'white', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid var(--border-light)',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <Bot size={22} color="var(--primary)" />
          <div>
            <h3 style={{ fontSize: '1rem' }}>AI Therapy Chat</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-lighter)' }}>Your safe space to talk</p>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div>
                <Bot size={48} color="var(--text-lighter)" style={{ marginBottom: 12 }} />
                <h3 style={{ color: 'var(--text-light)', marginBottom: 8 }}>Start a Conversation</h3>
                <p style={{ color: 'var(--text-lighter)', fontSize: '0.9rem', maxWidth: 360, marginBottom: 20 }}>
                  Share what is on your mind. I am here to listen and support you.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '0 auto' }}>
                  {[
                    { label: 'I am feeling really anxious about everything lately and do not know how to cope' },
                    { label: 'I had a panic attack today and I am scared it will happen again' },
                    { label: 'I feel like nobody understands what I am going through' },
                    { label: 'I want to talk about my relationship problems and how they affect my mental health' },
                  ].map((starter, i) => (
                    <button key={i} type="button"
                      onClick={() => { setInput(starter.label); }}
                      style={{
                        background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 12,
                        padding: '10px 16px', cursor: 'pointer', textAlign: 'left',
                        fontSize: '0.85rem', color: 'var(--text-light)', lineHeight: 1.5,
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => { e.target.style.background = 'var(--lavender-light)'; e.target.style.borderColor = 'var(--primary)'; }}
                      onMouseLeave={e => { e.target.style.background = 'var(--bg)'; e.target.style.borderColor = 'var(--border)'; }}
                    >
                      {starter.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} style={{
              display: 'flex', gap: 12,
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              animation: 'slideUp 0.3s ease'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, var(--primary), var(--primary-light))'
                  : 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="white" />}
              </div>
              <div style={{
                maxWidth: '70%', padding: '12px 16px', borderRadius: 16,
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg)',
                color: msg.role === 'user' ? 'white' : 'var(--text)',
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
                lineHeight: 1.6, fontSize: '0.92rem', whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {sending && (
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--secondary), var(--secondary-light))',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Bot size={18} color="white" />
              </div>
              <div style={{ padding: '14px 20px', background: 'var(--bg)', borderRadius: 16, borderBottomLeftRadius: 4 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-lighter)', animation: 'pulse 1s ease infinite' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-lighter)', animation: 'pulse 1s ease 0.2s infinite' }}></div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-lighter)', animation: 'pulse 1s ease 0.4s infinite' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{
          padding: 16, borderTop: '1px solid var(--border-light)',
          display: 'flex', gap: 12
        }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            style={{ flex: 1, borderRadius: 24, paddingLeft: 20 }}
          />
          <button className="btn btn-primary" onClick={sendMessage} disabled={sending || !input.trim()}
            style={{ borderRadius: 24, padding: '10px 20px' }}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
