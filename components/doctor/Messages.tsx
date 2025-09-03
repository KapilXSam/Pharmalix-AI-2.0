
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Consultation } from '../../types';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { MessageSquare, Search } from 'lucide-react';
import { Button } from '../ui/Button';

interface MessagesProps {
    onManageConsultation: (consultationId: number) => void;
}

const getStatusStyles = (consultation: Consultation) => {
    if (consultation.ended_at) {
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'; // Completed
    }
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'; // Active
};

const getStatusText = (consultation: Consultation) => {
    return consultation.ended_at ? 'Completed' : 'Active';
}

const ConsultationRow: React.FC<{ consultation: Consultation, onManage: (id: number) => void }> = ({ consultation, onManage }) => (
    <tr className="bg-white dark:bg-slate-800 border-b dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
        <td className="px-6 py-4">
            <div className="flex items-center space-x-3">
                <img src={consultation.patient_avatar || `https://i.pravatar.cc/40?u=${consultation.patient_id}`} alt="Patient" className="w-10 h-10 rounded-full" />
                <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{consultation.patient_name || 'Patient'}</div>
                    <div className="text-sm text-slate-500 dark:text-slate-400">{consultation.subject}</div>
                </div>
            </div>
        </td>
        <td className="px-6 py-4">
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full capitalize ${getStatusStyles(consultation)}`}>
                {getStatusText(consultation)}
            </span>
        </td>
        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
            {new Date(consultation.created_at).toLocaleDateString()}
        </td>
        <td className="px-6 py-4 text-right">
            <Button variant="outline" size="sm" onClick={() => onManage(consultation.id)}>
                Open Room
            </Button>
        </td>
    </tr>
);

const Messages: React.FC<MessagesProps> = ({ onManageConsultation }) => {
    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

    const fetchConsultations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Doctor not found.");

            const { data, error: fetchError } = await supabase
                .from('consultations')
                .select(`*, profiles:patient_id (full_name, avatar_url)`)
                .eq('doctor_id', user.id)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;
            
             const enrichedData: Consultation[] = data.map((item: any) => ({
                ...item,
                patient_name: item.profiles?.full_name || 'Unknown Patient',
                patient_avatar: item.profiles?.avatar_url,
            }));

            setConsultations(enrichedData);
        } catch (err: any) {
            setError(err.message || 'Failed to load messages.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchConsultations();
    }, [fetchConsultations]);
    
    const filteredConsultations = useMemo(() => {
        return consultations
            .filter(c => {
                if (filter === 'active') return c.ended_at === null;
                if (filter === 'completed') return c.ended_at !== null;
                return true;
            })
            .filter(c => c.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [consultations, searchTerm, filter]);

    if (loading) return <LoadingState message="Loading Consultations..." />;
    if (error) return <ErrorState message={error} onRetry={fetchConsultations} />;

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Consultations</h2>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex border-b border-slate-200 dark:border-slate-700">
                        <button onClick={() => setFilter('active')} className={`px-4 py-2 text-sm font-semibold ${filter === 'active' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Active</button>
                        <button onClick={() => setFilter('completed')} className={`px-4 py-2 text-sm font-semibold ${filter === 'completed' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Completed</button>
                        <button onClick={() => setFilter('all')} className={`px-4 py-2 text-sm font-semibold ${filter === 'all' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>All</button>
                    </div>
                     <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                        />
                    </div>
                </div>
            </div>
            
            <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <table className="w-full text-sm text-left">
                     <thead className="text-xs text-slate-700 uppercase bg-slate-50 dark:bg-slate-700/50 dark:text-slate-300">
                        <tr>
                            <th scope="col" className="px-6 py-3">Patient</th>
                            <th scope="col" className="px-6 py-3">Status</th>
                            <th scope="col" className="px-6 py-3">Date</th>
                            <th scope="col" className="px-6 py-3"><span className="sr-only">Actions</span></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredConsultations.map(c => <ConsultationRow key={c.id} consultation={c} onManage={onManageConsultation} />)}
                    </tbody>
                </table>
                 {filteredConsultations.length === 0 && (
                    <div className="text-center py-16">
                        <MessageSquare className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Consultations Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">There are no consultations matching your filters.</p>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default Messages;
