import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import API from '../api';

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hello! I am Luigi's virtual assistant. Ask me anything about our menu or restaurant!", isNew: false }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const endOfMessagesRef = useRef(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e, customInput) => {
    e?.preventDefault();
    const messageToSend = customInput || input.trim();
    if (!messageToSend || loading) return;

    const userMsg = messageToSend;
    setInput('');
    const newMessages = [...messages, { id: Date.now(), role: 'user', text: userMsg, isNew: false }];
    setMessages(newMessages);
    setLoading(true);

    // Add a placeholder for the bot message
    const botMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botMsgId, role: 'bot', text: '', isNew: true }]);

    try {
      const response = await fetch(`${API.defaults.baseURL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMsg,
          history: messages.map(m => ({ role: m.role, text: m.text }))
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let buffer = '';
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        // Normalize Windows line endings
        buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
              if (data.includes('SUGGESTIONS:')) {
                const [textPart, suggestionPart] = data.split('SUGGESTIONS:');
                if (textPart) {
                  accumulatedText += textPart;
                }
                try {
                  const suggestions = JSON.parse(suggestionPart);
                  setMessages(prev => prev.map(m => 
                    m.id === botMsgId ? { ...m, text: accumulatedText, suggestions } : m
                  ));
                } catch (e) {
                  console.error("Failed to parse suggestions", e);
                }
              } else if (data) {
                accumulatedText += data;
                setMessages(prev => prev.map(m => 
                  m.id === botMsgId ? { ...m, text: accumulatedText } : m
                ));
              }
            }
          }
        }
      }
      setStreaming(false);
    } catch (err) {
      setStreaming(false);
      setMessages(prev => prev.map(m => 
        m.id === botMsgId ? { 
          ...m, 
          text: "System Offline. Unable to reach the knowledge database: " + err.message, 
          isError: true 
        } : m
      ));
    }
    setStreaming(false);
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-900/10 relative">
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar flex flex-col gap-6 scroll-smooth z-10">
        {messages.filter(msg => msg.role === 'user' || msg.text).map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
            {msg.role === 'bot' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 border border-slate-600/50 shadow-lg relative group">
                <span className="text-xl drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]">🤖</span>
                {/* Active Bot Indicator */}
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-800 rounded-full"></div>
              </div>
            )}
            <div className={`max-w-[85%] sm:max-w-[75%] rounded-3xl px-6 py-4 shadow-xl ${
              msg.role === 'user' 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-slate-950 rounded-tr-sm font-semibold tracking-wide' 
                : msg.isError 
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400 rounded-tl-sm'
                  : 'bg-slate-800/80 backdrop-blur-md text-slate-200 border border-slate-700/50 rounded-tl-sm text-[15px]'
            }`}>
              {msg.role === 'bot' && !msg.isError ? (
                <ReactMarkdown
                  components={{
                    strong: ({node, ...props}) => <span className="font-bold text-amber-50" {...props} />,
                    ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 mt-2 space-y-1 marker:text-amber-500" {...props} />,
                    ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 mt-2 space-y-1 marker:text-amber-500" {...props} />,
                    p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-amber-400 mt-3 mb-2" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-amber-400 mt-3 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-semibold text-amber-300 mt-2 mb-1" {...props} />,
                    li: ({node, ...props}) => <li className="pl-1" {...props} />
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              ) : (
                msg.text
              )}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-500">
                  {msg.suggestions.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(null, suggestion)}
                      className="text-xs bg-slate-700/50 hover:bg-amber-500/20 text-slate-300 hover:text-amber-400 border border-slate-600/50 hover:border-amber-500/30 rounded-full px-3 py-1.5 transition-all"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-200 to-amber-400 flex items-center justify-center ml-4 mt-0.5 flex-shrink-0 border border-amber-500/50 shadow-lg relative">
                <svg className="w-5 h-5 text-amber-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
              </div>
            )}
          </div>
        ))}
        
        {loading && !messages.some(m => m.isNew && m.text) && (
          <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center mr-4 mt-0.5 flex-shrink-0 border border-slate-600/50 shadow-lg relative">
                <svg className="w-5 h-5 text-amber-500/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path></svg>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-slate-800 rounded-full animate-pulse"></div>
              </div>
            <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-3xl rounded-tl-sm px-6 py-5 shadow-xl flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-amber-500/80 rounded-full animate-bounce [animation-delay:-0.3s] drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
              <div className="w-2.5 h-2.5 bg-amber-500/80 rounded-full animate-bounce [animation-delay:-0.15s] drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
              <div className="w-2.5 h-2.5 bg-amber-500/80 rounded-full animate-bounce drop-shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </div>

      {/* Input Field Area */}
      <div className="p-4 sm:p-6 bg-slate-900/50 border-t border-slate-800/60 backdrop-blur-2xl z-20">
        <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto w-full group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            autoFocus
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-full pl-6 pr-16 py-[18px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/80 focus:bg-slate-900 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner text-[15px]"
          />
          <button 
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-900 flex items-center justify-center hover:from-amber-400 hover:to-orange-400 focus:outline-none disabled:opacity-30 disabled:grayscale transition-all shadow-lg hover:shadow-orange-500/30 transform hover:scale-105 active:scale-95 border-none"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
