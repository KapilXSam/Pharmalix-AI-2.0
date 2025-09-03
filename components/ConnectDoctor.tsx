import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Profile, Pathy, Database } from '../types';
import { supabase } from '../lib/supabaseClient';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import Modal from './Modal';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { Stethoscope, Pill, Leaf, Droplets, TestTube, Zap, Shield, ChevronDown, User, Calendar } from 'lucide-react';
import BookingModal from './BookingModal';
import LazyImage from './LazyImage';

// --- TYPES ---
type DoctorStatus = 'Online' | 'Offline' | 'Busy';
type Urgency = 'Normal' | 'Urgent';
type PathyFilter = Pathy | 'All';

type DoctorForDisplay = {
    id: string;
    name: string;
    specialty: string;
    department: string;
    pathy: Pathy;
    status: DoctorStatus;
    avatar: string;
    profile: Profile;
}

// --- HELPER COMPONENTS & FUNCTIONS ---
const getPathyStyles = (pathy: Pathy) => {
    switch (pathy) {
        case 'Allopathic': return 'bg-sky-500/10 text-sky-300';
        case 'Ayurvedic': return 'bg-emerald-500/10 text-emerald-300';
        case 'Homeopathic': return 'bg-blue-500/10 text-blue-300';
        case 'Unani': return 'bg-purple-500/10 text-purple-300';
        default: return 'bg-slate-500/10 text-slate-300';
    }
};

const StatusIndicator: React.FC<{ status: DoctorStatus }> = ({ status }) => {
    const color = {
        Online: 'bg-green-500',
        Offline: 'bg-slate-400',
        Busy: 'bg-yellow-500'
    }[status];
    return <span className={`absolute top-2 right-2 h-3 w-3 rounded-full ${color} border-2 border-white dark:border-slate-800`}></span>;
}

const DoctorCard: React.FC<{ 
    doctor: DoctorForDisplay, 
    onStartChat: (doctor: Profile) => Promise<void>,
    onBookAppointment: (doctor: Profile) => void,
    urgency: Urgency 
}> = ({ doctor, onStartChat, onBookAppointment, urgency }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectionError, setConnectionError] = useState<string | null>(null);

    const handleConfirmChat = async () => {
        setIsConnecting(true);
        setConnectionError(null);
        try {
            await onStartChat(doctor.profile);
            // On success, the parent App component will handle the view change.
        } catch (error: any) {
            setConnectionError(error.message || "Failed to start chat. The doctor might have just gone offline. Please try again.");
            setIsConnecting(false); // allow retry
        }
    };

    const isButtonDisabled = doctor.status !== 'Online';

    return (
        <>
            <div className="bg-[hsl(var(--card))] rounded-xl shadow-lg p-6 flex flex-col items-center text-center relative hover:shadow-2xl hover:shadow-sky-500/10 hover:-translate-y-2 transition-all duration-300">
                <StatusIndicator status={doctor.status} />
                <LazyImage src={doctor.avatar} alt={doctor.name} className="w-24 h-24 rounded-full mb-4 ring-4 ring-sky-100 dark:ring-sky-900" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{doctor.name}</h3>
                <p className="text-sky-600 dark:text-sky-400 font-medium mb-1">{doctor.department}</p>
                 <span className={`text-xs font-semibold px-2 py-1 rounded-full mb-4 ${getPathyStyles(doctor.pathy)}`}>
                    {doctor.pathy}
                </span>
                <div className="mt-auto w-full pt-4 space-y-2">
                     <Button
                        onClick={() => setIsModalOpen(true)}
                        disabled={isButtonDisabled}
                        title={doctor.status !== 'Online' ? 'Doctor is currently unavailable for live chat' : `Start a ${urgency} live chat`}
                        className="w-full"
                        variant={urgency === 'Urgent' ? 'destructive' : 'default'}
                    >
                        {urgency === 'Urgent' && <Zap className="w-4 h-4 mr-2" />}
                        Connect
                    </Button>
                    <Button
                        onClick={() => onBookAppointment(doctor.profile)}
                        disabled={isButtonDisabled}
                        title={doctor.status !== 'Online' ? 'Doctor is currently unavailable for booking' : 'Book a future appointment'}
                        variant="outline"
                        className="w-full"
                    >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Appointment
                    </Button>
                </div>
            </div>
            <Modal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setConnectionError(null);
                    setIsConnecting(false);
                }}
                title="Confirm Live Chat"
            >
                <p className="mb-4">You are about to start a <strong className={urgency === 'Urgent' ? 'text-destructive' : ''}>{urgency}</strong> live chat with Dr. {doctor.name} ({doctor.department}).</p>
                {connectionError && <p className="text-red-500 text-sm mb-4">{connectionError}</p>}
                <div className="flex justify-end gap-4">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isConnecting}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmChat} loading={isConnecting}>
                        {isConnecting ? 'Connecting...' : 'Confirm & Start Chat'}
                    </Button>
                </div>
            </Modal>
        </>
    );
};


