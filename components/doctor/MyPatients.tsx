
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import type { Profile } from '../../types';
import type { Database } from '../../types';
import LoadingState from '../LoadingState';
import ErrorState from '../ErrorState';
import { Search, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import LazyImage from '../LazyImage';

// Define a more specific type for the patient profile data
type PatientProfile = Profile & {
    patient_details: Database['public']['Tables']['patient_details']['Row'] | null;
};

const calculateAge = (dob: string | null): string => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age.toString();
};

const PatientCard: React.FC<{ patient: PatientProfile }> = ({ patient }) => {
    return (
        <Card className="flex flex-col animate-fadeIn">
            <CardHeader className="flex flex-row items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                    {patient.avatar_url ? (
                        <LazyImage src={patient.avatar_url} alt={patient.full_name || 'Patient'} className="w-full h-full rounded-full" />
                    ) : (
                        <User className="w-6 h-6 text-slate-500" />
                    )}
                </div>
                <div>
                    <CardTitle>{patient.full_name || 'Unnamed Patient'}</CardTitle>
                    <CardDescription>
                        Age: {calculateAge(patient.dob)}
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Chronic Conditions</h4>
                {patient.patient_details?.chronic_conditions && patient.patient_details.chronic_conditions.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {patient.patient_details.chronic_conditions.map((condition, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 rounded-full">
                                {condition}
                            </span>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">None reported.</p>
                )}
            </CardContent>
            <CardFooter className="gap-2">
                <Button variant="outline" className="w-full" disabled title="Feature coming soon">Start Chat</Button>
                <Button className="w-full" disabled title="Feature coming soon">View Details</Button>
            </CardFooter>
        </Card>
    );
};


const MyPatients: React.FC = () => {
    const [patients, setPatients] = useState<PatientProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchPatients = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            if (userError || !user) throw new Error("Could not identify doctor. Please log in again.");

            const { data, error: fetchError } = await supabase
                .from('patient_doctor_links')
                .select(`
                    profiles:patient_id (
                        *,
                        patient_details (*)
                    )
                `)
                .eq('doctor_id', user.id)
                .eq('active', true);

            if (fetchError) throw fetchError;
            
            if (data) {
                const fetchedPatients = data
                    .map(item => (item as any).profiles)
                    .filter((p): p is PatientProfile => p !== null);
                setPatients(fetchedPatients);
            }

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred while fetching patients.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPatients();
    }, [fetchPatients]);

    const filteredPatients = useMemo(() => {
        if (!searchTerm) return patients;
        return patients.filter(patient =>
            patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [patients, searchTerm]);

    if (loading) return <LoadingState message="Loading Patient Roster..." />;
    if (error) return <ErrorState message={error} onRetry={fetchPatients} />;

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">My Patients ({patients.length})</h2>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by patient name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                </div>
            </div>

            {filteredPatients.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredPatients.map(patient => (
                        <PatientCard key={patient.id} patient={patient} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                    <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300">
                        {searchTerm ? 'No Patients Found' : 'No Patients Assigned'}
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                        {searchTerm ? `No patients match your search for "${searchTerm}".` : 'You do not have any active patients assigned to you yet.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default MyPatients;
