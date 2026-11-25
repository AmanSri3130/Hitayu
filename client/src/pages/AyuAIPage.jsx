import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  Sparkles,
  Bot,
  User as UserIcon,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const SUGGESTED_PROMPTS = [
  'Explain Vata, Pitta and Kapha.',
  'What is Dinacharya?',
  'Explain Ritucharya.',
  'What are the traditional uses of Tulsi?',
  'Explain traditional dietary practices.',
  'What is the importance of yoga?',
];

export default function AyuAIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const res = await api.get('/chat/history');
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to load chat history:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const sendMessage = async (textToSend) => {
    const trimmed = (textToSend ?? input).trim();
    if (!trimmed || sending) return;

    const optimisticUser = {
      role: 'user',
      content: trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticUser]);
    if (!textToSend) setInput('');
    setSending(true);

    try {
      const res = await api.post('/chat/message', { message: trimmed });
      setMessages(res.data.history || []);
    } catch (err) {
      showError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/chat/clear');
      setMessages([]);
      showSuccess('Conversation cleared.');
    } catch (err) {
      showError(err.message);
    }
  };

  return (
    <DashboardLayout
      title="Ayu AI Assistant"
      subtitle="Educational Ayurvedic guidance personalized to your Prakriti profile."
      actions={
        messages.length > 0 && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#C85D55]/30 text-[#C85D55] text-xs font-semibold hover:bg-[#FDF2F2] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Chat</span>
          </button>
        )
      }
    >
      <div className="hitayu-card flex flex-col h-[calc(100vh-220px)] min-h-[520px] overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 bg-[#173F35] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#244F42] flex items-center justify-center border border-white/10">
              <Sparkles className="w-4.5 h-4.5 text-[#C6A56B]" />
            </div>
            <div>
              <p className="font-serif font-semibold text-base leading-none">Ayu AI</p>
              <p className="text-[11px] text-[#A8BDA8] mt-1">
                {user?.prakritiSummary?.dominantDosha
                  ? `Context: ${user.prakritiSummary.dominantDosha} Prakriti`
                  : 'Educational Ayurvedic Companion'}
              </p>
            </div>
          </div>
          <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/10 text-[#E8F0E9]">
            Educational Only
          </span>
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-[#F8F6EF]/50">
          {!loading && messages.length === 0 && (
            <div className="max-w-2xl mx-auto text-center py-8 space-y-6">
              <div className="w-14 h-14 rounded-2xl bg-[#E8F0E9] text-[#173F35] flex items-center justify-center mx-auto">
                <Bot className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#173F35]">
                  Namaste, {user?.name?.split(' ')[0] || 'Friend'}
                </h3>
                <p className="text-sm text-[#78847C] mt-2">
                  Ask me about traditional Ayurvedic doshas, daily Dinacharya routines, seasonal
                  living, herbs, or mindful yoga practices.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 text-left">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="p-3.5 rounded-xl bg-white border border-[#E4E9E2] hover:border-[#173F35] text-xs font-medium text-[#173F35] transition-all text-left"
                  >
                    “{prompt}”
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const isUser = msg.role === 'user';
            return (
              <div key={i} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#173F35] text-[#C6A56B] flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] sm:max-w-[72%] rounded-2xl p-4 space-y-2 ${
                    isUser
                      ? 'bg-[#173F35] text-white rounded-tr-xs'
                      : 'bg-white border border-[#E4E9E2] text-[#26352F] rounded-tl-xs shadow-xs'
                  }`}
                >
                  {msg.isFallback && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D99A50]/15 text-[#9c6622] text-[10px] font-semibold">
                      <AlertCircle className="w-3 h-3" />
                      <span>Curated Knowledge Fallback (Live Groq LLM Offline)</span>
                    </div>
                  )}

                  <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>

                  {msg.references?.length > 0 && (
                    <div className="pt-2 mt-2 border-t border-[#E4E9E2] flex flex-wrap gap-1.5">
                      {msg.references.map((ref, rIdx) => (
                        <span
                          key={rIdx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#E8F0E9] text-[#173F35] text-[10px] font-medium"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{ref.title}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  <p
                    className={`text-[10px] ${
                      isUser ? 'text-white/60 text-right' : 'text-[#78847C]'
                    }`}
                  >
                    {msg.timestamp
                      ? new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''}
                  </p>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#E8F0E9] text-[#173F35] flex items-center justify-center shrink-0 mt-1">
                    <UserIcon className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {sending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-xl bg-[#173F35] text-[#C6A56B] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#E4E9E2] rounded-2xl px-4 py-3 text-xs text-[#78847C] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#173F35] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#173F35] animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 rounded-full bg-[#173F35] animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input Composer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="p-4 bg-white border-t border-[#E4E9E2] flex items-center gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Ayu AI about doshas, routines, herbs, or yoga..."
            className="hitayu-input flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="hitayu-btn-primary px-5 py-3 shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
