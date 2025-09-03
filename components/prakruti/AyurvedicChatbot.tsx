import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../../types';
import { runAyurvedicChatStream } from '../../services/geminiService';

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-emerald-600 dark:text-emerald-500">{part.slice(2, -2)}</strong>;
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

interface AyurvedicChatbotProps {
    prakrutiType: string;
}

const AyurvedicChatbot: React.FC<AyurvedicChatbotProps> = ({ prakrutiType }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        setMessages([
            { role: 'assistant', content: `Hello! I'm your personalized Ayurvedic assistant. I see your constitution is **${prakrutiType}**. How can I help you today?` }
        ]);
    }, [prakrutiType]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading) return;

        const newUserMessage: ChatMessage = { role: 'user', content: userInput };
        const historyForAPI = [...messages, newUserMessage];

        setMessages(prev => [...prev, newUserMessage, { role: 'assistant', content: '' }]);
        setUserInput('');
        setIsLoading(true);

        try {
            const stream = runAyurvedicChatStream(prakrutiType, historyForAPI);
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
            console.error('Error with Ayurvedic Chat:', error);
            setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage?.role === 'assistant') {
                    lastMessage.content = 'Sorry, an error occurred. Please try again.';
                }
                return updatedMessages;
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-[60vh] bg-white dark:bg-slate-800 rounded-b-xl overflow-hidden">
            <div className="flex-1 p-6 overflow-y-auto bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-4">
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">AI</div>
                            )}
                            <div
                                className={`px-4 py-3 rounded-2xl max-w-lg ${
                                    msg.role === 'user'
                                        ? 'bg-emerald-500 text-white rounded-br-none'
                                        : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'
                                }`}
                            >
                                {msg.content === '' ? <span className="animate-pulse">...</span> : <MarkdownRenderer content={msg.content} />}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={`Ask about your ${prakrutiType} constitution...`}
                        className="flex-1 p-3 bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={isLoading || !userInput.trim()}
                        className="p-3 bg-emerald-500 text-white rounded-xl disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-emerald-600 transition-colors"
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AyurvedicChatbot;
