import React from 'react';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { Mic } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface VoiceInputButtonProps {
    onTranscriptUpdate: (transcript: string) => void;
    className?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscriptUpdate, className }) => {
    const { isListening, toggleListening, hasSupport } = useVoiceRecognition({
        onResult: (result) => {
            onTranscriptUpdate(result);
        },
        onError: (error) => {
            console.error('Voice recognition error:', error);
            // Optionally, provide user feedback here
        }
    });

    if (!hasSupport) {
        return null;
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleListening}
            className={cn(
                'text-slate-500 transition-colors flex-shrink-0',
                isListening && 'text-red-500 bg-red-500/10 animate-pulse',
                className
            )}
            title={isListening ? 'Stop listening' : 'Start voice input'}
        >
            <Mic className="h-5 w-5" />
        </Button>
    );
};
