import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Timer, LogOut } from 'lucide-react';

interface SessionTimeoutModalProps {
    isOpen: boolean;
    onStay: () => void;
    onLogout: () => void;
    countdownSeconds?: number;
}

const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({ isOpen, onStay, onLogout, countdownSeconds = 60 }) => {
    const [countdown, setCountdown] = useState(countdownSeconds);

    useEffect(() => {
        if (isOpen) {
            setCountdown(countdownSeconds);
            const interval = setInterval(() => {
                setCountdown(prev => (prev > 0 ? prev - 1 : 0));
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isOpen, countdownSeconds]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border-t-4 border-amber-500">
                <Timer className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Are you still there?</h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    For your security, you will be logged out automatically due to inactivity in{' '}
                    <span className="font-bold text-amber-500">{countdown}</span> seconds.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button variant="outline" onClick={onLogout} className="w-full">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out Now
                    </Button>
                    <Button onClick={onStay} className="w-full">
                        Stay Logged In
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeoutModal;
