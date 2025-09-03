import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useSettings } from '../contexts/SettingsContext';
import Modal from './Modal';
import { clearAllClientCookies } from '../lib/utils';
import type { Profile, Pathy, Database } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/Card';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { Sun, Moon, Laptop } from 'lucide-react';
import { cn } from '../lib/utils';

type ActionType = 'cache' | 'local' | 'session' | 'cookies' | 'all';
type PatientDetails = Database['public']['Tables']['patient_details']['Row'];
type DoctorDetails = Database['public']['Tables']['doctor_details']['Row'];
type FormDataType = Partial<Profile & PatientDetails & DoctorDetails>;

interface ActionConfig {
    title: string;
    description: string;
    warning?: string;
    buttonText: string;
    handler: () => Promise<string>;
}

interface UserSettingsProps {
  profile: Profile;
}

const ProfileEditor: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [formData, setFormData] = useState<FormDataType>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let detailsData = {};
            if (profile.role === 'patient') {
                const { data, error: patientError } = await supabase.from('patient_details').select('*').eq('patient_id', profile.id).single();
                if (patientError && patientError.code !== 'PGRST116') { // Ignore 'no rows' error
                    throw new Error("Failed to fetch patient details.");
                }
                detailsData = data || {};
            } else if (profile.role === 'doctor') {
                const { data, error: doctorError } = await supabase.from('doctor_details').select('*').eq('doctor_id', profile.id).single();
                 if (doctorError && doctorError.code !== 'PGRST116') {
                    throw new Error("Failed to fetch doctor details.");
                }
                detailsData = data || {};
            }

            setFormData({
                full_name: profile.full_name || '',
                phone: profile.phone || '',
                dob: profile.dob || '',
                ...detailsData
            });
        } catch(err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setSuccess(null);
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            const { full_name, phone, dob } = formData;
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ full_name, phone, dob })
                .eq('id', profile.id);

            if (profileError) throw profileError;

            if (profile.role === 'patient') {
                const { allergies, chronic_conditions, blood_group, height_cm, weight_kg } = formData;
                const patientDetails = {
                    patient_id: profile.id,
                    allergies: Array.isArray(allergies) ? allergies : (allergies as string || '').split(',').map(s => s.trim()).filter(Boolean),
                    chronic_conditions: Array.isArray(chronic_conditions) ? chronic_conditions : (chronic_conditions as string || '').split(',').map(s => s.trim()).filter(Boolean),
                    blood_group, height_cm, weight_kg
                };
                const { error: patientError } = await supabase.from('patient_details').upsert(patientDetails);
                if (patientError) throw patientError;
            } else if (profile.role === 'doctor') {
                const { license_number, specialties, years_experience, clinic_name, about, pathy } = formData;
                const doctorDetails = {
                    doctor_id: profile.id,
                    license_number,
                    specialties: Array.isArray(specialties) ? specialties : (specialties as string || '').split(',').map(s => s.trim()).filter(Boolean),
                    years_experience, clinic_name, about, pathy
                };
                 const { error: doctorError } = await supabase.from('doctor_details').upsert(doctorDetails);
                if (doctorError) throw doctorError;
            }
            setSuccess("Profile updated successfully!");
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred.");
        } finally {
            setSaving(false);
        }
    };
    
    const renderPatientFields = () => (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1"><Label htmlFor="blood_group">Blood Group</Label><Input id="blood_group" name="blood_group" value={formData.blood_group || ''} onChange={handleChange} /></div>
                <div className="space-y-1"><Label htmlFor="height_cm">Height (cm)</Label><Input id="height_cm" name="height_cm" type="number" value={formData.height_cm || ''} onChange={handleChange} /></div>
                <div className="space-y-1"><Label htmlFor="weight_kg">Weight (kg)</Label><Input id="weight_kg" name="weight_kg" type="number" value={formData.weight_kg || ''} onChange={handleChange} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="allergies">Allergies (comma-separated)</Label><Textarea id="allergies" name="allergies" value={Array.isArray(formData.allergies) ? formData.allergies.join(', ') : formData.allergies || ''} onChange={handleChange} /></div>
            <div className="space-y-1"><Label htmlFor="chronic_conditions">Chronic Conditions (comma-separated)</Label><Textarea id="chronic_conditions" name="chronic_conditions" value={Array.isArray(formData.chronic_conditions) ? formData.chronic_conditions.join(', ') : formData.chronic_conditions || ''} onChange={handleChange} /></div>
        </>
    );
    
    const renderDoctorFields = () => (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1"><Label htmlFor="license_number">License Number</Label><Input id="license_number" name="license_number" value={formData.license_number || ''} onChange={handleChange} /></div>
                <div className="space-y-1"><Label htmlFor="years_experience">Years of Experience</Label><Input id="years_experience" name="years_experience" type="number" value={formData.years_experience || ''} onChange={handleChange} /></div>
            </div>
            <div className="space-y-1"><Label htmlFor="specialties">Specialties (comma-separated)</Label><Textarea id="specialties" name="specialties" value={Array.isArray(formData.specialties) ? formData.specialties.join(', ') : formData.specialties || ''} onChange={handleChange} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="space-y-1"><Label htmlFor="clinic_name">Clinic Name</Label><Input id="clinic_name" name="clinic_name" value={formData.clinic_name || ''} onChange={handleChange} /></div>
                <div className="space-y-1"><Label htmlFor="pathy">Pathy</Label><select id="pathy" name="pathy" value={formData.pathy || 'Allopathic'} onChange={handleChange} className="w-full h-10 px-3 py-2 bg-transparent border border-input rounded-md"><option>Allopathic</option><option>Ayurvedic</option><option>Homeopathic</option><option>Unani</option></select></div>
            </div>
            <div className="space-y-1"><Label htmlFor="about">About/Bio</Label><Textarea id="about" name="about" value={formData.about || ''} onChange={handleChange} rows={3} /></div>
        </>
    );

    if (loading) return (
        <Card>
            <CardContent className="flex items-center justify-center p-10">
                <LoadingState message="Loading profile..." />
            </CardContent>
        </Card>
    );
    if (error && !formData.full_name) return (
        <Card>
            <CardContent className="p-10">
                <ErrorState message={error} onRetry={fetchDetails} />
            </CardContent>
        </Card>
    );
    
    return (
        <Card>
            <form onSubmit={handleSave}>
                <CardHeader><CardTitle>Profile Information</CardTitle><CardDescription>Update your personal and medical details.</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="full_name">Full Name</Label><Input id="full_name" name="full_name" value={formData.full_name || ''} onChange={handleChange} /></div>
                        <div className="space-y-1"><Label htmlFor="email">Email Address</Label><Input id="email" name="email" value={profile.email || ''} disabled /></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1"><Label htmlFor="phone">Phone Number</Label><Input id="phone" name="phone" value={formData.phone || ''} onChange={handleChange} /></div>
                        <div className="space-y-1"><Label htmlFor="dob">Date of Birth</Label><Input id="dob" name="dob" type="date" value={formData.dob || ''} onChange={handleChange} /></div>
                    </div>
                    {profile.role === 'patient' && renderPatientFields()}
                    {profile.role === 'doctor' && renderDoctorFields()}
                </CardContent>
                <CardFooter className="justify-between items-center">
                    <div>
                        {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}
                        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    </div>
                    <Button type="submit" loading={saving}>Save Changes</Button>
                </CardFooter>
            </form>
        </Card>
    );
};


