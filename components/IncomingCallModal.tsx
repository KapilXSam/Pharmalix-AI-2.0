import React from 'react';
import { Button } from './ui/Button';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallModalProps {
    callerName: string;
    onAccept: () => void;
    onDecline: () => void;
}

const IncomingCallModal: React.FC<IncomingCallModalProps> = ({ callerName, onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fadeIn p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center animate-scaleIn">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Incoming Call</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                    You have an incoming video call from <strong className="text-slate-700 dark:text-slate-200">{callerName}</strong>.
                </p>
                <div className="flex justify-center gap-4">
                    <Button onClick={onDecline} variant="destructive" size="lg" className="rounded-full !p-4">
                        <PhoneOff className="h-6 w-6" />
                    </Button>
                    <Button onClick={onAccept} size="lg" className="bg-green-600 hover:bg-green-700 rounded-full !p-4">
                        <Phone className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;