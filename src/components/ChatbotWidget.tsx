'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, User, Sparkles, Loader, Trash2, Camera } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const formatText = (text: string) => {
  // Bold
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900">$1</strong>');
  // Lists
  formatted = formatted.replace(/^\* (.*?)$/gm, '<li class="ml-4 list-disc marker:text-[#c5a880]">$1</li>');
  // Newlines
  formatted = formatted.replace(/\n/g, '<br />');
  return formatted;
};

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hi! I'm **Mara Photo AI**. I can speak your language! How can I help you manage your photography business today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleClear = () => {
    setMessages([
      { role: 'model', content: "Hi! I'm **Mara Photo AI**. I can speak your language! How can I help you manage your photography business today?" }
    ]);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    const text = input.trim();
    if (!text) return;

    const newMessages = [...messages, { role: 'user' as const, content: text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/ai/chat', { messages: newMessages });
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: response.data.response 
      }]);
    } catch (error: any) {
      console.error('Chat error:', error);
      const errorMsg = error.response?.data?.error || "I'm sorry, I couldn't connect right now.";
      setMessages(prev => [...prev, { role: 'model', content: `**Error:** ${errorMsg}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes floatBot {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        .bot-float-anim {
          animation: floatBot 3s ease-in-out infinite;
        }
        
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .chat-msg-anim {
          animation: slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        
        .chat-glass-header {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(232, 228, 221, 0.8);
        }
      `}} />

      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[100] w-16 h-16 rounded-[24px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center transition-all duration-500 hover:scale-105 border-[1.5px] border-[#c5a880]/30 bot-float-anim ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
      >
        <div className="relative">
          <Camera className="w-7 h-7 text-[#c5a880] absolute -top-1 -right-1 opacity-20" />
          <Bot className="w-7 h-7 text-white relative z-10" />
          <div className="absolute -top-2 -right-2 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#0f172a]"></div>
        </div>
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-[100] w-full sm:w-[400px] h-[100dvh] sm:h-[650px] sm:max-h-[85vh] bg-[#fdfcfb] sm:rounded-[32px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] sm:border border-[#e8e4dd] flex flex-col overflow-hidden transition-all duration-400 ease-out origin-bottom-right ${isOpen ? 'scale-100 opacity-100 pointer-events-auto' : 'scale-90 opacity-0 pointer-events-none'}`}
      >
        {/* Header - Glassmorphic */}
        <div className="chat-glass-header p-5 flex items-center justify-between shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c5a880] to-[#b59a72] p-[1px] shadow-sm">
              <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#c5a880]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Mara Photo <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-wider">AI</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Always here to help</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button 
              onClick={handleClear}
              title="Clear Chat"
              className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center transition-colors text-slate-400 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#e8e4dd] relative">
          
          <div className="text-center pb-4">
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Today</span>
          </div>

          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex items-end gap-3 max-w-[88%] chat-msg-anim ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mb-1 shadow-sm ${msg.role === 'user' ? 'bg-slate-800' : 'bg-gradient-to-br from-[#c5a880] to-[#b59a72]'}`}>
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              {/* Bubble */}
              <div 
                className={`px-4 py-3.5 text-[14px] leading-relaxed shadow-sm relative ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-3xl rounded-br-sm font-medium' 
                    : 'bg-white text-slate-700 border border-[#e8e4dd] rounded-3xl rounded-bl-sm'
                }`}
              >
                <span dangerouslySetInnerHTML={{ __html: formatText(msg.content) }} className="break-words" />
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-end gap-3 max-w-[88%] chat-msg-anim">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#c5a880] to-[#b59a72] shadow-sm flex items-center justify-center shrink-0 mb-1">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-5 py-4 bg-white text-slate-700 border border-[#e8e4dd] shadow-sm rounded-3xl rounded-bl-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c5a880] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#c5a880] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-[#c5a880] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input Area */}
        <div className="p-5 bg-white border-t border-[#e8e4dd] shrink-0">
          <form 
            onSubmit={handleSend}
            className="flex items-end gap-3 bg-[#faf9f6] rounded-[24px] p-2 pl-5 border border-[#e8e4dd] focus-within:border-[#c5a880] focus-within:ring-4 focus-within:ring-[#c5a880]/10 transition-all shadow-sm"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
              placeholder="Type your message here..."
              className="flex-1 max-h-[120px] bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-400 font-medium resize-none py-3 scrollbar-hide"
              rows={1}
              disabled={isLoading}
              style={{ minHeight: '44px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-11 h-11 rounded-full bg-gradient-to-br from-[#c5a880] to-[#b59a72] text-white flex items-center justify-center shrink-0 disabled:opacity-50 transition-all hover:scale-105 hover:shadow-lg hover:shadow-[#c5a880]/20 mb-0.5"
            >
              <Send className="w-5 h-5 mr-0.5" />
            </button>
          </form>
          
          <div className="flex items-center justify-center gap-1.5 mt-4">
            <Camera className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-black text-slate-400 tracking-[0.15em] uppercase">Powered by Mara Photo</span>
          </div>
        </div>
      </div>
    </>
  );
}
