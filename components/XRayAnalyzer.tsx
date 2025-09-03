import React, { useState, useEffect } from 'react';
import XRayIcon from './icons/XRayIcon';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzeXRay } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error';

type BilingualStringArray = {
    english: string[];
    hindi: string[];
};

interface AnalysisResult {
    disclaimer: string;
    detection: BilingualStringArray;
    classification: BilingualStringArray;
    localization: BilingualStringArray;
    comparison: BilingualStringArray;
    relationship: BilingualStringArray;
    diagnostic_considerations: BilingualStringArray;
    characterization: BilingualStringArray;
    technical_notes: BilingualStringArray;
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

interface AnalysisSectionProps {
    title: string;
    items: string[];
}

const AnalysisSection: React.FC<AnalysisSectionProps> = ({ title, items }) => {
    if (!items || items.length === 0 || items.every(item => !item)) return null;

    const parseMarkdown = (text: string) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, index) => {
            if (index % 2 === 1) { // This is a bold part
                return <strong key={index} className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/50 px-1 py-0.5 rounded">{part}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
            <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-200">{title}</h3>
            <ul className="space-y-1.5 list-disc list-inside text-sm text-slate-700 dark:text-slate-300">
                {items.map((item, index) => item && <li key={index}>{parseMarkdown(item)}</li>)}
            </ul>
        </div>
    );
};


const XRayAnalyzer: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('initial');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
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
        setError(null);
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;

        setViewState('loading');
        setError(null);

        try {
            const base64Data = await fileToBase64(imageFile);
            const analysis = await analyzeXRay({
                imageData: base64Data,
                mimeType: imageFile.type
            });
            setResult(analysis);
            setViewState('result');
        } catch (err: any) {
            console.error('Error analyzing X-Ray:', err);
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
                            icon={<XRayIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />}
                            title="AI Chest X-Ray (CXR) Analyzer"
                            description="Upload a chest X-ray for an AI-powered preliminary analysis."
                            accept="image/*"
                        />
                    </>
                );

            case 'image_selected':
            case 'loading':
            case 'error':
                return (
                    <div className="animate-slide-in max-w-3xl mx-auto space-y-6">
                        <LazyImage src={imageDataUrl!} alt="Uploaded X-Ray" className="rounded-xl shadow-lg w-full max-h-[50vh] bg-black" />
                        <div className="bg-[hsl(var(--card))] p-6 rounded-xl shadow-lg space-y-4">
                            {viewState === 'loading' ? (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="relative mb-4"><div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div></div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI is Analyzing...</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">This may take a moment.</p>
                                </div>
                            ) : viewState === 'error' ? (
                                <ErrorState message={error!} onRetry={handleAnalyze} />
                            ) : (
                                <>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to Analyze</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Click the button below to start the AI-powered analysis of the X-Ray.</p>
                                    <Button onClick={handleAnalyze} className="w-full">Analyze X-Ray</Button>
                                </>
                            )}
                        </div>
                        <Button onClick={handleReset} variant="outline" className="w-full">Upload Another Image</Button>
                    </div>
                );

            case 'result':
                if (!result) return null;
                const hasCriticalFinding = JSON.stringify(result.diagnostic_considerations).includes("immediate medical attention");
                return (
                    <>
                    {isChatting && <FollowUpChat reportTitle="X-Ray Analysis Report" reportData={result} onClose={() => setIsChatting(false)} />}
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-[hsl(var(--card))] p-6 rounded-xl shadow-lg space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">X-Ray Analysis Report</h2>
                            
                            {hasCriticalFinding && (
                                <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg border-l-4 border-red-500">
                                    <h3 className="font-bold">! Critical Alert</h3>
                                    <p className="mt-1 text-sm">This report contains findings that may require immediate medical attention. Please consult a doctor urgently.</p>
                                </div>
                            )}

                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400">
                                <p><strong>Disclaimer:</strong> {result.disclaimer}</p>
                            </div>
                            
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <AnalysisSection title="Detection" items={result.detection[language]} />
                                <AnalysisSection title="Classification" items={result.classification[language]} />
                                <AnalysisSection title="Localization" items={result.localization[language]} />
                                <AnalysisSection title="Comparison" items={result.comparison[language]} />
                                <AnalysisSection title="Relationship" items={result.relationship[language]} />
                                <AnalysisSection title="Characterization" items={result.characterization[language]} />
                                <AnalysisSection title="Diagnostic Considerations" items={result.diagnostic_considerations[language]} />
                                <AnalysisSection title="Technical Notes" items={result.technical_notes[language]} />
                            </div>

                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">Analyze Another X-Ray</Button>
                            <Button onClick={() => setIsChatting(true)} className="w-full">Chat with AI about this Report</Button>
                        </div>
                    </div>
                    </>
                );
            default:
                return null;
        }
    };

    return <div className="animate-slide-in">{renderContent()}</div>;
};

export default XRayAnalyzer;
