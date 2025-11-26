import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { Send, ShoppingBag, Sparkles, User, Bot, ExternalLink } from 'lucide-react';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
        <div>
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            Assistente Design
            </h3>
            <p className="text-xs text-slate-500">Chiedi consigli o perfeziona il look</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.length === 0 && (
          <div className="text-center text-slate-400 mt-10 p-4">
            <p className="mb-2">👋 Ciao!</p>
            <p className="text-sm">Prova a chiedere: <br/>"Fai il tappeto blu"<br/>"Rimuovi la sedia"<br/>"Dove posso comprare questa lampada?"</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-3 text-sm ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none'
                  : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
              }`}
            >
              {msg.role === 'model' && (
                  <div className="flex items-center gap-1 mb-1 text-xs font-semibold text-indigo-600 opacity-75">
                      <Bot className="w-3 h-3" /> Consulente AI
                  </div>
              )}
              
              <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>

              {/* Grounding Links (Shoppable Items) */}
              {msg.groundingLinks && msg.groundingLinks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 mb-2 flex items-center gap-1">
                    <ShoppingBag className="w-3 h-3" /> Articoli simili trovati:
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {msg.groundingLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between text-xs bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-200 transition-colors text-indigo-600 hover:text-indigo-800 truncate"
                      >
                        <span className="truncate flex-1 mr-2">{link.title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-sm border border-slate-100 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-slate-100">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Scrivi un messaggio..."
            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;