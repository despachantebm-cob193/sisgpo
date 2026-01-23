import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import api from '@/services/api';

type Message = {
    id: string;
    sender: 'user' | 'ai';
    text: string;
};

const ChatWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: 'ai', text: 'Sistemas Operacionais online. Sou a IA do SISGPO. Em que posso auxiliar o comando hoje?' }
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: inputValue };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const contextMessages = messages.slice(-5).map(m => ({
                role: m.sender === 'user' ? 'user' : 'assistant',
                content: m.text
            }));

            const response = await api.post('/api/ai/chat', {
                question: userMsg.text,
                history: contextMessages
            });
            const aiText = response.data.answer;

            const aiMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: aiText };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error('Erro no chat:', error);
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: 'Erro de comunicação com o núcleo de IA.' };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSend();
    };

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <div className="mb-4 w-80 sm:w-96 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-[#0a0d14]/95 backdrop-blur-xl border border-cyan-500/20 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right h-[500px] ring-1 ring-cyan-500/10">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-cyan-900/40 to-slate-900/40 border-b border-cyan-500/20 p-4 flex justify-between items-center relative overflow-hidden">
                        {/* Scanline */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_4px,rgba(34,211,238,0.05)_4px)] bg-[size:100%_8px] pointer-events-none" />

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="p-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_10px_cyan]">
                                <Bot className="w-5 h-5 text-cyan-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm tracking-widest uppercase text-white font-mono">I.A. SISGPO</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse" />
                                    <span className="text-[9px] text-cyan-500/70 uppercase tracking-wider font-bold">Online</span>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-cyan-500/10 p-1.5 rounded-lg transition-colors text-cyan-400/70 hover:text-cyan-400 relative z-10">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 relative">
                        {/* Background Grid */}
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-3 relative z-10 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 shadow-lg ${msg.sender === 'user'
                                        ? 'bg-slate-800 border-slate-600'
                                        : 'bg-cyan-950/30 border-cyan-500/30 shadow-[0_0_10px_rgba(34,211,238,0.1)]'
                                    }`}>
                                    {msg.sender === 'user' ? <User className="w-4 h-4 text-slate-300" /> : <Sparkles className="w-4 h-4 text-cyan-400" />}
                                </div>

                                <div className={`max-w-[85%] rounded-xl px-4 py-3 text-sm font-mono leading-relaxed border backdrop-blur-md shadow-md ${msg.sender === 'user'
                                        ? 'bg-slate-800/80 border-slate-600 text-slate-200 rounded-tr-none'
                                        : 'bg-[#0f141e]/80 border-cyan-500/20 text-cyan-100 rounded-tl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-3 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-cyan-400 animate-spin-slow" />
                                </div>
                                <div className="bg-[#0f141e]/80 px-4 py-3 rounded-xl rounded-tl-none border border-cyan-500/20 text-xs text-cyan-500/50 font-mono tracking-widest animate-pulse">
                                    PROCESSANDO RESPOSTA...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-[#0a0d14] border-t border-cyan-500/20 flex gap-2 items-center relative z-20">
                        <input
                            type="text"
                            className="flex-1 bg-[#131722] border border-slate-700/50 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all font-mono shadow-inner"
                            placeholder="Digite seu comando..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white p-2.5 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] border border-cyan-400/20"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button Sci-Fi */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative group bg-[#0a0d14] hover:bg-cyan-950/30 text-cyan-400 p-4 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all duration-300 hover:scale-105 border border-cyan-500/30 ring-1 ring-cyan-500/20"
                    aria-label="Abrir assistente virtual"
                >
                    {/* Inner Hexagon or Tech Shape */}
                    <div className="absolute inset-0 bg-cyan-500/5 rounded-2xl animate-pulse-slow pointer-events-none" />

                    {/* Ping Effect */}
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-[#0a0d14]"></span>
                    </span>

                    <Bot className="w-8 h-8 drop-shadow-[0_0_8px_cyan]" />
                </button>
            )}
        </div>
    );
};

export default ChatWidget;
