import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import DermaScanIcon from './icons/DermaScanIcon';
import type { Medicine } from '../types';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzeDermaScan } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error' | 'consent';

type BilingualText = { english: string; hindi: string; };
type BilingualStringArray = { english: string[]; hindi: string[]; };

interface AiAnalysis {
    disclaimer: string;
    skin_disease_name: BilingualText;
    cause_factors: BilingualStringArray;
    dos_and_donts: {
        dos: BilingualStringArray;
        donts: BilingualStringArray;
    };
    diagnostic_tests: BilingualStringArray;
    learn_similar_cases: BilingualText;
    suggested_medicine_keywords: string[];
}

interface AnalysisResult extends AiAnalysis {
    db_medicines: Medicine[];
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
            return <strong key={index} className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1 py-0.5 rounded">{part}</strong>;
        }
        return part;
    });
};

const MedicineResultCard: React.FC<{ medicine: Medicine }> = ({ medicine }) => (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
        <h5 className="font-bold text-md text-slate-800 dark:text-white">{medicine.name}</h5>
        <p className="text-sm text-slate-500 dark:text-slate-400">by {medicine.manufacturer_name || 'N/A'}</p>
        <p className="text-sm mt-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold">Composition:</span> {medicine.short_composition1 || 'N/A'}
        </p>
    </div>
);

const AnalysisSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <h3 className="text-md font-semibold text-slate-800 dark:text-white mb-2">{title}</h3>
        <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">{children}</div>
    </div>
);


