import React from 'react';

interface LoadingStateProps {
    message: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message }) => {
    return (
        <div className="flex flex-col items-center justify-center p-10 text-center animate-fadeIn bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="relative mb-4">
                <div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div>
                <div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8 text-sky-500"><path d="M12 2a9 9 0 0 0-9 9c0 4.29 3.29 7.82 7.5 8.75V22h3v-2.25C17.71 18.82 21 15.29 21 11a9 9 0 0 0-9-9z"></path><path d="M9.5 12.5h5"></path><path d="M12 10v5"></path></svg>
                </div>
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{message}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Please wait a moment.</p>
        </div>
    );
};

export default LoadingState;
