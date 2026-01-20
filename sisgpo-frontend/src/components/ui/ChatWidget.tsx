
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, User } from 'lucide-react';
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
        { id: '1', sender: 'ai', text: 'Olá! Sou seu assistente de Inteligência Artificial do SISGPO. Posso responder perguntas sobre militares, viaturas e OBMs. Como posso ajudar?' }
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
            // Send history for context (last 5 messages)
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
            const errorMsg: Message = { id: (Date.now() + 1).toString(), sender: 'ai', text: 'Desculpe, não consegui processar sua pergunta no momento.' };
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
                <div className="mb-4 w-80 sm:w-96 rounded-2xl shadow-2xl bg-white border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 transform origin-bottom-right h-[500px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 flex justify-between items-center shadow-md">
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6 animate-pulse" />
                            <h3 className="font-bold text-lg tracking-wide">Assistente SISGPO</h3>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-indigo-100' : 'bg-red-100'}`}>
                                    {msg.sender === 'user' ? <User className="w-5 h-5 text-indigo-600" /> : <Bot className="w-5 h-5 text-red-600" />}
                                </div>

                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${msg.sender === 'user'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5 text-red-600" />
                                </div>
                                <div className="bg-white px-4 py-2 rounded-2xl rounded-bl-none border border-gray-100 text-sm text-gray-400 italic">
                                    Digitando...
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center">
                        <input
                            type="text"
                            className="flex-1 border-gray-200 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none border transition-all"
                            placeholder="Pergunte sobre militares, viaturas..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="relative bg-red-600 hover:bg-red-500 text-white p-4 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.6)] transition-all duration-300 transform hover:scale-110 flex items-center gap-2 group ring-4 ring-red-300/50 animate-bounce-slow"
                    aria-label="Abrir assistente virtual"
                >
                    {/* Notification Ping */}
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white"></span>
                    </span>

                    <Bot className="w-8 h-8" />
                </button>
            )}
        </div>
    );
};

export default ChatWidget;
