
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { View, PrakrutiAnalysis, PrakrutiLog } from '../types';
import { TrendingUp, BookOpen, Plus } from 'lucide-react';

import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { Button } from './ui/Button';
import DoshaHistoryChart from './prakruti/DoshaHistoryChart';
import { Textarea } from './ui/Textarea';
import { VoiceInputButton } from './VoiceInputButton';

interface PrakrutiProgressProps {
    setCurrentView: (view: View) => void;
}

const PrakrutiProgress: React.FC<PrakrutiProgressProps> = ({ setCurrentView }) => {
    const [analyses, setAnalyses] = useState<PrakrutiAnalysis[]>([]);
    const [logs, setLogs] = useState<PrakrutiLog[]>([]);
    const [newLogEntry, setNewLogEntry] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    const fetchData = useCallback(async (currentUserId: string | null) => {
        if (!currentUserId) return;
        
        setError(null);
        try {
            const [analysesRes, logsRes] = await Promise.all([
                supabase.from('prakruti_analysis').select('*').eq('user_id', currentUserId).order('created_at', { ascending: true }),
                supabase.from('prakruti_log').select('*').eq('user_id', currentUserId).order('log_date', { ascending: false }).order('created_at', { ascending: false })
            ]);

            if (analysesRes.error) throw analysesRes.error;
            if (logsRes.error) throw logsRes.error;
            
            setAnalyses(analysesRes.data || []);
            setLogs(logsRes.data || []);

        } catch (err: any) {
            setError(err.message || 'Failed to load progress data.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const initializeAndFetch = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                fetchData(user.id);
            } else {
                setError("You must be logged in.");
                setLoading(false);
            }
        };
        initializeAndFetch();
    }, [fetchData]);

    useEffect(() => {
        if (!userId) return;

        // Set up real-time subscriptions for synchronous updates
        const channel = supabase.channel('prakruti-progress-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'prakruti_analysis', filter: `user_id=eq.${userId}` },
            () => {
              console.log('New analysis detected, refetching data.');
              fetchData(userId);
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'prakruti_log', filter: `user_id=eq.${userId}` },
            () => {
              console.log('New log detected, refetching data.');
              fetchData(userId);
            }
          )
          .subscribe();

        // Cleanup function to remove the channel subscription when the component unmounts
        return () => {
          supabase.removeChannel(channel);
        };
    }, [userId, fetchData]);

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLogEntry.trim() || !userId) return;

        try {
            const { error: insertError } = await supabase
                .from('prakruti_log')
                .insert({ user_id: userId, entry: newLogEntry });

            if (insertError) throw insertError;
            
            // The real-time subscription will handle updating the state,
            // but we can clear the input optimistically.
            setNewLogEntry('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <LoadingState message="Loading your wellness journey..." />;
    if (error) return <ErrorState message={error} onRetry={() => fetchData(userId)} />;

    return (
        <div className="max-w-7xl mx-auto animate-fadeIn space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2">Prakruti Progress & Journal</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">Track your dosha balance over time and log your wellness journey.</p>
                </div>
                <Button onClick={() => setCurrentView('prakruti-parikshana')}>
                    Take New Analysis
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <TrendingUp className="text-emerald-500" />
                    Dosha Balance History
                </h2>
                {analyses.filter(a => a.vata_score !== null).length > 0 ? (
                    <DoshaHistoryChart analyses={analyses} />
                ) : (
                    <div className="text-center py-12">
                        <p className="text-slate-500 dark:text-slate-400">You need to complete at least one questionnaire-based analysis to see your progress chart.</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl">
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <BookOpen className="text-emerald-500" />
                        My Wellness Journal
                    </h2>
                    <form onSubmit={handleAddLog} className="flex items-start gap-2 mb-4">
                        <div className="relative flex-grow">
                            <Textarea 
                                value={newLogEntry}
                                onChange={(e) => setNewLogEntry(e.target.value)}
                                placeholder="How are you feeling today? Note your diet, mood, or lifestyle changes..."
                                rows={3}
                                className="w-full pr-12"
                            />
                            <VoiceInputButton onTranscriptUpdate={(t) => setNewLogEntry(p => `${p}${t}`)} className="absolute right-2 top-2" />
                        </div>
                        <Button type="submit" size="icon"><Plus /></Button>
                    </form>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {logs.length > 0 ? logs.map(log => (
                            <div key={log.id} className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg">
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    {new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </p>
                                <p className="text-sm text-slate-700 dark:text-slate-300">{log.entry}</p>
                            </div>
                        )) : (
                            <p className="text-center text-slate-500 dark:text-slate-400 py-8">No journal entries yet. Add one above to get started!</p>
                        )}
                    </div>
                 </div>
                 <div className="bg-emerald-50 dark:bg-emerald-900/50 p-8 rounded-2xl shadow-xl flex flex-col justify-center text-center">
                    <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-3">Understanding Your Progress</h2>
                    <p className="text-emerald-700 dark:text-emerald-300">
                        Your Prakruti is your innate constitution, which remains constant. However, lifestyle and diet can create imbalances (Vikruti). This chart helps you visualize these current imbalances. By logging your daily activities, you can correlate lifestyle choices with changes in your doshic state, empowering you to maintain balance.
                    </p>
                 </div>
            </div>
        </div>
    );
};

export default PrakrutiProgress;
