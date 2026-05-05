import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, X, MessageCircle, Loader2, User, Wrench } from 'lucide-react';

const BASE_URL = 'http://localhost:8080';

/**
 * ChatWidget
 *
 * A floating chat panel that opens when either the customer or worker
 * clicks the chat button. Messages are polled from the backend every 3 s
 * and sent via POST. The backend stores messages in the booking record.
 *
 * Props:
 *   bookingId   string   The CustomerServiceModel id
 *   myRole      'CUSTOMER' | 'WORKER'
 *   myName      string
 *   otherName   string   e.g. worker name or "Customer"
 *   onClose     () => void
 *   isOpen      boolean
 */
const ChatWidget = ({ bookingId, myRole, myName, otherName, onClose, isOpen }) => {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const bottomRef   = useRef(null);
  const pollRef     = useRef(null);

  // ── Fetch messages ──────────────────────────────────────────────────────
  const fetchMessages = useCallback(async () => {
    if (!bookingId) return;
    try {
      const res = await fetch(`${BASE_URL}/api/chat/${bookingId}/messages`, { credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data);
    } catch (_) {}
    finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000);
    return () => clearInterval(pollRef.current);
  }, [isOpen, bookingId, fetchMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    }
  }, [messages, isOpen]);

  // ── Send message ────────────────────────────────────────────────────────
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    // Optimistic update
    const optimistic = {
      id:        `opt-${Date.now()}`,
      senderRole: myRole,
      senderName: myName,
      content:   text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');

    try {
      await fetch(`${BASE_URL}/api/chat/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ senderRole: myRole, senderName: myName, content: text }),
      });
      await fetchMessages();
    } catch (_) {} finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  if (!isOpen) return null;

  const formatTime = (ts) => {
    try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 flex flex-col rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
      style={{ maxHeight: '80vh', minHeight: 420 }}>

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3.5 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          {myRole === 'CUSTOMER' ? <Wrench size={16} className="text-white" /> : <User size={16} className="text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{otherName}</p>
          <p className="text-indigo-200 text-[10px]">
            {myRole === 'CUSTOMER' ? 'Your Technician' : 'Customer'}
          </p>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors">
          <X size={14} className="text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-3 py-3 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <MessageCircle size={28} className="text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm font-medium">No messages yet</p>
            <p className="text-gray-300 text-xs mt-1">Start the conversation!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMine = msg.senderRole === myRole;
          return (
            <div key={msg.id || i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                {!isMine && (
                  <p className="text-[10px] text-gray-400 font-medium px-1">{msg.senderName}</p>
                )}
                <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMine
                    ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm shadow-indigo-200'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm shadow-sm'
                }`}>
                  {msg.content}
                </div>
                <p className="text-[10px] text-gray-300 px-1">{formatTime(msg.timestamp)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-3 py-3 flex gap-2 shrink-0">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 rounded-2xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
          style={{ maxHeight: 80, overflowY: 'auto' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 flex items-center justify-center transition-colors shrink-0 self-end shadow-md shadow-indigo-200"
        >
          {sending
            ? <Loader2 size={16} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />}
        </button>
      </div>
    </div>
  );
};

/**
 * ChatButton — floating trigger button
 * Place this wherever the chat should be accessible.
 *
 * Props: same as ChatWidget plus unread (number)
 */
export const ChatButton = ({ unread = 0, onClick }) => (
  <button
    onClick={onClick}
    className="relative w-12 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
  >
    <MessageCircle size={22} className="text-white" />
    {unread > 0 && (
      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
        {unread > 9 ? '9+' : unread}
      </span>
    )}
  </button>
);

export default ChatWidget;
