'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { RoomMatch } from '@meetmaze/shared/contracts';

interface ChatMessage {
  id: string;
  role: 'USER' | 'ASSISTANT' | 'SYSTEM';
  content: string;
}

export default function RoomBotLauncher() {
  const [isOpen, setIsOpen] = useState(false);
  const [unread, setUnread] = useState(false);

  return (
    <>
      <button 
        onClick={() => { setIsOpen(true); setUnread(false); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg flex items-center justify-center text-white hover:bg-blue-700 transition-colors z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
        {unread && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[380px] h-[560px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50 sm:right-6 sm:bottom-24 sm:w-[380px] w-full right-0 bottom-0 h-full sm:h-[560px] sm:rounded-2xl rounded-none">
          <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
              <h2 className="font-semibold text-lg">RoomBot</h2>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          
          <RoomBotUI />
        </div>
      )}
    </>
  );
}

function RoomBotUI() {
  const [sessionId, setSessionId] = useState<string | undefined>(
    typeof window !== 'undefined' ? sessionStorage.getItem('roombot_session') || undefined : undefined
  );
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickReplies, setQuickReplies] = useState<string[]>(['Book a room for 8 people tomorrow at 3 PM', 'Show my bookings']);
  const [suggestions, setSuggestions] = useState<RoomMatch[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, suggestions]);

  useEffect(() => {
    if (sessionId && messages.length === 0) {
      // Load history
      fetch(`http://localhost:4000/api/v1/roombot/sessions/${sessionId}`)
        .then(r => r.json())
        .then(res => {
          if (res.success && res.data.messages) {
            setMessages(res.data.messages);
          }
        })
        .catch(console.error);
    } else if (messages.length === 0) {
      setMessages([{ id: '1', role: 'ASSISTANT', content: 'Hi there! I can help you book a room. Just tell me what you need.' }]);
    }
  }, [sessionId]);

  const sendMessage = async (text: string, action?: any) => {
    if (!text.trim() && !action) return;

    if (text) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'USER', content: text }]);
    }
    setInput('');
    setLoading(true);
    setQuickReplies([]);
    setSuggestions([]);

    try {
      const res = await fetch(`http://localhost:4000/api/v1/roombot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message: text, action }),
      }).then(r => r.json());

      if (res.success) {
        const data = res.data;
        if (data.sessionId && data.sessionId !== sessionId) {
          setSessionId(data.sessionId);
          sessionStorage.setItem('roombot_session', data.sessionId);
        }
        
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ASSISTANT', content: data.reply }]);
        setQuickReplies(data.quickReplies || []);
        setSuggestions(data.suggestions || []);
      } else {
        throw new Error(res.error?.message);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ASSISTANT', content: `Oops, something went wrong: ${err.message}` }]);
      setQuickReplies(['Try again']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.role === 'USER' 
                ? 'bg-blue-600 text-white rounded-br-sm' 
                : 'bg-white text-slate-800 border border-slate-200 rounded-bl-sm shadow-sm'
            }`}>
              <div className="whitespace-pre-wrap text-[15px]">{m.content}</div>
            </div>
          </div>
        ))}
        
        {suggestions.length > 0 && (
          <div className="space-y-3 mt-4 w-[90%]">
            {suggestions.map((s, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-900">{s.room.name}</h4>
                  <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded text-sm">{s.matchScore}%</span>
                </div>
                <p className="text-sm text-slate-500 mb-3">{s.matchReason}</p>
                <button 
                  onClick={() => sendMessage(`Book ${s.room.name}`, { type: 'SELECT_ROOM', payload: { index: idx } })}
                  className="w-full py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                >
                  Book this
                </button>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 shadow-sm">
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        
        {quickReplies.length > 0 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {quickReplies.map((qr, i) => (
              <button 
                key={i}
                onClick={() => {
                  if (qr === 'Yes, confirm') sendMessage('Yes', { type: 'CONFIRM_BOOKING' });
                  else sendMessage(qr);
                }}
                className="bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-full text-sm font-medium transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-full px-4 py-2.5 outline-none transition-all"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 disabled:bg-slate-300 transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
