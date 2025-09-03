import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import { runFollowUpChatStream } from '../services/geminiService';
import { X, Bot } from 'lucide-react';
import { Button } from './ui/Button';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string) => {
        if (line.trim().startsWith('**CRITICAL:**')) {
            return <span className="font-bold text-red-600 dark:text-red-400">{line.replace(/\*\*/g, '')}</span>;
        }

        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-sky-600 dark:text-sky-500">{part.slice(2, -2)}</strong>;
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

interface FollowUpChatProps {
    reportTitle: string;
    reportData: object;
    onClose: () => void;
}

const FollowUpChat: React.FC<FollowUpChatProps> = ({ reportTitle, reportData, onClose }) => {
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
        const initialMessage: ChatMessage = {
            role: 'assistant',
            content: `I have reviewed your **${reportTitle}**. How can I help you understand the results?`,
        };
        setMessages([initialMessage]);
    }, [reportTitle]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        const historyForAPI = [...messages, newUserMessage];
        
        setMessages(prev => [...prev, newUserMessage, { role: 'assistant', content: '' }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = runFollowUpChatStream(reportData, historyForAPI);
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
            console.error('Error with Follow-up Chat:', error);
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-scaleIn" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <Bot className="h-6 w-6 text-sky-500" />
                        <h2 className="font-bold text-lg text-slate-800 dark:text-white">Chat about your {reportTitle}</h2>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
                </header>
                <main className="flex-1 p-6 overflow-y-auto">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                {msg.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-sky-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                                )}
                                <div className={`px-4 py-3 rounded-2xl max-w-lg ${ msg.role === 'user' ? 'bg-sky-500 text-white rounded-br-none' : 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'}`}>
                                    {msg.content === '' ? <span className="animate-pulse">...</span> : <MarkdownRenderer content={msg.content} />}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </main>
                <footer className="p-4 border-t border-slate-200 dark:border-slate-700">
                     <div className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Ask a question about your report..."
                            className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={isLoading || !userInput.trim()}
                            className="p-3 bg-sky-500 text-white rounded-xl disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors"
                        >
                           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default FollowUpChat;