const UserSettings: React.FC<UserSettingsProps> = ({ profile }) => {
    const { isLiteMode, setIsLiteMode, theme, setTheme } = useSettings();
    const [modalAction, setModalAction] = useState<ActionType | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const clearApplicationCache = async (): Promise<string> => {
        if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
            return "Application cache has been successfully cleared.";
        }
        return "Cache API not supported in this browser.";
    };

    const clearLocalStorage = async (): Promise<string> => {
        localStorage.clear();
        await supabase.auth.signOut();
        return "Local Storage has been cleared. You have been logged out.";
    };

    const clearSessionStorage = async (): Promise<string> => {
        sessionStorage.clear();
        return "Session Storage has been successfully cleared.";
    };

    const clearCookies = async (): Promise<string> => {
        clearAllClientCookies();
        await supabase.auth.signOut();
        return "All client-side cookies for this site have been cleared, and you have been logged out.";
    };

    const clearAllData = async (): Promise<string> => {
        await Promise.all([
            clearApplicationCache(),
            clearSessionStorage(),
            clearCookies(),
            clearLocalStorage(),
        ]);
        return "All browser data has been cleared. You have been logged out.";
    };

    const actions: Record<ActionType, ActionConfig> = {
        cache: { title: 'Clear Application Cache', description: 'Removes temporary app files to ensure you have the latest version. Good for troubleshooting.', buttonText: 'Clear Cache', handler: clearApplicationCache },
        session: { title: 'Clear Session Storage', description: 'Clears temporary data from your current visit. Usually not necessary.', buttonText: 'Clear Session Storage', handler: clearSessionStorage },
        cookies: { title: 'Clear Cookies & Log Out', description: 'Removes cookies used for remembering you across sessions.', warning: 'This action will log you out.', buttonText: 'Clear Cookies & Log Out', handler: clearCookies },
        local: { title: 'Clear Local Storage & Log Out', description: 'Removes all site settings and saved data from your browser, including your login token.', warning: 'This will log you out and will need to sign in again.', buttonText: 'Clear Local Storage & Log Out', handler: clearLocalStorage },
        all: { title: 'Clear All Browser Data', description: 'A "hard reset" for the app in your browser. Clears everything and logs you out.', warning: 'This is a hard reset. You will be logged out.', buttonText: 'Clear All Data & Log Out', handler: clearAllData },
    };

    const handleActionClick = (action: ActionType) => {
        setModalAction(action);
        setFeedback(null);
    };

    const handleConfirmAction = async () => {
        if (!modalAction) return;
        try {
            const message = await actions[modalAction].handler();
            setFeedback({ type: 'success', message });
        } catch (e: any) {
            setFeedback({ type: 'error', message: e.message || 'An unexpected error occurred.' });
        }
        setModalAction(null);
    };

    const ActionButton: React.FC<{ action: ActionType, isDestructive?: boolean }> = ({ action, isDestructive }) => (
        <div className="flex flex-col sm:flex-row justify-between items-center">
            <div>
                <h3 className="font-semibold">{actions[action].title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{actions[action].description}</p>
            </div>
            <Button
                onClick={() => handleActionClick(action)}
                variant={isDestructive ? 'destructive' : 'outline'}
                className="mt-3 sm:mt-0 flex-shrink-0"
            >
                {actions[action].buttonText}
            </Button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn space-y-8">
            <h2 className="text-3xl font-bold">Settings</h2>

            {feedback && (
                <div className={`p-4 rounded-lg ${feedback.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`}>
                    {feedback.message}
                </div>
            )}
            
            <ProfileEditor profile={profile} />

            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>Choose how the application looks and feels.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label className="font-semibold">Theme</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            {(['light', 'dark', 'system'] as const).map(t => (
                                <Button key={t} variant="outline" onClick={() => setTheme(t)} className={cn('flex flex-col h-20 gap-2', theme === t && 'border-primary ring-2 ring-primary')}>
                                    {t === 'light' && <Sun />}
                                    {t === 'dark' && <Moon />}
                                    {t === 'system' && <Laptop />}
                                    <span className="capitalize">{t}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                     <div className="flex justify-between items-center p-4 rounded-lg border border-[hsl(var(--border))]">
                        <div>
                            <Label className="font-semibold">Lite Mode</Label>
                            <p className="text-sm text-[hsl(var(--muted-foreground))]">Disables heavy animations for better performance.</p>
                        </div>
                        <button
                            onClick={() => setIsLiteMode(!isLiteMode)}
                            role="switch"
                            aria-checked={isLiteMode}
                            className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${isLiteMode ? 'bg-primary' : 'bg-input'}`}
                        >
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isLiteMode ? 'translate-x-6' : 'translate-x-1'}`}/>
                        </button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Data Management</CardTitle>
                    <CardDescription>Manage application data stored in your browser. Use these options for troubleshooting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ActionButton action="cache" />
                    <ActionButton action="session" />
                    <ActionButton action="cookies" isDestructive />
                    <ActionButton action="local" isDestructive />
                    <ActionButton action="all" isDestructive />
                </CardContent>
            </Card>


            {modalAction && (
                <Modal
                    isOpen={!!modalAction}
                    onClose={() => setModalAction(null)}
                    title={`Confirm: ${actions[modalAction].title}`}
                >
                    <p className="mb-4">{actions[modalAction].description}</p>
                    {actions[modalAction].warning && (
                        <p className="font-bold text-red-600 dark:text-red-400 mb-4">{actions[modalAction].warning}</p>
                    )}
                    <p>Are you sure you want to proceed?</p>
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="ghost" onClick={() => setModalAction(null)}>Cancel</Button>
                        <Button onClick={handleConfirmAction} variant={['cookies', 'local', 'all'].includes(modalAction) ? 'destructive' : 'default'}>Confirm</Button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default UserSettings;