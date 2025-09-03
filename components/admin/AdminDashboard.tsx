import React, { useState, useEffect, useCallback } from 'react';
import type { PlatformStats, UserRole, LiveUser, AdminView } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { Users, Stethoscope, Activity, ChevronRight } from 'lucide-react';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import TrendingUpIcon from '../icons/TrendingUpIcon';

interface RecentPatient {
    id: string;
    full_name: string;
    created_at: string;
}

interface AdminDashboardProps {
    setCurrentView: (view: AdminView) => void;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, color: string, onClick?: () => void }> = ({ title, value, icon, color, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300 ${onClick ? 'cursor-pointer' : ''}`}
    >
        <div className={`absolute top-0 left-0 h-1 ${color}`}></div>
        <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-full bg-slate-700/50`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
        </div>
    </div>
);

const UserRoleChart: React.FC<{ patients: number, doctors: number, admins: number }> = ({ patients, doctors, admins }) => {
    const total = patients + doctors + admins;
    if (total === 0) return <div className="text-sm text-slate-400">No user data to display.</div>;

    const patientsPct = (patients / total) * 100;
    const doctorsPct = (doctors / total) * 100;
    const adminsPct = (admins / total) * 100;

    return (
        <div>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-slate-700">
                <div style={{ width: `${patientsPct}%` }} className="bg-sky-500" title={`Patients: ${patients}`}></div>
                <div style={{ width: `${doctorsPct}%` }} className="bg-green-500" title={`Doctors: ${doctors}`}></div>
                <div style={{ width: `${adminsPct}%` }} className="bg-purple-500" title={`Admins: ${admins}`}></div>
            </div>
            <div className="mt-3 flex justify-around text-xs text-slate-300">
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-sky-500"></span>Patients ({patients})</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500"></span>Doctors ({doctors})</div>
                <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-purple-500"></span>Admins ({admins})</div>
            </div>
        </div>
    );
};


const AdminDashboard: React.FC<AdminDashboardProps> = ({ setCurrentView }) => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [adminCount, setAdminCount] = useState<number>(0);
    const [analysisCount, setAnalysisCount] = useState<number>(0);
    const [recentPatients, setRecentPatients] = useState<RecentPatient[]>([]);
    const [onlineUsers, setOnlineUsers] = useState<LiveUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAdminData = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const [statsResult, usersResult, adminResult, analysisResult] = await Promise.all([
                supabase.from('platform_stats_view').select('*').single(),
                supabase.from('profiles').select('id, full_name, created_at').eq('role', 'patient').order('created_at', { ascending: false }).limit(5),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
                supabase.from('ai_analysis_log').select('*', { count: 'exact', head: true })
            ]);

            if (statsResult.error) throw statsResult.error;
            if (usersResult.error) throw usersResult.error;
            if (adminResult.error) throw adminResult.error;
            if (analysisResult.error) throw analysisResult.error;
            
            setStats(statsResult.data as unknown as PlatformStats);
            setRecentPatients(usersResult.data as unknown as RecentPatient[]);
            setAdminCount(adminResult.count || 0);
            setAnalysisCount(analysisResult.count || 0);

        } catch (err: any) {
            console.error("Admin Dashboard Error:", err);
            setError("An error occurred while fetching dashboard data. Please check your connection.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAdminData();
    }, [fetchAdminData]);
    
    useEffect(() => {
        const channel = supabase.channel('online-users');

        const handlePresenceSync = () => {
            const presenceState = channel.presenceState();
            const users = Object.keys(presenceState).map(key => presenceState[key][0] as unknown as LiveUser);
            setOnlineUsers(users);
        };

        channel.on('presence', { event: 'sync' }, handlePresenceSync);
        channel.on('presence', { event: 'join' }, handlePresenceSync);
        channel.on('presence', { event: 'leave' }, handlePresenceSync);
        
        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);


    if (loading) return <LoadingState message="Loading Platform Overview..." />;
    if (error) return <ErrorState message={error} onRetry={fetchAdminData} />;


    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Overview</h2>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value={stats?.total_patients ?? 0} color="w-full bg-sky-500" icon={<Users className="h-6 w-6 text-sky-400"/>} />
                <StatCard title="Total Doctors" value={stats?.total_doctors ?? 0} color="w-full bg-green-500" icon={<Stethoscope className="h-6 w-6 text-green-400"/>} />
                <StatCard title="Total Consultations" value={stats?.total_consultations ?? 0} color="w-full bg-indigo-500" icon={<Activity className="h-6 w-6 text-indigo-400"/>} />
                <StatCard title="AI Analyses Run" value={analysisCount} color="w-full bg-amber-500" icon={<TrendingUpIcon className="h-6 w-6 text-amber-400"/>} onClick={() => setCurrentView('analytics')} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Live Users */}
                <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold mb-4">Live User Status ({onlineUsers.length})</h3>
                    <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                        {onlineUsers.length > 0 ? onlineUsers.map(user => (
                            <div key={user.user_id} className="flex items-center justify-between animate-fadeIn">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                         <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
                                            {user.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-slate-800" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{user.full_name}</p>
                                        <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400 text-center py-8">No users are currently online.</p>}
                    </div>
                </div>

                 {/* Charts & Recent Patients */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
                         <h3 className="font-bold mb-4">User Role Distribution</h3>
                         <UserRoleChart patients={stats?.total_patients ?? 0} doctors={stats?.total_doctors ?? 0} admins={adminCount} />
                    </div>
                    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold">Recent Patient Sign-ups</h3>
                             <button onClick={() => setCurrentView('users')} className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1">View All <ChevronRight className="h-3 w-3" /></button>
                        </div>
                         <div className="space-y-3">
                            {recentPatients.length > 0 ? recentPatients.map(user => (
                                <div key={user.id} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
                                            {user.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm">{user.full_name}</p>
                                            <p className="text-xs text-slate-400">{new Date(user.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-slate-400">No recent patient registrations.</p>}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;