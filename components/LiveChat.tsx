

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile, Consultation } from '../types';
import type { Database } from '../types';
import { ArrowLeft, Send, User, Paperclip, FileText, Loader2, PhoneOff, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { useWebRTC } from '../hooks/useWebRTC';
import VideoIcon from './icons/VideoIcon';
import LazyImage from './LazyImage';
import IncomingCallModal from './IncomingCallModal';
import VideoCall from './VideoCall';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { VoiceInputButton } from './VoiceInputButton';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    // WebRTC Hook Integration
    const { localStream, remoteStream, isCallActive, incomingCall, startCall, answerCall, endCall } = useWebRTC(userId, consultationId);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);

            const { data: consultData, error: consultError } = await supabase
                .from('consultations')
                .select('*')
                .eq('id', consultationId)
                .single();
            
            if (consultError) throw consultError;
            setConsultation(consultData);

            const { data: messageData, error: messageError } = await supabase
                .from('consultation_messages')
                .select('*')
                .eq('consultation_id', consultationId)
                .order('created_at', { ascending: true });
            
            if (messageError) throw messageError;
            setMessages(messageData || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load chat history.');
        } finally {
            setIsLoading(false);
        }
    }, [consultationId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);


    useEffect(() => {
        const messagesChannel = supabase.channel(`live-chat-messages-${consultationId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'consultation_messages',
                filter: `consultation_id=eq.${consultationId}`
            },
                (payload) => {
                    const newMessage = payload.new as Message;
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMessage.id)) return prev;
                        return [...prev, newMessage];
                    });
                }
            ).subscribe();

        const consultationChannel = supabase.channel(`consultation-status-${consultationId}`)
            .on('postgres_changes', { 
                event: 'UPDATE', 
                schema: 'public', 
                table: 'consultations',
                filter: `id=eq.${consultationId}`
             },
                (payload) => {
                    setConsultation(payload.new as Consultation);
                }
            ).subscribe();

        return () => {
            supabase.removeChannel(messagesChannel);
            supabase.removeChannel(consultationChannel);
        };
    }, [consultationId]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) return;

        setIsUploading(true);
        const filePath = `public/${consultationId}/${Date.now()}-${file.name}`;
        
        try {
            const { error: uploadError } = await supabase.storage
                .from('consultation_uploads')
                .upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('consultation_uploads')
                .getPublicUrl(filePath);

            const fileMessageContent = JSON.stringify({
                url: publicUrl,
                name: file.name,
                type: file.type,
            });

            const { error: insertError } = await supabase.from('consultation_messages').insert({
                consultation_id: consultationId,
                sender_id: userId,
                content: fileMessageContent,
                message_type: 'file',
            });
            if (insertError) throw insertError;

        } catch (error) {
            console.error("File upload failed:", error);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;

        const messageContent = newMessage.trim();
        setNewMessage('');

        const { error } = await supabase
            .from('consultation_messages')
            .insert({ consultation_id: consultationId, sender_id: userId, content: messageContent });

        if (error) {
            console.error("Error sending message:", error);
            setNewMessage(messageContent);
        }
    };

    const renderMessageContent = (msg: Message) => {
        if (msg.message_type === 'file' && msg.content) {
            try {
                const fileData = JSON.parse(msg.content);
                return (
                    <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 bg-slate-200/50 dark:bg-slate-600/50 rounded-lg hover:bg-slate-300/50 dark:hover:bg-slate-500/50">
                        <FileText className="h-6 w-6 text-slate-500 dark:text-slate-300" />
                        <span className="text-sm font-medium truncate">{fileData.name}</span>
                    </a>
                );
            } catch {
                return <p className="text-xs text-red-500">[Error displaying file]</p>;
            }
        }
        return <p className="whitespace-pre-wrap">{msg.content}</p>;
    };
    
    const getStatusText = () => {
        if (!consultation) return 'Connecting...';
        return consultation.ended_at ? 'Completed' : 'Active';
    }

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {isCallActive && <VideoCall localStream={localStream} remoteStream={remoteStream} onEndCall={endCall} />}
            {incomingCall && <IncomingCallModal callerName={doctor.full_name || 'Doctor'} onAccept={answerCall} onDecline={endCall} />}

            <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                 {doctor.avatar_url ? (
                    <LazyImage src={doctor.avatar_url} alt={doctor.full_name || 'Doctor'} className="w-10 h-10 rounded-full mr-3" />
                 ) : (<div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mr-3">
                    <User className="w-5 h-5 text-slate-500" />
                </div>)}
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{doctor.full_name}</h3>
                    <p className={`text-xs font-semibold capitalize ${consultation?.ended_at ? 'text-blue-500' : 'text-green-500'}`}>
                        {getStatusText()}
                    </p>
                </div>
                <div className="ml-auto">
                    {!consultation?.ended_at && !isCallActive && (
                        <Button onClick={startCall} variant="ghost" size="icon" className="text-slate-500">
                            <VideoIcon className="h-5 w-5" />
                        </Button>
                    )}
                     {isCallActive && (
                        <Button onClick={endCall} variant="destructive" size="sm" className="flex items-center gap-2">
                            <PhoneOff className="h-4 w-4" /> End Call
                        </Button>
                    )}
                </div>
            </header>
            
            {isLoading ? (
                <div className="flex-1 flex items-center justify-center">
                    <LoadingState message="Loading chat..." />
                </div>
            ) : error ? (
                <div className="flex-1 flex items-center justify-center p-4">
                    <ErrorState message={error} onRetry={fetchInitialData} />
                </div>
            ) : consultation && consultation.ended_at === null ? (
                <>
                    <main className="flex-1 p-6 overflow-y-auto chat-background" aria-live="polite">
                        {messages.length === 0 ? (
                            <div className="text-center text-slate-500 dark:text-slate-400 py-8">
                                <p>This is the beginning of your secure consultation with Dr. {doctor.full_name}.</p>
                                <p className="text-xs mt-2">Messages are end-to-end encrypted.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((msg) => {
                                    const isSender = msg.sender_id === userId;
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                            {!isSender && (doctor.avatar_url ? (
                                                <LazyImage src={doctor.avatar_url} alt={doctor.full_name || 'Doctor'} className="w-8 h-8 rounded-full flex-shrink-0" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-500 dark:text-slate-300"/></div>
                                            )
                                            )}
                                            <div className={`flex flex-col max-w-lg p-3 rounded-2xl ${isSender ? 'bg-sky-500 text-white rounded-br-none' : 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none shadow-sm'}`}>
                                                {renderMessageContent(msg)}
                                                <span className={`text-xs mt-1.5 ${isSender ? 'text-sky-100' : 'text-slate-400'} text-right`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>
                        )}
                    </main>
                    <footer className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <Button type="button" variant="ghost" size="icon" className="text-slate-500 flex-shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                            </Button>
                            <div className="relative flex-1">
                                <Textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}}
                                    placeholder="Type a message..."
                                    className="w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-0 h-11 resize-none pr-12"
                                    rows={1}
                                />
                                <VoiceInputButton onTranscriptUpdate={(t) => setNewMessage(p => `${p}${t}`)} className="absolute right-2 top-1/2 -translate-y-1/2"/>
                            </div>
                            <Button type="submit" disabled={!newMessage.trim()} size="icon" className="flex-shrink-0">
                            <Send className="h-5 w-5" />
                            </Button>
                        </form>
                    </footer>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <MessageSquare className="h-16 w-16 mb-4 text-slate-400" />
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white">Consultation Completed</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-sm">This chat is now closed. You can view the history in your messages.</p>
                    <Button onClick={onBack} className="mt-6">Back to Messages</Button>
                </div>
            )}
        </div>
    );
};

export default LiveChat;