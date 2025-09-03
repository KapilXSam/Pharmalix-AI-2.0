import React, { useState, useEffect } from 'react';
import LabTestIcon from './icons/LabTestIcon';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzeLabReport } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error';

interface AnalysisResult {
    disclaimer: string;
    summary: { english: string; hindi: string; };
    results: {
        testName: string;
        value: string;
        referenceRange: string;
        status: string;
        interpretation: { english: string; hindi: string; };
    }[];
    clinicalSignificance: { english: string; hindi: string; };
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

const ResultRow: React.FC<{ result: AnalysisResult['results'][0], language: 'english' | 'hindi' }> = ({ result, language }) => {
    const getStatusColor = (status: string) => {
        const lowerStatus = status.toLowerCase();
        if (lowerStatus.includes('high') || lowerStatus.includes('abnormal')) return 'text-red-600 dark:text-red-400 border-red-500/30 bg-red-50 dark:bg-red-900/20';
        if (lowerStatus.includes('low')) return 'text-blue-600 dark:text-blue-400 border-blue-500/30 bg-blue-50 dark:bg-blue-900/20';
        return 'text-green-600 dark:text-green-400 border-green-500/30 bg-green-50 dark:bg-green-900/20';
    };

    return (
        <div className={`p-4 bg-white dark:bg-slate-800/50 rounded-lg border-l-4 ${getStatusColor(result.status)}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                <div className="font-semibold col-span-2 md:col-span-1 text-slate-800 dark:text-white">{result.testName}</div>
                <div className="font-mono text-slate-900 dark:text-white">{result.value}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400">{result.referenceRange}</div>
                <div className="font-bold">{result.status}</div>
            </div>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                {parseMarkdown(result.interpretation[language])}
            </p>
        </div>
    );
};

const LabTestAnalyzer: React.FC = () => {
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
        setResult(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;
        setViewState('loading');
        setError(null);

        try {
            const base64Data = await fileToBase64(imageFile);
            const analysis = await analyzeLabReport({
                imageData: base64Data,
                mimeType: imageFile.type
            });
            setResult(analysis);
            setViewState('result');
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
                            icon={<LabTestIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />}
                            title="AI Lab Test Analyzer"
                            description="Upload your lab report image for a bilingual (English & Hindi) AI analysis."
                            accept="image/*"
                        />
                    </>
                );

            case 'image_selected':
            case 'loading':
            case 'error':
                 return (
                    <div className="animate-slide-in max-w-3xl mx-auto space-y-6">
                        <LazyImage src={imageDataUrl!} alt="Uploaded Lab Report" className="rounded-xl shadow-lg w-full max-h-[50vh]" />
                        <div className="bg-[hsl(var(--card))] p-6 rounded-xl shadow-lg space-y-4">
                            {viewState === 'loading' && (
                                <div className="flex flex-col items-center justify-center h-full text-center py-8">
                                    <div className="relative mb-4"><div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div></div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">AI is Analyzing...</h2>
                                    <p className="text-slate-500 dark:text-slate-400 mt-2">This may take a moment.</p>
                                </div>
                            )}
                            {viewState === 'error' && <ErrorState message={error!} onRetry={handleAnalyze} />}
                            {viewState === 'image_selected' && (
                                <>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to Analyze</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Click the button below to start the AI-powered analysis of the lab report.</p>
                                    <Button onClick={handleAnalyze} className="w-full">Analyze Lab Report</Button>
                                </>
                            )}
                        </div>
                         <Button onClick={handleReset} variant="outline" className="w-full">Upload Another Image</Button>
                    </div>
                );

            case 'result':
                if (!result) return null;
                const hasAbnormalResults = result.results.some(r => r.status.toLowerCase() !== 'normal');
                return (
                    <>
                    {isChatting && <FollowUpChat reportTitle="Lab Test Report" reportData={result} onClose={() => setIsChatting(false)} />}
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-[hsl(var(--card))] p-6 rounded-xl shadow-lg space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">AI Analysis Report</h2>
                            {hasAbnormalResults && (
                                <div className="p-4 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-lg border-l-4 border-red-500">
                                    <h3 className="font-bold">! Attention Required</h3>
                                    <p className="mt-1 text-sm">One or more of your results are outside the normal range. Please review the details and consult with a doctor.</p>
                                </div>
                            )}
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400"><p><strong>Disclaimer:</strong> {result.disclaimer}</p></div>
                            
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>

                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">Summary</h3>
                                <p className="text-slate-700 dark:text-slate-300">{parseMarkdown(result.summary[language])}</p>
                            </div>

                             <div>
                                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">Results Breakdown</h3>
                                <div className="space-y-3">
                                   {result.results.map((res, index) => <ResultRow key={index} result={res} language={language} />)}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h3 className="text-xl font-semibold mb-3 text-slate-800 dark:text-white">Clinical Significance</h3>
                                <p className="text-slate-700 dark:text-slate-300">{parseMarkdown(result.clinicalSignificance[language])}</p>
                            </div>
                        </div>
                         <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">Analyze Another Report</Button>
                            <Button onClick={() => setIsChatting(true)} className="w-full">Chat with AI about this Report</Button>
                        </div>
                    </div>
                    </>
                );
            
            default: return null;
        }
    }

    return <div className="animate-slide-in">{renderContent()}</div>;
};

export default LabTestAnalyzer;
