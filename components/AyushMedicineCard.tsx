import React from 'react';
import type { AyushMedicine } from '../types';

const getTypeStyles = (type: AyushMedicine['medicine_type']) => {
    switch (type) {
        case 'Ayurvedic':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'Homeopathic':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'Unani':
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        default:
            return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200';
    }
};

const AyushMedicineCard: React.FC<{ medicine: AyushMedicine }> = ({ medicine }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-green-100 dark:hover:shadow-green-900/50 transition-shadow duration-300 flex flex-col">
        <div className="flex justify-between items-start mb-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white pr-4">{medicine.brand_name || 'N/A'}</h3>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${getTypeStyles(medicine.medicine_type)}`}>
                {medicine.medicine_type}
            </span>
        </div>
        
        {medicine.manufacturer_name && (
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">by {medicine.manufacturer_name}</p>
        )}
        
        <div className="space-y-3 flex-grow">
            {medicine.generic_name_and_strength && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Generic Name & Strength</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{medicine.generic_name_and_strength}</p>
                </div>
            )}

            {medicine.dosage_description && (
                <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Dosage</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{medicine.dosage_description}</p>
                </div>
            )}
        </div>

        {medicine.dar && (
            <div className="pt-3 mt-4 border-t border-slate-200 dark:border-slate-700 text-right">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">DAR: {medicine.dar}</p>
            </div>
        )}
    </div>
);

export default AyushMedicineCard;
