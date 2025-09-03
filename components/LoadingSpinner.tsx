import React from 'react';
import { Stethoscope } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
    return (
        <div className="flex items-center justify-center h-screen bg-[hsl(var(--background))]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-[hsl(var(--primary))]"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[hsl(var(--primary))]">
                    <Stethoscope className="h-8 w-8" />
                </div>
            </div>
        </div>
    );
};

export default LoadingSpinner;
