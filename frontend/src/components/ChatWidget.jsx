import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import API from '../api';

const DEFAULT_SUGGESTIONS = [
  "What pizzas do you have?",
  "Book a table for two",
  "Gluten-free options",
  "Opening hours & address"
];

export default function ChatWidget() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'bot',
      text: "Good afternoon. I am Luigi's Assistant. How may I orchestrate your dining experience today? I can assist with reservations, menu inquiries, or special accommodations.",
      sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [activeSuggestions, setActiveSuggestions] = useState(DEFAULT_SUGGESTIONS);
  const chatContainerRef = useRef(null);
  const isUserScrolledUpRef = useRef(false);

  // Auto-scroll to bottom only if user hasn't scrolled up
  const scrollToBottom = (force = false) => {
    if (!chatContainerRef.current) return;
    if (force || !isUserScrolledUpRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Track user scroll position
  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    // If user is more than 100px away from bottom, they are reading earlier messages
    isUserScrolledUpRef.current = scrollHeight - (scrollTop + clientHeight) > 120;
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [messages, loading]);

  // Helper to parse sources and suggestions from text
  const parseMessageData = (rawText) => {
    let cleanText = rawText;
    let sources = [];
    let suggestions = [];

    // Extract suggestions if present
    if (cleanText.includes('SUGGESTIONS:')) {
      const parts = cleanText.split('SUGGESTIONS:');
      cleanText = parts[0];
      try {
        suggestions = JSON.parse(parts[1]);
      } catch (e) {
        console.error("Failed to parse suggestions JSON", e);
      }
    }

    // Extract sources if present
    if (cleanText.includes('**Sources:**')) {
      const parts = cleanText.split('**Sources:**');
      cleanText = parts[0].trim();
      const sourcesStr = parts[1]?.trim() || '';
      sources = sourcesStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    } else if (cleanText.includes('Sources:')) {
      const parts = cleanText.split('Sources:');
      cleanText = parts[0].trim();
      const sourcesStr = parts[1]?.trim() || '';
      sources = sourcesStr
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    }

    return { cleanText, sources, suggestions };
  };

  const handleSend = async (e, customInput) => {
    e?.preventDefault();
    const messageToSend = customInput || input.trim();
    if (!messageToSend || loading) return;

    const userMsg = messageToSend;
    setInput('');
    isUserScrolledUpRef.current = false; // reset on new send

    const newMessages = [...messages, { id: Date.now(), role: 'user', text: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    const botMsgId = Date.now() + 1;
    setMessages(prev => [...prev, { id: botMsgId, role: 'bot', text: '', sources: [] }]);

    // Force scroll down when sending message
    setTimeout(() => scrollToBottom(true), 50);

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

      if (!response.ok) throw new Error(`Server returned status ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedRawText = '';
      let buffer = '';
      setStreaming(true);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';

        for (const part of parts) {
          const lines = part.split('\n');
          for (const line of lines) {
            if (line.startsWith('data:')) {
              const data = line.startsWith('data: ') ? line.slice(6) : line.slice(5);
              accumulatedRawText += data;

              const { cleanText, sources, suggestions } = parseMessageData(accumulatedRawText);

              setMessages(prev => prev.map(m =>
                m.id === botMsgId ? { ...m, text: cleanText, sources } : m
              ));

              if (suggestions && suggestions.length > 0) {
                setActiveSuggestions(suggestions);
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
          text: "I am having trouble connecting to the restaurant's servers right now. Please try again in a moment.",
          isError: true
        } : m
      ));
    } finally {
      setStreaming(false);
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col pt-16 pb-3 px-4 md:px-8 max-w-[850px] w-full mx-auto relative h-[calc(100dvh-4rem)]">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px]"></div>
      </div>

      {/* Chat Timeline with full scroll freedom */}
      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-4 py-4 z-10 custom-scrollbar pr-1 scroll-smooth"
      >
        {/* System Greeting Header */}
        <div className="text-center text-on-surface-variant/40 font-label-caps text-[11px] mb-2 tracking-widest">
          Session Active • Luigi's Concierge
        </div>

        {/* Message List */}
        {messages.filter(msg => msg.role === 'user' || msg.text).map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[88%] md:max-w-[80%] message-enter ${
              msg.role === 'user' ? 'items-end self-end' : 'items-start self-start'
            }`}
          >
            {msg.role === 'user' ? (
              <div className="bg-gradient-to-br from-primary to-secondary-container rounded-2xl rounded-tr-sm p-4 shadow-[0_4px_20px_rgba(242,202,80,0.15)] text-on-primary">
                <p className="font-body-md text-sm md:text-base text-on-primary font-medium leading-relaxed">
                  {msg.text}
                </p>
              </div>
            ) : (
              <div className={`glass-panel rounded-2xl rounded-tl-sm p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-3 relative ${
                msg.isError ? 'border-error/40 bg-error/5 text-error' : 'text-on-surface'
              }`}>
                <div className="font-body-md text-sm md:text-base text-on-surface leading-relaxed markdown-content">
                  <ReactMarkdown
                    components={{
                      strong: ({node, ...props}) => <span className="font-semibold text-primary" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 my-2 space-y-1 marker:text-primary" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 my-2 space-y-1 marker:text-primary" {...props} />,
                      p: ({node, ...props}) => <p className="mb-2 last:mb-0 leading-relaxed" {...props} />,
                      h1: ({node, ...props}) => <h1 className="text-lg font-semibold text-primary mt-2 mb-1" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-base font-semibold text-primary mt-2 mb-1" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-sm font-semibold text-primary mt-1 mb-0.5" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />
                    }}
                  >
                    {msg.text}
                  </ReactMarkdown>
                </div>

                {/* Referenced Sources Section */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-2 pt-3 border-t border-surface-variant/50">
                    <span className="font-label-caps text-[11px] text-on-surface-variant/70 mb-2 block tracking-wider">
                      Referenced Sources
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.sources.map((src, idx) => (
                        <div
                          key={idx}
                          className="bg-surface-container text-primary font-label-caps text-[11px] px-3 py-1.5 rounded-full border border-primary/20 flex items-center gap-1.5 shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {src.toLowerCase().endsWith('.pdf') ? 'picture_as_pdf' : 'description'}
                          </span>
                          {src}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Live Typing Indicator */}
        {loading && !messages.some(m => m.id && m.role === 'bot' && m.text) && (
          <div className="flex flex-col items-start max-w-[85%] message-enter opacity-75">
            <div className="bg-surface-container-high/40 rounded-2xl rounded-tl-sm px-4 py-3 border border-outline-variant/10">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-primary rounded-full bounce bounce1"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full bounce bounce2"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full bounce"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer Interaction Area */}
      <div className="w-full flex flex-col gap-2.5 pt-2 bg-background relative z-20 before:absolute before:top-[-24px] before:left-0 before:w-full before:h-[24px] before:bg-gradient-to-t before:from-background before:to-transparent">
        {/* Follow-up Suggestions Chips */}
        {activeSuggestions && activeSuggestions.length > 0 && (
          <div className="flex overflow-x-auto no-scrollbar gap-2 pb-1">
            {activeSuggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(null, suggestion)}
                className="flex-shrink-0 bg-transparent border border-outline-variant/40 text-on-surface-variant font-label-caps text-[11px] px-3.5 py-1.5 rounded-full hover:text-primary hover:border-primary/50 transition-all glow-hover active:scale-95 cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="relative w-full group">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/5 to-transparent rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity blur-md"></div>
          <div className="relative bg-surface-container-low border border-outline-variant/40 rounded-full flex items-center p-1.5 md:p-2 shadow-inner focus-within:border-primary/60 transition-colors">
            <div className="p-2 text-on-surface-variant flex items-center justify-center ml-1">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant/60">
                chat_bubble_outline
              </span>
            </div>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Inquire about the menu, hours, or reservations..."
              autoFocus
              className="flex-grow bg-transparent border-none text-on-surface font-body-md focus:outline-none placeholder:text-on-surface-variant/40 px-2 py-1.5 text-sm md:text-base"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:shadow-[0_0_15px_rgba(242,202,80,0.4)] transition-all active:scale-95 ml-2 shrink-0 disabled:opacity-40 disabled:grayscale disabled:hover:shadow-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" data-weight="fill">
                send
              </span>
            </button>
          </div>
        </form>

        {/* Disclaimer Note */}
        <div className="text-center">
          <span className="font-label-caps text-[10px] text-on-surface-variant/40 tracking-wider">
            AI may produce inaccurate information about menu items.
          </span>
        </div>
      </div>
    </main>
  );
}
