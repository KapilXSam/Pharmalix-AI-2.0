import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { PlatformStats, AnalyzerUsage } from '../../types';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { Users, Stethoscope, Activity, User } from 'lucide-react';

interface RecentSignup {
    id: string;
    full_name: string | null;
    role: string;
    created_at: string;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode, color: string }> = ({ title, value, icon, color }) => (
    <div className={`relative overflow-hidden bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg`}>
        <div className={`absolute top-0 left-0 h-1 ${color}`}></div>
        <div className="flex items-center space-x-4">
            <div className="p-3 rounded-full bg-slate-700/50">{icon}</div>
            <div>
                <p className="text-sm font-medium text-slate-400">{title}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </div>
        </div>
    </div>
);

const AnalyzerUsageChart: React.FC<{ data: AnalyzerUsage[] }> = ({ data }) => {
    const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 0), [data]);
    
    const analyzerNameMap: Record<string, string> = {
        'xray': 'CXR', 'lab_report': 'Lab', 'prescription': 'Rx', 'ct_scan': 'CT', 'mri_scan': 'MRI', 'ecg': 'ECG', 'eeg': 'EEG', 'derma_scan': 'Derma', 'pain_locator': 'Pain', 'symptom_checker': 'Symptoms', 'prakruti-parikshana': 'Prakruti'
    };

    return (
        <div className="space-y-3">
            {data.length > 0 ? data.map(({ analyzer, count }) => (
                <div key={analyzer} className="flex items-center gap-3 group">
                    <span className="w-20 text-xs font-semibold text-slate-400 text-right truncate capitalize">
                        {analyzerNameMap[analyzer] || analyzer.replace(/[-_]/g, ' ')}
                    </span>
                    <div className="flex-1 bg-slate-700/50 rounded-full h-5">
                        <div
                            className="bg-sky-500 h-5 rounded-full text-right pr-2 text-xs font-bold text-white flex items-center justify-end transition-all duration-500 ease-out"
                            style={{ width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                        >
                            {count}
                        </div>
                    </div>
                </div>
            )) : <p className="text-sm text-slate-400 text-center py-4">No AI Analyzer usage data yet.</p>}
        </div>
    );
};


const PlatformAnalytics: React.FC = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [analyzerUsage, setAnalyzerUsage] = useState<AnalyzerUsage[]>([]);
    const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAnalytics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsResult, analysisLogResult, signupsResult] = await Promise.all([
                supabase.from('platform_stats_view').select('*').single(),
                supabase.from('ai_analysis_log').select('analyzer_type'),
                supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }).limit(5)
            ]);

            if (statsResult.error) throw statsResult.error;
            if (analysisLogResult.error) throw analysisLogResult.error;
            if (signupsResult.error) throw signupsResult.error;
            
            setStats(statsResult.data as PlatformStats);
            setRecentSignups(signupsResult.data);

            const usageCounts = (analysisLogResult.data || []).reduce((acc: Record<string, number>, log) => {
                const key = log.analyzer_type.replace(/_analyzer$/, '');
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});

            const sortedUsage = Object.entries(usageCounts)
                .map(([analyzer, count]) => ({ analyzer, count: count as number }))
                .sort((a, b) => b.count - a.count);

            setAnalyzerUsage(sortedUsage);

        } catch (err: any) {
            setError('Failed to load platform analytics.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalytics();
    }, [fetchAnalytics]);

    if (loading) return <LoadingState message="Loading Platform Analytics..." />;
    if (error) return <ErrorState message={error} onRetry={fetchAnalytics} />;
    
    return (
        <div className="space-y-8 animate-fadeIn text-white">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Platform Analytics</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Patients" value={stats?.total_patients ?? 0} color="w-full bg-sky-500" icon={<Users className="h-6 w-6 text-sky-400"/>} />
                <StatCard title="Total Doctors" value={stats?.total_doctors ?? 0} color="w-full bg-green-500" icon={<Stethoscope className="h-6 w-6 text-green-400"/>} />
                <StatCard title="Total Consultations" value={stats?.total_consultations ?? 0} color="w-full bg-indigo-500" icon={<Activity className="h-6 w-6 text-indigo-400"/>} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold mb-4">AI Analyzer Usage</h3>
                    <AnalyzerUsageChart data={analyzerUsage} />
                </div>
                <div className="lg:col-span-1 bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6 rounded-2xl shadow-lg">
                    <h3 className="font-bold mb-4">Recent Signups</h3>
                    <div className="space-y-4">
                        {recentSignups.length > 0 ? recentSignups.map(user => (
                            <div key={user.id} className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sky-400 text-sm">
                                    <User className="h-5 w-5"/>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm">{user.full_name}</p>
                                    <p className="text-xs text-slate-400 capitalize">{user.role}</p>
                                </div>
                            </div>
                        )) : <p className="text-sm text-slate-400">No recent signups.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformAnalytics;