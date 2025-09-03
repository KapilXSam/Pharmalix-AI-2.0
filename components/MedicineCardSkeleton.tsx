import React from 'react';

const MedicineCardSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
        <div className="animate-pulse">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
            
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-5"></div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
            </div>
        </div>
    </div>
);

export default MedicineCardSkeleton;
