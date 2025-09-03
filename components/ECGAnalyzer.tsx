import React, { useState, useCallback, useEffect } from 'react';
import ECGIcon from './icons/ECGIcon';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzeECG } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error';

type BilingualText = { english: string; hindi: string; };
type BilingualStringArray = { english: string[]; hindi: string[]; };

interface AnalysisResult {
    disclaimer: string;
    rhythm_analysis: { heart_rate: string; rhythm: BilingualText; };
    intervals: { pr: string; qrs: string; qt_qtc: string; };
    axis: string;
    morphology: BilingualStringArray;
    impression: BilingualStringArray;
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

const parseMarkdown = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
        if (index % 2 === 1) { // This is a bold part
            return <strong key={index} className="font-semibold text-sky-600 dark:text-sky-400">{part}</strong>;
        }
        return part;
    });
};

const ECGAnalyzer: React.FC = () => {
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
            const analysis = await analyzeECG({
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
                            icon={<ECGIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />}
                            title="AI ECG Analyzer"
                            description="Upload your ECG image for a detailed, AI-powered clinical interpretation."
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </>
                );
            
            case 'image_selected':
            case 'loading':
            case 'error':
                 return (
                    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
                        <LazyImage src={imageDataUrl!} alt="Uploaded ECG" className="rounded-xl shadow-lg w-full max-h-[50vh] bg-white" />
                         <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
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
                                <p className="text-slate-600 dark:text-slate-400">Click the button below to start the AI-powered analysis of the uploaded ECG.</p>
                                <Button onClick={handleAnalyze} className="w-full">Analyze ECG</Button>
                                </>
                             )}
                        </div>
                        <Button onClick={handleReset} variant="outline" className="w-full">Upload Another Image</Button>
                    </div>
                );
            
            case 'result':
                const ResultCard: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2">{title}</h4>
                        <div className="text-slate-800 dark:text-slate-200">{children}</div>
                    </div>
                );
                
                if (!result) return null;

                return (
                    <>
                    {isChatting && <FollowUpChat reportTitle="ECG Report" reportData={result} onClose={() => setIsChatting(false)} />}
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">ECG Interpretation Report</h2>
                             <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400">
                                <p><strong>Disclaimer:</strong> {result.disclaimer}</p>
                            </div>
                            
                            <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ResultCard title="Heart Rate">{parseMarkdown(result.rhythm_analysis.heart_rate)}</ResultCard>
                                <ResultCard title="Rhythm">{parseMarkdown(result.rhythm_analysis.rhythm[language])}</ResultCard>
                                <ResultCard title="PR Interval">{parseMarkdown(result.intervals.pr)}</ResultCard>
                                <ResultCard title="QRS Duration">{parseMarkdown(result.intervals.qrs)}</ResultCard>
                                <ResultCard title="QT/QTc Interval">{parseMarkdown(result.intervals.qt_qtc)}</ResultCard>
                                <ResultCard title="Axis">{parseMarkdown(result.axis)}</ResultCard>
                            </div>

                            <ResultCard title="Morphology">
                                <ul className="list-disc list-inside space-y-1">
                                    {result.morphology[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}
                                </ul>
                            </ResultCard>
                             <ResultCard title="Interpretive Summary">
                                <ul className="list-disc list-inside space-y-1">
                                    {result.impression[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}
                                </ul>
                            </ResultCard>
                             {result.technical_notes && result.technical_notes[language].length > 0 && (
                                 <ResultCard title="Technical Notes">
                                     <ul className="list-disc list-inside space-y-1">
                                        {result.technical_notes[language].map((item, i) => <li key={i}>{parseMarkdown(item)}</li>)}
                                     </ul>
                                 </ResultCard>
                             )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">Analyze Another ECG</Button>
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

export default ECGAnalyzer;
