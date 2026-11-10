import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Send,
  Loader2,
  Bot,
  User,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

interface AiAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSearchKeyword: (keyword: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
  thinkingMode?: boolean;
}

export const AiAdvisorModal: React.FC<AiAdvisorModalProps> = ({
  isOpen,
  onClose,
  onSelectSearchKeyword,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: `Hello! I am your **PLUG Campus Advisor**, powered by **gemini-4-argon** with **High Thinking**. 

Ask me anything about:
- **Academic Kits**: EG-101 Mini Drafters, Casio fx-991EX calculators, B.Tech 1st year books, Block 28 lab aprons.
- **Hostel Guidelines**: Appliance rules, room cooler power limits, induction safety in BH/GH.
- **Semester Economics**: Should you rent or buy for 1 semester?
- **Safe Handover**: Best meetup spots at UniMall, Hostel Turnstiles, or Law Gate.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.text || data.fallbackAnalysis || data.fallbackText || 'Here is the campus analysis for your query.',
          thinkingMode: true,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `### 🎓 Campus Peer Guide
- Second-hand essentials at LPU trade for 40-60% below new store prices.
- UniMall ground floor or Hostel Turnstiles are safest for handovers!`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'What essentials does a 1st year B.Tech student need under ₹2,000?',
    'Will an 1800W induction cooktop trip the MCB in BH-4 Boys Hostel?',
    'Is it cheaper to rent or buy a mini drafter for EG-101 semester?',
    'How do I test a second-hand bicycle before paying the student?',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl h-[85vh] flex flex-col shadow-2xl relative"
        role="dialog"
        aria-modal="true"
        aria-label="PLUG AI Campus Advisor"
      >
        {/* Header */}
        <div className="p-3.5 bg-[#0b242a] text-white flex items-center justify-between rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#fbbf24] flex items-center justify-center text-slate-950 font-black shadow-xs">
              <Sparkles className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5">
                <span>PLUG AI Campus Advisor</span>
                <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-xs font-black">
                  HIGH THINKING
                </span>
              </h3>
              <p className="text-[10px] text-slate-300">
                gemini-4-argon • ThinkingLevel.HIGH
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close AI advisor"
            className="w-8 h-8 rounded-full bg-slate-800 text-gray-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 p-3.5 overflow-y-auto space-y-3 no-scrollbar text-xs">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-[#0b242a] text-[#fbbf24] flex items-center justify-center shrink-0 text-xs shadow-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-slate-950 text-white rounded-tr-xs'
                    : 'bg-gray-100 text-slate-900 rounded-tl-xs border border-gray-200'
                }`}
              >
                {m.text}
              </div>

              {m.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 text-xs">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-[#0b242a] text-[#fbbf24] flex items-center justify-center shrink-0 text-xs">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-xs text-xs text-amber-950 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                <span>Thinking deeply with gemini-4-argon...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sample Question Chips */}
        <div className="px-3.5 py-2 border-t border-gray-100 bg-gray-50 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {sampleQuestions.map((q, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(q)}
              className="text-[10px] font-semibold bg-white border border-gray-200 hover:border-gray-300 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-gray-200 bg-white flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask campus query (e.g. Drafter rent in UniMall?)"
            className="flex-1 text-xs border border-gray-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Send query"
            className="w-9 h-9 rounded-xl bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4 text-[#fbbf24]" />
          </button>
        </div>
      </div>
    </div>
  );
};
