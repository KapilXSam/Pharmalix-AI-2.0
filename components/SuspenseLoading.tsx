import React from 'react';

const SuspenseLoading: React.FC = () => (
    <div className="flex items-center justify-center h-full w-full py-20">
        <div className="relative">
            <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-sky-500"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sky-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8"><path d="M12 2a9 9 0 0 0-9 9c0 4.29 3.29 7.82 7.5 8.75V22h3v-2.25C17.71 18.82 21 15.29 21 11a9 9 0 0 0-9-9z"></path><path d="M9.5 12.5h5"></path><path d="M12 10v5"></path></svg>
            </div>
        </div>
    </div>
);

export default SuspenseLoading;
