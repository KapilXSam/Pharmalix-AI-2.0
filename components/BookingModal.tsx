
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Profile } from '../types';
import { Button } from './ui/Button';
import { X, Calendar, Clock, ArrowRight, CheckCircle, User, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

interface BookingModalProps {
    doctor: Profile;
    onClose: () => void;
}

type Step = 'date' | 'time' | 'confirm' | 'success';

const BookingModal: React.FC<BookingModalProps> = ({ doctor, onClose }) => {
    const [step, setStep] = useState<Step>('date');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateDates = () => {
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 7; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const generateTimeSlots = (bookedSlots: { start_at: string }[]) => {
        const slots = [];
        const startHour = 9;
        const endHour = 17;
        const interval = 30; // minutes

        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += interval) {
                if (selectedDate) {
                    const slotTime = new Date(selectedDate);
                    slotTime.setHours(hour, minute, 0, 0);
                    
                    const isBooked = bookedSlots.some(booked => {
                        const bookedTime = new Date(booked.start_at);
                        return bookedTime.getTime() === slotTime.getTime();
                    });

                    if (!isBooked) {
                        slots.push(slotTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                    }
                }
            }
        }
        return slots;
    };

    const fetchAvailableSlots = useCallback(async (date: Date) => {
        setLoading(true);
        setError(null);

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('appointments')
            .select('start_at')
            .eq('doctor_id', doctor.id)
            .gte('start_at', startDate.toISOString())
            .lte('start_at', endDate.toISOString());

        if (error) {
            setError('Failed to fetch available slots.');
            console.error(error);
        } else {
            const slots = generateTimeSlots(data || []);
            setAvailableSlots(slots);
        }
        setLoading(false);
    }, [doctor.id]);
    
    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots(selectedDate);
        }
    }, [selectedDate, fetchAvailableSlots]);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setStep('time');
    };
    
    const handleTimeSelect = (slot: string) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };
    
    const handleConfirmBooking = async () => {
        if (!selectedDate || !selectedSlot) return;
        setLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setError("You must be logged in to book an appointment.");
            setLoading(false);
            return;
        }

        const [time, period] = selectedSlot.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours < 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;

        const startAt = new Date(selectedDate);
        startAt.setHours(hours, minutes, 0, 0);

        const endAt = new Date(startAt.getTime() + 30 * 60000); // 30 minutes later

        const { error: insertError } = await supabase.from('appointments').insert({
            patient_id: user.id,
            doctor_id: doctor.id,
            start_at: startAt.toISOString(),
            end_at: endAt.toISOString(),
            status: 'Confirmed'
        });

        if (insertError) {
            setError(insertError.message);
        } else {
            setStep('success');
        }
        setLoading(false);
    };

    const renderHeader = () => (
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
            <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Book Appointment</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">with Dr. {doctor.full_name}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" aria-label="Close modal">
                <X className="h-5 w-5" />
            </button>
        </div>
    );
    
    const renderStep = () => {
        switch (step) {
            case 'date':
                return (
                    <div className="animate-fadeIn">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-sky-500"/> Select a Date</h3>
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {generateDates().map(date => (
                                <button key={date.toISOString()} onClick={() => handleDateSelect(date)} className="flex flex-col items-center p-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-colors">
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{date.toLocaleDateString([], { weekday: 'short' })}</span>
                                    <span className="text-xl font-bold text-slate-900 dark:text-white">{date.getDate()}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">{date.toLocaleDateString([], { month: 'short' })}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'time':
                return (
                     <div className="animate-fadeIn">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-sky-500"/> Select a Time Slot for {selectedDate?.toLocaleDateString([], { month: 'long', day: 'numeric' })}</h3>
                        {loading ? <p>Loading slots...</p> : (
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                {availableSlots.length > 0 ? availableSlots.map(slot => (
                                    <Button key={slot} variant="outline" onClick={() => handleTimeSelect(slot)}>{slot}</Button>
                                )) : <p className="col-span-full text-center text-slate-500 py-4">No available slots for this day.</p>}
                            </div>
                        )}
                        <Button variant="ghost" onClick={() => setStep('date')} className="mt-6">Back to Date</Button>
                    </div>
                );
             case 'confirm':
                return (
                     <div className="animate-fadeIn text-center">
                        <h3 className="font-semibold text-slate-800 dark:text-white mb-4 text-lg">Confirm Your Appointment</h3>
                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg space-y-2 text-left">
                            <p><strong className="w-24 inline-block">Doctor:</strong> Dr. {doctor.full_name}</p>
                            <p><strong className="w-24 inline-block">Date:</strong> {selectedDate?.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                            <p><strong className="w-24 inline-block">Time:</strong> {selectedSlot}</p>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
                        <div className="flex justify-center gap-4 mt-6">
                            <Button variant="ghost" onClick={() => setStep('time')} disabled={loading}>Back</Button>
                            <Button onClick={handleConfirmBooking} loading={loading}>Confirm Booking</Button>
                        </div>
                    </div>
                );
             case 'success':
                 return (
                    <div className="animate-fadeIn text-center">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                        <h3 className="font-bold text-slate-800 dark:text-white text-xl">Appointment Booked!</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Your appointment with Dr. {doctor.full_name} on {selectedDate?.toLocaleDateString()} at {selectedSlot} has been confirmed.</p>
                        <Button onClick={onClose} className="mt-6">Done</Button>
                    </div>
                 )
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full transform transition-transform duration-300 animate-scaleIn">
               {renderHeader()}
               {renderStep()}
            </div>
        </div>
    );
};

export default BookingModal;
