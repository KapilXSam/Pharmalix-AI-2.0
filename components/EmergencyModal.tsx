
import React, { useState, useEffect } from 'react';
import type { Profile } from '../types';
import { Button } from './ui/Button';
import { Siren, PhoneCall, CheckCircle } from 'lucide-react';

interface EmergencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    profile: Profile | null;
}

type Stage = 'confirm' | 'sending' | 'sent';

const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose, profile }) => {
    const [stage, setStage] = useState<Stage>('confirm');
    const [location, setLocation] = useState<string | null>(null);

    useEffect(() => {
        // Reset stage when modal is reopened
        if (isOpen) {
            setStage('confirm');
            setLocation(null);
        }
    }, [isOpen]);

    const handleConfirm = () => {
        setStage('sending');

        // Try to get geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lon: ${position.coords.longitude.toFixed(4)}`);
                },
                () => {
                    setLocation('Location access denied.');
                },
                { timeout: 5000 }
            );
        } else {
            setLocation('Geolocation not supported.');
        }

        // Simulate API call
        setTimeout(() => {
            setStage('sent');
        }, 3000);
    };

    const renderContent = () => {
        switch (stage) {
            case 'sending':
                return (
                    <div className="text-center">
                        <div className="relative w-20 h-20 mx-auto mb-4">
                            <div className="absolute inset-0 border-4 border-dashed rounded-full animate-spin border-red-500"></div>
                            <PhoneCall className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-red-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Contacting Emergency Services...</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Your alert is being sent. Please remain calm.</p>
                    </div>
                );
            case 'sent':
                return (
                    <div className="text-center">
                        <CheckCircle className="h-16 w-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Alert Sent Successfully</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Help is on the way. Your emergency contacts and nearby services have been notified.</p>
                        <div className="text-xs text-slate-400 mt-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                            <p><strong>User:</strong> {profile?.full_name}</p>
                            <p><strong>Location:</strong> {location || 'Fetching location...'}</p>
                        </div>
                        <Button onClick={onClose} className="mt-6 w-full">Done</Button>
                    </div>
                );
            case 'confirm':
            default:
                return (
                    <div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">You are about to send an emergency alert. This will immediately notify emergency services and your pre-defined contacts with your location.</p>
                        <p className="font-bold text-red-600 dark:text-red-400 mb-6">Only use this in a genuine emergency.</p>
                        <div className="flex justify-end gap-4">
                            <Button variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button variant="destructive" onClick={handleConfirm}>Confirm & Send Alert</Button>
                        </div>
                    </div>
                );
        }
    };
    
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={stage !== 'sending' ? onClose : undefined}
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 max-w-lg w-full text-left transform transition-transform duration-300 animate-scaleIn border-t-4 border-red-500"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                         <Siren className="h-6 w-6 text-red-500" />
                         <h2 className="text-xl font-bold text-slate-900 dark:text-white">Emergency Alert</h2>
                    </div>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default EmergencyModal;
