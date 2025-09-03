
import React, { useState, useEffect, useCallback } from 'react';
import type { View, Consultation, Profile, DashboardAppointment, DashboardAnalysis, DashboardConsultation } from '../types';
import { supabase } from '../lib/supabaseClient';
import { 
    MessageSquare, Stethoscope, HeartPulse, Pill, Bone, FlaskConical, ClipboardList, 
    Store, HeartHandshake, Scan, BrainCircuit, Activity, Waves, Layers, MapPin, Leaf, Eye,
    Calendar, ChevronRight
} from 'lucide-react';
import ErrorState from './ErrorState';
import LoadingState from './LoadingState';

interface DashboardProps {
    setCurrentView: React.Dispatch<React.SetStateAction<View>>;
    onEmergency: () => void;
    onViewConsultation: (consultation: Consultation & { profiles?: Partial<Profile> }) => void;
}

interface DashboardData {
    appointments: DashboardAppointment[];
    analyses: DashboardAnalysis[];
    consultations: DashboardConsultation[];
}

const formatDistanceToNow = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    if (interval > 1) return `${Math.floor(interval)}m ago`;
    return `Just now`;
};

const analyzerTypeToInfo: Record<string, { view: View, name: string }> = {
    'xray': { view: 'xray-analyzer', name: 'CXR Analysis' },
    'lab_report': { view: 'lab-test-analyzer', name: 'Lab Report Analysis' },
    'prescription': { view: 'prescription-analyzer', name: 'Prescription Analysis' },
    'symptom_checker': { view: 'symptom-checker', name: 'Symptom Check' },
    'ct_scan': { view: 'ct-analyzer', name: 'CT Scan Analysis' },
    'mri_scan': { view: 'mri-analyzer', name: 'MRI Scan Analysis' },
    'ecg': { view: 'ecg-analyzer', name: 'ECG Analysis' },
    'eeg': { view: 'eeg-analyzer', name: 'EEG Analysis' },
    'derma_scan': { view: 'derma-scan-analyzer', name: 'Derma Scan Analysis' },
    'pain_locator': { view: 'pain-locator', name: 'Pain Location Analysis' },
    'prakruti-parikshana': { view: 'prakruti-parikshana', name: 'Prakruti Analysis' },
    'diabetic_retinopathy': { view: 'diabetic-retinopathy-analyzer', name: 'Diabetic Retinopathy Analysis' }
};

const ActionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    description: string;
    onClick: () => void;
    className?: string;
    style?: React.CSSProperties;
}> = ({ icon, title, description, onClick, className = '', style }) => (
    <button
        onClick={onClick}
        className={`bg-[hsl(var(--muted))] border border-[hsl(var(--border)_/_0.1)] hover:border-[hsl(var(--primary)_/_0.5)] hover:-translate-y-1 transition-all duration-300 w-full rounded-2xl p-6 text-left ${className}`}
        style={style}
    >
        <div className="mb-4 inline-block rounded-lg bg-[hsl(var(--primary))]/10 p-3 ring-8 ring-[hsl(var(--background))]/50">
            {icon}
        </div>
        <h3 className="text-xl font-bold text-[hsl(var(--card-foreground))]">{title}</h3>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
    </button>
);

const PersonalizedCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    children: React.ReactNode;
    ctaText?: string;
    onCtaClick?: () => void;
}> = ({ icon, title, children, ctaText, onCtaClick }) => (
    <div className="bg-[hsl(var(--card))] p-6 rounded-2xl shadow-lg flex flex-col h-full">
        <div className="flex items-center mb-4">
            {icon}
            <h3 className="text-lg font-bold text-[hsl(var(--card-foreground))] ml-3">{title}</h3>
        </div>
        <div className="flex-grow space-y-3">
            {children}
        </div>
        {ctaText && onCtaClick && (
            <button onClick={onCtaClick} className="mt-4 text-sm font-semibold text-[hsl(var(--primary))] hover:text-[hsl(var(--secondary))] flex items-center self-start">
                {ctaText} <ChevronRight className="h-4 w-4 ml-1" />
            </button>
        )}
    </div>
);

