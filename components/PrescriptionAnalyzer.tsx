import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Medicine } from '../types';
import PrescriptionIcon from './icons/PrescriptionIcon';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzePrescription } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error';

interface OCRMedicine {
    name: string;
    dosage: string;
    duration: string;
    purpose: { english: string; hindi: string; };
}

interface AnalysisResult {
    doctor_details: { name: string; clinic: string };
    patient_details: { name: string; age: string };
    medicines: OCRMedicine[];
}

interface ProcessedMedicine extends OCRMedicine {
    db_info: Medicine | null;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            resolve(result);
        };
        reader.onerror = error => reject(error);
    });
};

const parseMarkdown = (text: string) => {
    if (!text) return '';
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
        if (index % 2 === 1) { // This is a bold part
            return <strong key={index} className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">{part}</strong>;
        }
        return part;
    });
};

const MedicineResultCard: React.FC<{ medicine: ProcessedMedicine, language: 'english' | 'hindi' }> = ({ medicine, language }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-xl font-bold text-sky-600 dark:text-sky-400">{parseMarkdown(medicine.name)}</h4>
        
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div><strong className="font-semibold text-slate-600 dark:text-slate-300">Dosage (from Rx):</strong> {parseMarkdown(medicine.dosage || 'N/A')}</div>
            <div><strong className="font-semibold text-slate-600 dark:text-slate-300">Duration (from Rx):</strong> {parseMarkdown(medicine.duration || 'N/A')}</div>
            <div className="col-span-2"><strong className="font-semibold text-slate-600 dark:text-slate-300">Purpose (AI-Inferred):</strong> {parseMarkdown(medicine.purpose[language] || 'N/A')}</div>
        </div>

        {medicine.db_info ? (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                <h5 className="font-semibold text-green-700 dark:text-green-400 mb-1">✓ Verified in Database</h5>
                <p className="text-sm text-slate-500"><strong className="font-medium">Manufacturer:</strong> {medicine.db_info.manufacturer_name || 'N/A'}</p>
                 <p className="text-sm text-slate-500"><strong className="font-medium">Composition:</strong> {medicine.db_info.short_composition1 || 'N/A'}</p>
            </div>
        ) : (
             <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                 <h5 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-1">! Not verified in database</h5>
                 <p className="text-xs text-slate-500">Details above are based on AI-reading of the prescription only.</p>
             </div>
        )}
    </div>
);

