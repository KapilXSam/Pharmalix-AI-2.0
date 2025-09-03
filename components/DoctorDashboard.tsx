
import React, { useState, useEffect, useCallback } from 'react';
import type { Consultation, DoctorView, DoctorDashboardStats, UpcomingAppointment, RecentActivity } from '../types';
import { supabase } from '../lib/supabaseClient';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { Users, CalendarDays, Clock, UserPlus, ClipboardCheck } from 'lucide-react';
import { Button } from './ui/Button';
import BarChartIcon from './icons/BarChartIcon';

interface DoctorDashboardProps {
    setCurrentView: (view: DoctorView) => void;
    onManageConsultation: (consultationId: number) => void;
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
    return `${Math.floor(seconds)}s ago`;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; onClick?: () => void }> = ({ title, value, icon, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-white dark:bg-slate-800 p-5 rounded-xl shadow-md flex items-center space-x-4 transition-all duration-300 ${onClick ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1' : ''}`}
    >
        <div className="p-3 bg-[hsl(var(--primary))]/10 rounded-lg">
            {icon}
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
    </div>
);

const ActiveConsultationCard: React.FC<{ 
    consultation: Consultation;
    onManage: (id: number) => void;
}> = ({ consultation, onManage }) => (
    <div onClick={() => onManage(consultation.id)} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 animate-fadeIn">
        <div className="flex items-center space-x-3 overflow-hidden">
            <img src={consultation.patient_avatar || `https://i.pravatar.cc/40?u=${consultation.patient_id}`} alt="Patient" className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="truncate">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{consultation.patient_name || 'Patient'}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{consultation.subject}</p>
            </div>
        </div>
    </div>
);


const UpNextCard: React.FC<{ appointment: UpcomingAppointment | null; onManage: (id: number) => void; }> = ({ appointment, onManage }) => (
    <div className="bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--secondary))] p-6 rounded-xl shadow-lg text-white">
        <h3 className="font-bold text-xl mb-4">Up Next</h3>
        {appointment ? (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <img src={appointment.patient_avatar || `https://i.pravatar.cc/48?u=${appointment.patient_name}`} alt="Patient" className="w-12 h-12 rounded-full ring-2 ring-white/50" />
                    <div>
                        <p className="font-bold">{appointment.patient_name}</p>
                        <p className="text-sm opacity-90">{new Date(appointment.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                <Button onClick={() => onManage(appointment.id)} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm w-full sm:w-auto">
                    Go to Room
                </Button>
            </div>
        ) : (
            <p className="text-center text-white/80 py-4">No upcoming appointments.</p>
        )}
    </div>
);

const RecentActivityFeed: React.FC<{ activities: RecentActivity[] }> = ({ activities }) => {
    const iconMap: Record<RecentActivity['event_type'], React.ReactNode> = {
        consultation_completed: <ClipboardCheck className="h-5 w-5 text-blue-500" />,
        new_patient_assigned: <UserPlus className="h-5 w-5 text-green-500" />,
    };

    const textMap: Record<RecentActivity['event_type'], (details: any) => string> = {
        consultation_completed: (details) => `Consultation with ${details.patient_name} completed.`,
        new_patient_assigned: (details) => `${details.patient_name} assigned as a new patient.`,
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
            <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-white px-2">Recent Activity</h3>
            <div className="space-y-1 max-h-96 overflow-y-auto">
                {activities.length > 0 ? activities.map(activity => (
                    <div key={`${activity.event_type}-${activity.event_id}`} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-full">
                            {iconMap[activity.event_type]}
                        </div>
                        <div>
                            <p className="text-sm text-slate-700 dark:text-slate-300">{textMap[activity.event_type](activity.details)}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{formatDistanceToNow(activity.event_timestamp)}</p>
                        </div>
                    </div>
                )) : <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-4">No recent activity.</p>}
            </div>
        </div>
    );
};

const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ setCurrentView, onManageConsultation }) => {
    const [stats, setStats] = useState<DoctorDashboardStats | null>(null);
    const [activeConsultations, setActiveConsultations] = useState<Consultation[]>([]);
    const [nextAppointment, setNextAppointment] = useState<UpcomingAppointment | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDoctorData = useCallback(async () => {
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Could not identify doctor. Please log in again.");

            const [statsResult, appointmentsResult, activityResult, consultationsResult] = await Promise.all([
                supabase.from('v_doctor_dashboard_stats').select('*').eq('doctor_id', user.id).single(),
                supabase.from('appointments').select('id, start_at, status, profiles:patient_id(full_name, avatar_url)').eq('doctor_id', user.id).gt('start_at', new Date().toISOString()).order('start_at', { ascending: true }).limit(1),
                supabase.from('v_doctor_recent_activity').select('*').eq('doctor_id', user.id).order('event_timestamp', { ascending: false }).limit(5),
                supabase.from('consultations').select('*, profiles:patient_id (full_name, avatar_url)').is('ended_at', null)
            ]);
            
            if (statsResult.error) throw statsResult.error;
            setStats(statsResult.data);
            
            if (appointmentsResult.error) throw appointmentsResult.error;
            if (appointmentsResult.data && appointmentsResult.data.length > 0) {
                const appt = appointmentsResult.data[0] as any;
                setNextAppointment({ id: appt.id, start_at: appt.start_at, status: appt.status, patient_name: appt.profiles?.full_name || 'Patient', patient_avatar: appt.profiles?.avatar_url });
            } else {
                setNextAppointment(null);
            }
            
            if (activityResult.error) throw activityResult.error;
            setRecentActivity(activityResult.data);
            
            if (consultationsResult.error) throw consultationsResult.error;
            const enrichedData: Consultation[] = consultationsResult.data.map((item) => ({ ...item, patient_name: item.profiles?.full_name || 'Unknown Patient', patient_avatar: item.profiles?.avatar_url }));
            setActiveConsultations(enrichedData);

        } catch (err: any) {
            setError(`Failed to load dashboard data.`);
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDoctorData();
        const channel = supabase.channel('doctor-dashboard').on('postgres_changes', { event: '*', schema: 'public' }, fetchDoctorData).subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [fetchDoctorData]);

    if (loading) return <LoadingState message="Loading Dashboard..." />;
    if (error) return <ErrorState message={error} onRetry={fetchDoctorData} />;

    return (
        <div className="space-y-8 animate-fadeIn">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Doctor's Dashboard</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <StatCard title="Active Patients" value={stats?.active_patients ?? 0} icon={<Users className="h-6 w-6 text-[hsl(var(--primary))]"/>} onClick={() => setCurrentView('patients')} />
                        <StatCard title="Consults (30d)" value={stats?.consults_30d ?? 0} icon={<CalendarDays className="h-6 w-6 text-green-500"/>} />
                        <StatCard title="Avg. Consult Time" value={stats?.avg_consult_minutes ? `${Math.round(stats.avg_consult_minutes)} min` : 'N/A'} icon={<Clock className="h-6 w-6 text-yellow-500"/>} />
                        <StatCard title="AI Analyses (30d)" value={stats?.analyses_30d ?? 0} icon={<BarChartIcon className="h-6 w-6 text-indigo-500"/>} />
                    </div>

                    <UpNextCard appointment={nextAppointment} onManage={onManageConsultation} />
                    
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-md">
                        <h3 className="font-bold text-lg mb-3 text-slate-800 dark:text-white px-2">Active Consultations ({activeConsultations.length})</h3>
                        <div className="space-y-3">
                            {activeConsultations.length > 0 ? (
                                activeConsultations.map(c => <ActiveConsultationCard key={c.id} consultation={c} onManage={onManageConsultation} />)
                            ) : (
                                <p className="text-slate-500 dark:text-slate-400 text-center py-4">No active consultations.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    <RecentActivityFeed activities={recentActivity} />
                </div>
            </div>
        </div>
    );
};

export default DoctorDashboard;
