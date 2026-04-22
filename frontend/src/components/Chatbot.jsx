import React, { useState, useRef, useEffect } from 'react';

export default function Chatbot({ email, activeMonth }) {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi there! I am finAI, your personal financial assistant. How can I help you analyze your spending today?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, prompt: userMsg, month: activeMonth || '' })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: "Error from server: " + (data.detail || res.statusText) }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response || "Error generating response" }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Network error connecting to finAI servers." }]);
    }
    setLoading(false);
  };

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-120px)] max-w-4xl mx-auto rounded-3xl bg-white border border-[#f0f0f5] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-[#1a1a24] text-white p-6 flex items-center gap-4">
        <div className="w-10 h-10 bg-[#e5fcf4] text-[#00a86b] rounded-full flex items-center justify-center">
           <span className="material-symbols-outlined text-[20px]">temp_preferences_custom</span>
        </div>
        <div>
          <h2 className="font-extrabold text-lg">finAI Assistant</h2>
          <p className="text-[0.65rem] font-bold text-[#8c8c99] tracking-widest uppercase">Ask anything about your data</p>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fcfcfd]">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'user' ? 'bg-[#f0f0f5] text-[#2d2d3a]' : 'bg-[#e5fcf4] text-[#00a86b]'}`}>
              <span className="material-symbols-outlined text-[16px]">{msg.role === 'user' ? 'person' : 'temp_preferences_custom'}</span>
            </div>
            <div className={`px-5 py-3.5 max-w-[75%] rounded-2xl text-[0.9rem] font-medium leading-relaxed ${msg.role === 'user' ? 'bg-[#1a1a24] text-white rounded-tr-sm' : 'bg-white border border-[#f0f0f5] text-[#2d2d3a] shadow-sm rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 bg-[#e5fcf4] text-[#00a86b] rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="material-symbols-outlined text-[16px]">temp_preferences_custom</span>
            </div>
            <div className="px-5 py-3.5 bg-white border border-[#f0f0f5] rounded-2xl shadow-sm rounded-tl-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-[#00a86b] rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-[#00a86b] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              <div className="w-1.5 h-1.5 bg-[#00a86b] rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={scrollRef}></div>
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-5 bg-white border-t border-[#f0f0f5]">
        <div className="relative flex items-center">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="E.g. What did I spend the most on this month?"
            className="w-full bg-[#fcfcfd] border border-[#dcdce5] rounded-full py-3.5 pl-6 pr-14 text-sm font-medium text-[#2d2d3a] focus:outline-none focus:border-[#6c5dd3] transition-colors"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-1.5 w-[38px] h-[38px] bg-[#1a1a24] text-white rounded-full flex items-center justify-center hover:-translate-y-0.5 transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </div>
      </form>
    </div>
  );
}