const Dashboard: React.FC<DashboardProps> = ({setCurrentView, onEmergency, onViewConsultation}) => {
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const [appointmentsRes, analysesRes, consultationsRes] = await Promise.all([
                supabase.from('appointments').select('id, start_at, profiles:doctor_id (full_name)').eq('patient_id', user.id).gt('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(2),
                supabase.from('ai_analysis_log').select('id, created_at, analyzer_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(2),
                supabase.from('consultations').select('id, subject, doctor_id, profiles:doctor_id (full_name, avatar_url)').eq('patient_id', user.id).is('ended_at', null).order('created_at', { ascending: false }).limit(2)
            ]);

            if (appointmentsRes.error) throw appointmentsRes.error;
            if (analysesRes.error) throw analysesRes.error;
            if (consultationsRes.error) throw consultationsRes.error;

            setDashboardData({
                appointments: (appointmentsRes.data as any[]).map(a => ({ id: a.id, start_at: a.start_at, doctor_name: a.profiles?.full_name })),
                analyses: analysesRes.data,
                consultations: (consultationsRes.data as any[]).map(c => ({ id: c.id, subject: c.subject, doctor_id: c.doctor_id, doctor_name: c.profiles?.full_name, doctor_avatar: c.profiles?.avatar_url })),
            });
        } catch (error: any) {
            console.error("Error fetching dashboard data:", error);
            setError(error.message || "Could not load your dashboard. Please try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const mainActions = [
        { view: 'symptom-checker', icon: <HeartPulse className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "AI Symptom Checker", description: "Get a preliminary analysis of your symptoms." },
        { view: 'connect-doctor', icon: <Stethoscope className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Connect with a Doctor", description: "Find the right doctor and start a chat." },
        { view: 'chatbot', icon: <MessageSquare className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "AI Triage Chat", description: "Describe symptoms for a quick analysis." },
        { view: 'medicine-search', icon: <Pill className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Medicine Database", description: "Search for medicine information." },
    ];

    const analyzerActions = [
        { view: 'xray-analyzer', icon: <Bone className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "CXR Analyzer", description: "Upload a chest X-ray for analysis." },
        { view: 'lab-test-analyzer', icon: <FlaskConical className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Lab Test Analyzer", description: "Get a bilingual AI-powered analysis." },
        { view: 'prescription-analyzer', icon: <ClipboardList className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Prescription Analyzer", description: "Upload a prescription for details." },
        { view: 'ct-analyzer', icon: <Scan className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "CT Scan Analyzer", description: "In-depth, AI-powered clinical report." },
        { view: 'mri-analyzer', icon: <BrainCircuit className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "MRI Scan Analyzer", description: "In-depth, AI-powered clinical report." },
        { view: 'ecg-analyzer', icon: <Activity className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "ECG Analyzer", description: "Detailed AI-powered interpretation." },
        { view: 'eeg-analyzer', icon: <Waves className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "EEG Analyzer", description: "Detailed AI-powered interpretation." },
        { view: 'derma-scan-analyzer', icon: <Layers className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Derma Scan Analyzer", description: "Analysis of skin conditions." },
        { view: 'diabetic-retinopathy-analyzer', icon: <Eye className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Diabetic Retinopathy", description: "Analyze fundus images for DR/DME." },
        { view: 'pain-locator', icon: <MapPin className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "AI Pain Locator", description: "Pinpoint pain for an AI-based analysis." },
    ];

    const utilityActions = [
        { view: 'pharmacies', icon: <Store className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Find Pharmacies", description: "Locate nearby pharmacies." },
        { view: 'donate', icon: <HeartHandshake className="text-[hsl(var(--primary))] h-8 w-8"/>, title: "Donate for Medical Aid", description: "Support our cause and medical aid." },
    ];

    if (loading) {
        return <LoadingState message="Loading your dashboard..." />;
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <ErrorState message={error} onRetry={fetchDashboardData} />
            </div>
        )
    }

    return (
        <div className="space-y-12 animate-slide-in">
            <div style={{ animationDelay: '100ms' }} className="animate-slide-in">
                <h1 className="text-4xl font-semibold text-[hsl(var(--card-foreground))] mb-2">
                    Welcome to the <span className="gradient-text">Future of Health</span>
                </h1>
                <p className="text-lg text-[hsl(var(--muted-foreground))]">Your trusted partner for instant medical assistance. Here's your health at a glance.</p>
            </div>
            
            <div style={{ animationDelay: '200ms' }} className="animate-slide-in grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <PersonalizedCard icon={<Calendar className="h-8 w-8 text-green-500" />} title="Upcoming Appointments" ctaText="View Full Schedule" onCtaClick={() => { /* Navigate to schedule view if it exists */ }}>
                    {dashboardData?.appointments.length ? dashboardData.appointments.map(appt => (
                        <div key={appt.id} className="text-sm p-3 bg-[hsl(var(--muted))] rounded-lg">
                            <p className="font-semibold text-slate-200">With Dr. {appt.doctor_name || 'N/A'}</p>
                            <p className="text-slate-400">{new Date(appt.start_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                    )) : <p className="text-sm text-slate-400">No upcoming appointments.</p>}
                </PersonalizedCard>
                <PersonalizedCard icon={<MessageSquare className="h-8 w-8 text-blue-500" />} title="Active Consultations" ctaText="View All Messages" onCtaClick={() => setCurrentView('messages')}>
                     {dashboardData?.consultations.length ? dashboardData.consultations.map(c => (
                        <div key={c.id} onClick={() => onViewConsultation(c as any)} className="text-sm p-3 bg-[hsl(var(--muted))] rounded-lg cursor-pointer hover:bg-[hsl(var(--muted))]/50">
                            <p className="font-semibold text-slate-200">Chat with Dr. {c.doctor_name}</p>
                            <p className="text-slate-400">{c.subject || 'General Consultation'}</p>
                        </div>
                    )) : <p className="text-sm text-slate-400">No active consultations.</p>}
                </PersonalizedCard>
                <PersonalizedCard icon={<Activity className="h-8 w-8 text-purple-500" />} title="Recent Analyses">
                     {dashboardData?.analyses.length ? dashboardData.analyses.map(a => {
                        const info = analyzerTypeToInfo[a.analyzer_type.replace(/_analyzer$/, '')];
                        return (
                            <div key={a.id} onClick={() => info && setCurrentView(info.view)} className="text-sm p-3 bg-[hsl(var(--muted))] rounded-lg cursor-pointer hover:bg-[hsl(var(--muted))]/50">
                                <p className="font-semibold text-slate-200">{info ? info.name : a.analyzer_type}</p>
                                <p className="text-slate-400">{formatDistanceToNow(a.created_at)}</p>
                            </div>
                        );
                    }) : <p className="text-sm text-slate-400">No recent analyses found.</p>}
                </PersonalizedCard>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {mainActions.map((action, index) => (
                     <ActionCard
                        key={action.view}
                        icon={action.icon}
                        title={action.title}
                        description={action.description}
                        onClick={() => setCurrentView(action.view as View)}
                        className="animate-slide-in"
                        style={{ animationDelay: `${300 + index * 100}ms` }}
                    />
                 ))}
            </div>

            <div style={{ animationDelay: '600ms' }} className="animate-slide-in">
                <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Your Wellness Journey</h2>
                <div 
                    onClick={() => setCurrentView('prakruti-parikshana')}
                    className="group relative w-full overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-[hsl(var(--secondary))]/10 cursor-pointer
                    bg-gradient-to-br from-[hsl(var(--primary))]/10 via-[hsl(var(--secondary))]/10 to-[hsl(var(--accent))]/10"
                >
                    <div className="absolute top-0 right-0 h-full w-1/3 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%236FFFCF%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50 transition-transform duration-500 group-hover:scale-110"></div>
                     <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-shrink-0 mb-4 md:mb-0 inline-block rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 p-5 ring-8 ring-[hsl(var(--card))]/50 shadow-lg">
                            <Leaf className="text-white h-12 w-12"/>
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-emerald-100">Discover Your Prakruti</h3>
                            <p className="mt-2 text-lg text-emerald-300">Take the Ayurvedic personality test to understand your unique mind-body constitution and get personalized wellness insights.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div style={{ animationDelay: '700ms' }} className="animate-slide-in">
                <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">AI Analyzers</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {analyzerActions.map((action, index) => (
                         <ActionCard
                            key={action.view}
                            icon={action.icon}
                            title={action.title}
                            description={action.description}
                            onClick={() => setCurrentView(action.view as View)}
                            className="animate-slide-in"
                            style={{ animationDelay: `${800 + index * 50}ms` }}
                        />
                     ))}
                </div>
            </div>
            
            <div style={{ animationDelay: '900ms' }} className="animate-slide-in">
                 <h2 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-6">Utilities & Support</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {utilityActions.map((action, index) => (
                         <ActionCard
                            key={action.view}
                            icon={action.icon}
                            title={action.title}
                            description={action.description}
                            onClick={() => setCurrentView(action.view as View)}
                            className="animate-slide-in"
                            style={{ animationDelay: `${1000 + index * 100}ms` }}
                        />
                     ))}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
