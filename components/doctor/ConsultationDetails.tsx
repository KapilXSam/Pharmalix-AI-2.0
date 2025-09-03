

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Consultation, Profile } from '../../types';
import type { Database } from '../../types';
import { ArrowLeft, User, Send, Paperclip, FileText, Loader2, MessageSquare, StickyNote, Check, PhoneOff } from 'lucide-react';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { useWebRTC } from '../../hooks/useWebRTC';
import LazyImage from '../LazyImage';
import VideoIcon from '../icons/VideoIcon';
import IncomingCallModal from '../IncomingCallModal';
import VideoCall from '../VideoCall';
import { VoiceInputButton } from '../VoiceInputButton';

interface ConsultationDetailsProps {
    consultationId: number;
    onBack: () => void;
}

type PatientProfile = Profile & {
    patient_details: Database['public']['Tables']['patient_details']['Row'] | null;
};
type Message = Database['public']['Tables']['consultation_messages']['Row'];
type Tab = 'soap' | 'chat';

const ConsultationDetails: React.FC<ConsultationDetailsProps> = ({ consultationId, onBack }) => {
    const [consultation, setConsultation] = useState<Consultation | null>(null);
    const [patient, setPatient] = useState<PatientProfile | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [soapNotes, setSoapNotes] = useState({ subjective: '', objective: '', assessment: '', plan: '' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<Tab>('chat');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // WebRTC Hook Integration
    const { localStream, remoteStream, isCallActive, incomingCall, startCall, answerCall, endCall } = useWebRTC(userId, consultationId);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const fetchDetails = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication error.");
            setUserId(user.id);

            const { data: consultData, error: consultError } = await supabase.from('consultations').select('*').eq('id', consultationId).single();
            if (consultError || !consultData) throw consultError || new Error("Consultation not found.");
            setConsultation(consultData);
            setSoapNotes({
                subjective: consultData.subjective || '',
                objective: consultData.objective || '',
                assessment: consultData.assessment || '',
                plan: consultData.plan || '',
            });

            const { data: patientData, error: patientError } = await supabase.from('profiles').select('*, patient_details(*)').eq('id', consultData.patient_id).single();
            if (patientError) throw patientError;
            setPatient(patientData as PatientProfile);

            const { data: messageData, error: messageError } = await supabase.from('consultation_messages').select('*').eq('consultation_id', consultationId).order('created_at');
            if (messageError) throw messageError;
            setMessages(messageData || []);
        } catch (err: any) {
            setError(err.message || 'Failed to load consultation details.');
        } finally {
            setLoading(false);
        }
    }, [consultationId]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    useEffect(() => {
        const channel = supabase.channel(`consultation-${consultationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'consultation_messages', filter: `consultation_id=eq.${consultationId}` }, payload => {
                setMessages(prev => [...prev, payload.new as Message]);
            }).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [consultationId]);
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !userId) return;

        setIsUploading(true);
        const filePath = `public/${consultationId}/${Date.now()}-${file.name}`;
        
        try {
            const { error: uploadError } = await supabase.storage.from('consultation_uploads').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('consultation_uploads').getPublicUrl(filePath);

            const fileMessageContent = JSON.stringify({ url: publicUrl, name: file.name, type: file.type });

            const { error: insertError } = await supabase.from('consultation_messages').insert({
                consultation_id: consultationId, sender_id: userId, content: fileMessageContent, message_type: 'file',
            });
            if (insertError) throw insertError;
        } catch (err) { console.error("File upload failed:", err); } 
        finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId) return;
        const content = newMessage;
        setNewMessage('');
        await supabase.from('consultation_messages').insert({ consultation_id: consultationId, sender_id: userId, content });
    };

    const handleSaveNotes = async () => {
        setIsSaving(true);
        const { error: saveError } = await supabase.from('consultations').update(soapNotes).eq('id', consultationId);
        if (saveError) setError(saveError.message);
        setIsSaving(false);
    };

    const handleCompleteConsultation = async () => {
        await handleSaveNotes();
        const { error: updateError } = await supabase.from('consultations').update({ ended_at: new Date().toISOString(), status: 'Completed' }).eq('id', consultationId);
        if (updateError) setError(updateError.message); else onBack();
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
            } catch { return <p className="text-xs text-red-500">[Error displaying file]</p>; }
        }
        return <p className="whitespace-pre-wrap">{msg.content}</p>;
    };

    if (loading) return <LoadingState message="Loading Consultation Room..." />;
    if (error) return <ErrorState message={error} onRetry={fetchDetails} />;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-xl shadow-2xl overflow-hidden animate-fadeIn">
            {isCallActive && <VideoCall localStream={localStream} remoteStream={remoteStream} onEndCall={endCall} />}
            {incomingCall && <IncomingCallModal callerName={patient?.full_name || 'Patient'} onAccept={answerCall} onDecline={endCall} />}

            <header className="flex items-center p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack} className="mr-2"><ArrowLeft className="h-5 w-5" /></Button>
                <LazyImage src={patient?.avatar_url || `https://i.pravatar.cc/40?u=${patient?.id}`} alt="Patient" className="w-10 h-10 rounded-full mr-3" />
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{patient?.full_name || 'Patient'}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Consultation ID: {consultationId}</p>
                </div>
                 <div className="ml-auto flex items-center gap-2">
                    {!consultation?.ended_at && !isCallActive && activeTab === 'chat' && (
                        <Button onClick={startCall} variant="ghost" size="icon" className="text-slate-500">
                            <VideoIcon className="h-5 w-5" />
                        </Button>
                    )}
                     {isCallActive && (
                        <Button onClick={endCall} variant="destructive" size="sm" className="flex items-center gap-2">
                            <PhoneOff className="h-4 w-4" /> End Call
                        </Button>
                    )}
                    <Button onClick={handleCompleteConsultation} size="sm" className="bg-green-600 hover:bg-green-700">
                        <Check className="h-4 w-4 mr-2" /> Complete
                    </Button>
                </div>
            </header>

             <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button onClick={() => setActiveTab('chat')} className={cn("flex items-center gap-2 px-4 py-3 font-semibold text-sm", activeTab === 'chat' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}><MessageSquare className="h-4 w-4"/>Live Chat</button>
                <button onClick={() => setActiveTab('soap')} className={cn("flex items-center gap-2 px-4 py-3 font-semibold text-sm", activeTab === 'soap' ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800')}><StickyNote className="h-4 w-4"/>SOAP Notes</button>
            </div>

            {activeTab === 'soap' ? (
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {['subjective', 'objective', 'assessment', 'plan'].map(field => (
                        <div key={field}>
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 capitalize">{field}</label>
                            <Textarea value={soapNotes[field as keyof typeof soapNotes]} onChange={e => setSoapNotes(s => ({ ...s, [field]: e.target.value }))} className="mt-1" rows={4} />
                        </div>
                    ))}
                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSaveNotes} loading={isSaving}>Save Notes</Button>
                    </div>
                </div>
            ) : (
                 <div className="flex-1 flex flex-col overflow-hidden chat-background">
                     <main className="flex-1 p-6 overflow-y-auto" aria-live="polite">
                        <div className="space-y-4">
                            {messages.map(msg => {
                                const isSender = msg.sender_id === userId;
                                return (
                                    <div key={msg.id} className={`flex items-end gap-2.5 ${isSender ? 'justify-end' : 'justify-start'}`}>
                                        {!isSender && (<LazyImage src={patient?.avatar_url || `https://i.pravatar.cc/32?u=${patient?.id}`} alt="Patient" className="w-8 h-8 rounded-full flex-shrink-0" />)}
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
                    </main>
                    <footer className="p-4 bg-white dark:bg-slate-800/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700">
                        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                            <Button type="button" variant="ghost" size="icon" className="text-slate-500 flex-shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                            </Button>
                            <div className="relative flex-1">
                                <Textarea value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); }}} placeholder="Type a message..." className="w-full rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-0 h-11 resize-none pr-12" rows={1} />
                                <VoiceInputButton onTranscriptUpdate={(t) => setNewMessage(p => `${p}${t}`)} className="absolute right-2 top-1/2 -translate-y-1/2"/>
                            </div>
                            <Button type="submit" disabled={!newMessage.trim()} size="icon" className="flex-shrink-0"><Send className="h-5 w-5" /></Button>
                        </form>
                    </footer>
                </div>
            )}
        </div>
    );
};

export default ConsultationDetails;