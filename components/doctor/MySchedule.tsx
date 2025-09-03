
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { ConsultStatus } from '../../types';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { CalendarDays } from 'lucide-react';

interface Appointment {
    id: number;
    start_at: string;
    patient_name: string;
    patient_avatar: string | null;
}

const AppointmentCard = ({ appointment }: { appointment: Appointment }) => {
    const avatarSrc = appointment.patient_avatar || `https://i.pravatar.cc/40?u=${encodeURIComponent(appointment.patient_name)}`;

    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md flex items-center space-x-4">
            <div className="flex flex-col items-center justify-center w-20 text-center bg-[hsl(var(--primary))]/5 dark:bg-[hsl(var(--primary))]/10 p-2 rounded-md">
                <p className="text-sm font-semibold text-[hsl(var(--primary))]">
                    {new Date(appointment.start_at).toLocaleDateString('en-US', { month: 'short' })}
                </p>
                <p className="text-2xl font-bold text-slate-800 dark:text-white">
                    {new Date(appointment.start_at).getDate()}
                </p>
                <p className="text-xs text-slate-500">
                    {new Date(appointment.start_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                </p>
            </div>
            <div className="flex-1">
                <div className="flex items-center space-x-3">
                     <img src={avatarSrc} alt={appointment.patient_name} className="w-10 h-10 rounded-full" />
                     <div>
                        <p className="font-bold text-slate-900 dark:text-white">{appointment.patient_name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Virtual Consultation</p>
                     </div>
                </div>
            </div>
        </div>
    );
};


const MySchedule: React.FC = () => {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAppointments = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Doctor not found.");

            const { data, error: fetchError } = await supabase
                .from('appointments')
                .select(`id, start_at, profiles:patient_id (full_name, avatar_url)`)
                .eq('doctor_id', user.id)
                .order('start_at', { ascending: true });

            if (fetchError) throw fetchError;

            const mappedData: Appointment[] = ((data as any[]) || []).map((item) => ({
                id: item.id,
                start_at: item.start_at,
                patient_name: item.profiles?.full_name || 'Unknown Patient',
                patient_avatar: item.profiles?.avatar_url || null,
            }));
            setAppointments(mappedData);

        } catch (err: any) {
            setError(err.message || "Failed to load schedule.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAppointments();
    }, [fetchAppointments]);

    const groupedAppointments = useMemo(() => {
        return appointments.reduce((acc: Record<string, Appointment[]>, appt) => {
            const date = new Date(appt.start_at).toDateString();
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(appt);
            return acc;
        }, {});
    }, [appointments]);

    if (loading) return <LoadingState message="Loading Your Schedule..." />;
    if (error) return <ErrorState message={error} onRetry={fetchAppointments} />;

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">My Schedule</h2>

            {Object.keys(groupedAppointments).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedAppointments).map(([date, appts]) => (
                        <div key={date}>
                            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </h3>
                            <div className="space-y-3">
                                {appts.map(appt => <AppointmentCard key={appt.id} appointment={appt} />)}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <CalendarDays className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">No Appointments</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">Your schedule is currently empty.</p>
                </div>
            )}
        </div>
    );
};

export default MySchedule;