// --- MAIN COMPONENT ---
interface ConnectDoctorProps {
    onStartChat: (doctor: Profile) => Promise<void>;
}

type DoctorDetails = Database['public']['Tables']['doctor_details']['Row'];

const ConnectDoctor: React.FC<ConnectDoctorProps> = ({ onStartChat }) => {
    const [doctors, setDoctors] = useState<DoctorForDisplay[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        pathy: 'All' as PathyFilter,
        department: 'All',
        urgency: 'Normal' as Urgency
    });
    const [bookingDoctor, setBookingDoctor] = useState<Profile | null>(null);


    const fetchDoctors = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*, doctor_details!inner(*)')
                .eq('role', 'doctor');
    
            if (profilesError) throw profilesError;
            
            const uniqueDepartments = new Set<string>();
            const mappedDoctors: DoctorForDisplay[] = profilesData
                .map((profile: any) => {
                    const details: DoctorDetails = profile.doctor_details;
                    if (!details) return null;
    
                    const department = details.specialties?.[0] || 'General Physician';
                    uniqueDepartments.add(department);
                    
                    return {
                        id: profile.id,
                        name: profile.full_name || 'Doctor',
                        specialty: details.specialties?.join(', ') || 'General',
                        department: department,
                        pathy: details.pathy || 'Allopathic',
                        status: 'Online', // Note: Real-time status would require presence tracking
                        avatar: profile.avatar_url || `https://i.pravatar.cc/150?u=${profile.id}`,
                        profile: profile as Profile
                    };
                })
                .filter((d): d is DoctorForDisplay => d !== null);
    
            setDoctors(mappedDoctors);
            setDepartments(['All', ...Array.from(uniqueDepartments).sort()]);
    
        } catch (err: any) {
             console.error('Error fetching doctors:', err);
             setError(`Failed to fetch doctor information. Please check your network connection and try again.`);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(doc => {
            const pathyMatch = filters.pathy === 'All' || doc.pathy === filters.pathy;
            const departmentMatch = filters.department === 'All' || doc.department === filters.department;
            return pathyMatch && departmentMatch;
        });
    }, [doctors, filters.pathy, filters.department]);
    
    const pathyFilterOptions: { label: string; value: PathyFilter; icon: React.FC<any> }[] = [
        { label: 'All', value: 'All', icon: Stethoscope },
        { label: 'Allopathic', value: 'Allopathic', icon: Pill },
        { label: 'Ayurvedic', value: 'Ayurvedic', icon: Leaf },
        { label: 'Homeopathic', value: 'Homeopathic', icon: Droplets },
        { label: 'Unani', value: 'Unani', icon: TestTube },
    ];

    if (loading) return <LoadingState message="Finding Available Doctors..." />;
    if (error) return <ErrorState message={error} onRetry={fetchDoctors} />;

    return (
        <div className="animate-slide-in space-y-8">
            <div className="bg-[hsl(var(--card))] p-4 rounded-xl shadow-lg space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                     <h3 className="text-lg font-bold text-slate-800 dark:text-white">Filter Doctors</h3>
                     <div className="flex items-center gap-2 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg">
                        <button onClick={() => setFilters(f => ({...f, urgency: 'Normal'}))} className={cn('px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-all', filters.urgency === 'Normal' ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300')}>
                            <Shield className="w-4 h-4"/> Normal
                        </button>
                         <button onClick={() => setFilters(f => ({...f, urgency: 'Urgent'}))} className={cn('px-4 py-2 text-sm font-semibold rounded-md flex items-center gap-2 transition-all', filters.urgency === 'Urgent' ? 'bg-white dark:bg-slate-700 text-red-600 dark:text-red-400 shadow' : 'text-slate-600 dark:text-slate-300')}>
                             <Zap className="w-4 h-4"/> Urgent
                        </button>
                     </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl flex flex-wrap items-center justify-center gap-2">
                        {pathyFilterOptions.map(option => (
                            <button 
                                key={option.value} 
                                onClick={() => setFilters(f => ({...f, pathy: option.value, department: 'All'}))}
                                className={cn('flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200', filters.pathy === option.value ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-700/50')}
                            >
                                <option.icon className="h-4 w-4" />
                                <span>{option.label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="relative">
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters(f => ({...f, department: e.target.value}))}
                            className="w-full h-full px-4 py-2 text-sm font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer"
                        >
                            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                        </select>
                         <ChevronDown className="h-5 w-5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            </div>

            {filteredDoctors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredDoctors.map(doc => <DoctorCard key={doc.id} doctor={doc} onStartChat={onStartChat} onBookAppointment={setBookingDoctor} urgency={filters.urgency} />)}
                </div>
            ) : (
                <div className="text-center p-12 bg-[hsl(var(--card))] rounded-xl shadow-md">
                    <User className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">No Doctors Found</h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        No doctors match your current filter criteria. Try adjusting your search.
                    </p>
                </div>
            )}
            {bookingDoctor && <BookingModal doctor={bookingDoctor} onClose={() => setBookingDoctor(null)} />}
        </div>
    );
};

export default ConnectDoctor;