const DermaScanAnalyzer: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('initial');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSevere, setIsSevere] = useState(false);
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
        setResult(null);
        setError(null);
        setIsSevere(false);
        setImageDataUrl(URL.createObjectURL(file));
        setImageFile(file);
        setViewState('image_selected');
    };

    const processAnalysisResult = async (aiResult: AiAnalysis) => {
        const dosAndDontsText = JSON.stringify(aiResult.dos_and_donts).toLowerCase();
        if (dosAndDontsText.includes('immediate') || dosAndDontsText.includes('urgent') || dosAndDontsText.includes('melanoma') || dosAndDontsText.includes('severe')) {
            setIsSevere(true);
        } else {
            setIsSevere(false);
        }

        let medicines: Medicine[] = [];
        if (aiResult.suggested_medicine_keywords && aiResult.suggested_medicine_keywords.length > 0) {
            const searchTerms = aiResult.suggested_medicine_keywords.map((term: string) => `name.ilike.%${term}%,short_composition1.ilike.%${term}%`).join(',');

            const { data, error } = await supabase
                .from('medicines')
                .select('*')
                .or(searchTerms)
                .limit(5);

            if (error) {
                console.error("Error fetching suggested medicines:", error);
            } else {
                medicines = (data as unknown as Medicine[]) || [];
            }
        }
        
        setResult({ ...aiResult, db_medicines: medicines });
        setViewState('result');
    };

    const handleAnalyze = async (overrideSafety = false) => {
        if (!imageFile) return;

        setViewState('loading');
        setError(null);
        
        try {
            const base64Data = await fileToBase64(imageFile);
            const analysis = await analyzeDermaScan({
                imageData: base64Data,
                mimeType: imageFile.type,
                overrideSafety: overrideSafety
            });
            await processAnalysisResult(analysis);
        } catch (err: any) {
            if (err.message && err.message.includes('Analysis blocked due to:')) {
                setViewState('consent');
            } else {
                setError(err.message || 'An unknown error occurred during analysis.');
                setViewState('error');
            }
        }
    };
    
    const handleProceedWithBlock = () => {
        handleAnalyze(true);
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
        setIsSevere(false);
        setIsChatting(false);
    };

    const renderBlockedContentModal = () => (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Analysis Blocked for Safety</h2>
          <p className="text-slate-600 dark:text-slate-300 mb-6">
            The AI has flagged this image for safety reasons, which can be complicated. This can happen with images containing content like blood or open wounds. For your safety, we **strongly advise visiting a doctor** for a proper diagnosis.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => setViewState('image_selected')} variant="ghost">Cancel</Button>
            <Button onClick={handleProceedWithBlock} variant="destructive">Acknowledge Risk & Proceed</Button>
          </div>
        </div>
      </div>
    );
    
    const renderContent = () => {
        switch(viewState) {
            case 'initial':
                return (
                    <>
                        {error && <p className="text-red-500 text-center mb-4 p-3 bg-red-100 dark:bg-red-100/10 rounded-lg">{error}</p>}
                        <ImageUploader
                            onFileSelect={handleFileSelect}
                            onError={(msg) => { setError(msg); setViewState('initial'); }}
                            icon={<DermaScanIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />}
                            title="AI Derma Scan Analyzer"
                            description="Upload an image of a skin condition for an AI-powered analysis."
                            accept="image/*"
                        />
                    </>
                );
            case 'image_selected':
            case 'loading':
            case 'error':
            case 'consent':
                 return (
                    <div className="max-w-3xl mx-auto space-y-6">
                        {viewState === 'consent' && renderBlockedContentModal()}
                        <LazyImage src={imageDataUrl!} alt="Uploaded skin condition" className="rounded-xl shadow-lg w-full max-h-[50vh]" />
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                             {viewState === 'loading' && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="relative mb-4">
                                        <div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div>
                                        <div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div>
                                        <DermaScanIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-sky-500" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI is Analyzing...</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">This may take a moment.</p>
                                </div>
                             )}
                             {viewState === 'error' && <ErrorState message={error!} onRetry={() => handleAnalyze()} />}
                             {(viewState === 'image_selected' || viewState === 'consent') && (
                                <>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to Analyze</h2>
                                <p className="text-slate-600 dark:text-slate-400">Click the button below to start the AI-powered analysis of the uploaded image.</p>
                                <Button onClick={() => handleAnalyze()} className="w-full">Analyze Image</Button>
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
                    {isChatting && <FollowUpChat reportTitle="Derma Scan Report" reportData={result} onClose={() => setIsChatting(false)} />}
                     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        <div className="lg:col-span-1 lg:sticky lg:top-8 space-y-4">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Scan</h3>
                            <LazyImage src={imageDataUrl!} alt="Analyzed skin condition" className="rounded-xl shadow-lg w-full" />
                             <div className="flex flex-col sm:flex-row gap-4">
                                <Button onClick={handleReset} variant="outline" className="w-full">Start New Scan</Button>
                                <Button onClick={() => setIsChatting(true)} className="w-full">Chat with AI</Button>
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg space-y-6">
                             {isSevere && (
                                <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg border-l-4 border-red-500 animate-pulse">
                                    <h3 className="font-bold text-lg">! SEVERE CONDITION POSSIBLE</h3>
                                    <p className="mt-1">The AI analysis suggests signs of a potentially severe condition. **Please seek immediate medical attention from a qualified dermatologist.**</p>
                                </div>
                             )}
                             <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{parseMarkdown(result.skin_disease_name[language])}</h2>
                             <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400">
                                <p><strong>Disclaimer:</strong> {result.disclaimer}</p>
                            </div>
                            
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>

                            <AnalysisSection title="Potential Cause Factors">
                                <ul className="list-disc list-inside space-y-1">{result.cause_factors[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}</ul>
                            </AnalysisSection>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-green-50 dark:bg-green-900/50 p-4 rounded-lg">
                                    <h4 className="font-bold text-green-800 dark:text-green-200 mb-2">Do's</h4>
                                    <ul className="list-disc list-inside space-y-1">{result.dos_and_donts.dos[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}</ul>
                                </div>
                                 <div className="bg-red-50 dark:bg-red-900/50 p-4 rounded-lg">
                                    <h4 className="font-bold text-red-800 dark:text-red-200 mb-2">Don'ts</h4>
                                    <ul className="list-disc list-inside space-y-1">{result.dos_and_donts.donts[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}</ul>
                                </div>
                            </div>

                            <AnalysisSection title="Suggested Diagnostic Reports">
                                <ul className="list-disc list-inside space-y-1">{result.diagnostic_tests[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}</ul>
                            </AnalysisSection>
                            
                            <AnalysisSection title="Preferable Medicine (from Database)">
                                {result.db_medicines.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {result.db_medicines.map(med => <MedicineResultCard key={med.id} medicine={med} />)}
                                    </div>
                                ) : <p>No specific medicines found in our database based on the analysis. Please consult a doctor for a prescription.</p>}
                            </AnalysisSection>

                            <AnalysisSection title="Learn About Similar Cases">
                                <p>{parseMarkdown(result.learn_similar_cases[language])}</p>
                            </AnalysisSection>
                        </div>
                    </div>
                    </>
                );

            default: return null;
        }
    }

    return (
        <div className="animate-fadeIn max-w-7xl mx-auto">
            {renderContent()}
        </div>
    );
};

export default DermaScanAnalyzer;
