


import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile, Consultation } from '../types';
import type { Database } from '../types';
import { ArrowLeft, Send, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';

interface LiveChatProps {
    consultationId: number;
    doctor: Profile;
    onBack: () => void;
}

type Message = Database['public']['Tables']['consultation_messages']['Row'];

const LiveChat: React.FC<LiveChatProps> = ({ consultationId, doctor, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [userId, setUserId] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoading(true);
            // FIX: Cast supabase.auth to any to resolve missing 'getUser' method error.
            const { data: { user } } = await (supabase.auth as any).getUser();
            if (user) setUserId(user.id);

            const { data: consultData, error: consultError } = await supabase
                .from('consultations')
                .select('*')
                .eq('id', consultationId)
                .single();
            
            if (consultError) console.error("Error fetching consultation:", consultError);
            else setConsultation(consultData);

            const { data: messageData, error: messageError } = await supabase
                .from('consultation_messages')
                .select('*')
                .eq('consultation_id', consultationId)
                .order('created_at', { ascending: true });
            
            if (messageError) console.error("Error fetching messages:", messageError);
            else setMessages(messageData || []);
            setIsLoading(false);
        };
        fetchInitialData();
    }, [consultationId]);


    useEffect(() => {
        const messagesChannel = supabase.channel(`public:consultation_messages:consultation_id=eq.${consultationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_messages' },
                (payload) => {
                    const newMessage = payload.new as Message;
                    if (newMessage.sender_id !== userId) {
                         setMessages((prev) => [...prev, newMessage]);
                    }
                }
            ).subscribe();

        const consultationChannel = supabase.channel(`public:consultations:id=eq.${consultationId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'consultations' },
                (payload) => {
                    setConsultation(payload.new as Consultation);
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(consultationChannel);
        };
    }, [consultationId, userId]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;

        const messageContent = newMessage.trim();
        const optimisticMessage: Message = {
            id: Date.now(),
            consultation_id: consultationId,
            sender_id: userId,
            content: messageContent,
            message_type: 'text',
            created_at: new Date().toISOString(),
            file_id: null,
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setNewMessage('');

        const { error } = await supabase
            .from('consultation_messages')
            .insert([{ consultation_id: consultationId, sender_id: userId, content: messageContent }]);

        if (error) {
            console.error("Error sending message:", error);
            setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
            setNewMessage(messageContent);
        }
    };

    const renderStatusView = () => {
        if (!consultation) return null;

        const isCompleted = !!consultation.ended_at;

        if (isCompleted) {
            return (
                 <div className="flex flex-col items-center justify-center h-full text-center p-8">
                    <CheckCircle className="h-16 w-16 mb-4 text-blue-500" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Consultation Completed</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">This chat has been marked as complete. You can view the history in your messages.</p>
                </div>
            )
        }
        
        // Default to a pending/waiting state if not completed and not confirmed for chat.
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Clock className={`h-16 w-16 mb-4 text-yellow-500`} />
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Waiting for Doctor</h3>
                <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">Please wait for the doctor to join and start the consultation.</p>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            <div className="flex items-center p-3 border-b border-slate-200 dark:border-slate-700">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                 <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mr-3">
                    <User className="w-5 h-5 text-slate-500" />
                </div>
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{doctor.full_name}</h3>
                    {/* FIX: Replaced consultation.status with consultation.ended_at to determine status. */}
                    <p className={`text-xs font-semibold ${consultation?.ended_at ? 'text-blue-500' : 'text-green-500'}`}>
                        {consultation?.ended_at ? 'Completed' : 'Active'}
                    </p>
                </div>
            </div>
            
            {/* FIX: Replaced consultation.status check with ended_at to handle chat UI visibility. */}
            {consultation && !consultation.ended_at ? (
                <>
                    <div className="flex-1 p-6 overflow-y-auto">
                        {isLoading ? (
                            <p className="text-center text-slate-500">Loading chat...</p>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={`flex items-end gap-2 ${msg.sender_id === userId ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`px-4 py-3 rounded-2xl max-w-lg whitespace-pre-wrap ${
                                                msg.sender_id === userId
                                                    ? 'bg-sky-500 text-white rounded-br-none'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                            }`}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                         <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                            <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                placeholder="Type a message..."
                                className="flex-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-0 h-12"
                                rows={1}
                            />
                            <Button type="submit" disabled={!newMessage.trim()} size="icon">
                               <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </div>
                </>
            ) : (
                 <div className="flex-1 overflow-y-auto">
                    {isLoading ? <p className="text-center text-slate-500 p-8">Loading consultation status...</p> : renderStatusView()}
                </div>
            )}
        </div>
    );
};

export default LiveChat;