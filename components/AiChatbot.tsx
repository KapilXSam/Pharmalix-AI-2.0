import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot } from 'lucide-react';
import type { ChatMessage } from '../types';
import { runGeminiChatStream } from '../services/geminiService';
import { VoiceInputButton } from './VoiceInputButton';

// FIX: framer-motion types can conflict with other libraries (like @react-three/fiber).
// Aliasing motion.div to a local, capitalized constant helps TypeScript's JSX parser
// correctly resolve it as a component with the right props.
const MotionDiv = motion.div;

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string) => {
        if (line.trim().startsWith('**CRITICAL:**')) {
            return <span className="font-bold text-[hsl(var(--destructive))]">{line.replace(/\*\*/g, '')}</span>;
        }
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-[hsl(var(--primary))]">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </>
        );
    };

    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    const lines = content.split('\n');

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            currentList.push(trimmedLine.substring(2));
        } else {
            if (currentList.length > 0) {
                elements.push(
                    <ul key={`ul-${index}`} className="list-disc list-inside space-y-1 my-2">
                        {currentList.map((item, j) => <li key={j}>{renderLine(item)}</li>)}
                    </ul>
                );
                currentList = [];
            }
            if (trimmedLine) {
                 elements.push(<p key={index}>{renderLine(trimmedLine)}</p>);
            }
        }
    });

    if (currentList.length > 0) {
        elements.push(
            <ul key="ul-end" className="list-disc list-inside space-y-1 my-2">
                {currentList.map((item, j) => <li key={j}>{renderLine(item)}</li>)}
            </ul>
        );
    }
    return <div className="space-y-2">{elements}</div>;
};

const AiChatbot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        const initialAiMessage: ChatMessage = {
            role: 'assistant',
            content: "IMPORTANT: I am an AI assistant and not a substitute for a real doctor. My advice is for informational purposes only. Please consult a healthcare professional for any medical concerns. For emergencies, please call your local emergency number immediately.\n\nHow can I help you today?"
        };
        setMessages([initialAiMessage]);
    }, []);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;
        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        const historyForAPI = [...messages, newUserMessage];
        setMessages(prev => [...prev, newUserMessage, { role: 'assistant', content: '' }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = runGeminiChatStream(historyForAPI);
            let aiResponseText = '';
            for await (const chunk of stream) {
                aiResponseText += chunk;
                setMessages(prev => {
                    const updatedMessages = [...prev];
                    const lastMessage = updatedMessages[updatedMessages.length - 1];
                    if (lastMessage?.role === 'assistant') {
                        lastMessage.content = aiResponseText;
                    }
                    return updatedMessages;
                });
            }
        } catch (error) {
            console.error('Error with Gemini API:', error);
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                    lastMessage.content = 'Sorry, I encountered an error. Please try again.';
                }
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <MotionDiv
            className="flex flex-col h-full max-w-4xl mx-auto bg-[hsl(var(--card))]/50 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="flex-1 p-6 overflow-y-auto chat-background flex flex-col space-y-4" aria-live="polite">
                {messages.map((msg, index) => (
                    <MotionDiv
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'self-end' : 'self-start'}`}
                    >
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] flex items-center justify-center text-[hsl(var(--primary-foreground))] font-bold flex-shrink-0">
                                <Bot size={20} />
                            </div>
                        )}
                         <div
                            className={`px-4 py-3 rounded-2xl shadow-md ${
                                msg.role === 'user'
                                    ? 'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] text-[hsl(var(--primary-foreground))] rounded-br-none'
                                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--card-foreground))] rounded-bl-none'
                            }`}
                        >
                            {msg.content === '' ? <span className="animate-pulse">...</span> : <MarkdownRenderer content={msg.content} />}
                        </div>
                    </MotionDiv>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-[hsl(var(--border))]/20 bg-[hsl(var(--card))]/50">
                <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Describe your symptoms here..."
                            disabled={isLoading}
                            className="w-full px-5 py-3 pr-12 rounded-full bg-[hsl(var(--input))] text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]"
                        />
                         <VoiceInputButton
                            onTranscriptUpdate={(transcript) => setUserInput(prev => `${prev}${transcript}`)}
                            className="absolute right-2 top-1/2 -translate-y-1/2"
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !userInput.trim()}
                        className="p-3.5 rounded-full bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--secondary))] hover:opacity-90 transition shadow-md disabled:from-slate-500 disabled:to-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </MotionDiv>
    );
};

export default AiChatbot;