const PrescriptionAnalyzer: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('initial');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [result, setResult] = useState<{ ocr: AnalysisResult; processed: ProcessedMedicine[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'english' | 'hindi'>('english');
    const [isChatting, setIsChatting] = useState(false);
    
    useEffect(() => {
        return () => {
            if (imageDataUrl) {
                URL.revokeObjectURL(imageDataUrl);
            }
        };
    }, [imageDataUrl]);

    const handleFileSelect = (file: File) => {
        setImageFile(file);
        setImageDataUrl(URL.createObjectURL(file));
        setViewState('image_selected');
        setResult(null);
        setError(null);
    };
    
    const processAnalysisResult = async (analysis: AnalysisResult) => {
        setLoadingMessage('Verifying medicines in database...');
        
        const medicinePromises = analysis.medicines.map(async (med: OCRMedicine) => {
            const cleanedName = med.name.replace(/\*\*/g, '');
            const searchName = cleanedName.split(' ')[0];

            const { data: db_info } = await supabase
                .from('medicines')
                .select('*')
                .ilike('name', `%${searchName}%`)
                .limit(1)
                .single();

            return { ...med, db_info: (db_info as Medicine) || null };
        });

        const processedMedicines = await Promise.all(medicinePromises);
        setResult({ ocr: analysis, processed: processedMedicines });
        setViewState('result');

        const unverifiedOcrMeds = processedMedicines
            .filter(med => !med.db_info)
            .map(({ db_info, ...ocrMed }) => ocrMed);

        if (unverifiedOcrMeds.length > 0) {
            // This is a fire-and-forget background task.
            const medicinesToInsert = unverifiedOcrMeds.map(med => ({
                name: med.name.replace(/\*\*/g, ''),
                short_composition1: med.purpose.english.replace(/\*\*/g, ''),
            }));
            await supabase.from('medicines').insert(medicinesToInsert);
        }
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;
        setViewState('loading');
        setLoadingMessage('Performing OCR on prescription...');
        setError(null);

        try {
            const base64Data = await fileToBase64(imageFile);
            const analysis = await analyzePrescription({
                imageData: base64Data,
                mimeType: imageFile.type
            });
            await processAnalysisResult(analysis);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred during analysis.');
            setViewState('error');
        }
    };
    
    const handleReset = () => {
        setViewState('initial');
        setImageFile(null);
        if (imageDataUrl) {
            URL.revokeObjectURL(imageDataUrl);
            setImageDataUrl(null);
        }
        setResult(null);
        setError(null);
        setIsChatting(false);
    };

    const renderContent = () => {
        switch (viewState) {
            case 'initial':
                return (
                    <>
                        {error && <p className="text-red-500 text-center mb-4 p-3 bg-red-100 dark:bg-red-100/10 rounded-lg">{error}</p>}
                        <ImageUploader
                            onFileSelect={handleFileSelect}
                            onError={(msg) => { setError(msg); setViewState('initial'); }}
                            icon={<PrescriptionIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />}
                            title="AI Prescription Analyzer"
                            description="Upload a prescription to extract details and verify medicines against our database."
                            accept="image/*"
                        />
                    </>
                );
            
            case 'image_selected':
            case 'loading':
            case 'error':
                 return (
                    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
                        <LazyImage src={imageDataUrl!} alt="Uploaded Prescription" className="rounded-xl shadow-lg w-full max-h-[50vh]" />
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                             {viewState === 'loading' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="relative mb-4"><div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div></div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">{loadingMessage || 'Analyzing...'}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">This may take a moment.</p>
                                </div>
                            ) : viewState === 'error' ? (
                                <ErrorState message={error!} onRetry={handleAnalyze} />
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to Analyze</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Click the button below to start the AI-powered analysis of the prescription.</p>
                                    <Button onClick={handleAnalyze} className="w-full">Analyze Prescription</Button>
                                </>
                            )}
                        </div>
                        <Button onClick={handleReset} variant="outline" className="w-full">Upload Another Image</Button>
                    </div>
                );
            
            case 'result':
                if (!result) return null;
                return (
                     <>
                     {isChatting && <FollowUpChat reportTitle="Prescription Analysis" reportData={result.ocr} onClose={() => setIsChatting(false)} />}
                     <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Prescription Analysis</h2>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400">
                                <p><strong>Note:</strong> This is an AI-generated analysis and not a valid prescription. Always consult with a qualified healthcare professional.</p>
                            </div>
                            
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Doctor Details</p>
                                    <p className="text-slate-800 dark:text-white">{parseMarkdown(result.ocr.doctor_details.name || 'N/A')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{parseMarkdown(result.ocr.doctor_details.clinic || 'N/A')}</p>
                                </div>
                                 <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Patient Details</p>
                                    <p className="text-slate-800 dark:text-white">{parseMarkdown(result.ocr.patient_details.name || 'N/A')}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">{parseMarkdown(result.ocr.patient_details.age || 'N/A')}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-3">Prescribed Medicines</h3>
                                <div className="space-y-4">
                                    {result.processed.map((med, index) => <MedicineResultCard key={index} medicine={med} language={language} />)}
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">Analyze Another Prescription</Button>
                            <Button onClick={() => setIsChatting(true)} className="w-full">Chat with AI about this Report</Button>
                        </div>
                    </div>
                    </>
                );

            default: return null;
        }
    };

    return <div className="animate-fadeIn">{renderContent()}</div>;
};

export default PrescriptionAnalyzer;