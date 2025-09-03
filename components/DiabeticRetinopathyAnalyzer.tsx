import React, { useState, useEffect } from 'react';
import EyeIcon from './icons/EyeIcon';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { analyzeDiabeticRetinopathy } from '../services/geminiService';
import { Button } from './ui/Button';
import LazyImage from './LazyImage';
import FollowUpChat from './FollowUpChat';

type ViewState = 'initial' | 'image_selected' | 'loading' | 'result' | 'error';
type Language = 'english' | 'hindi';

interface BilingualText {
    english: string;
    hindi: string;
}

interface AnalysisResult {
    disclaimer: string;
    dr_grading: number;
    dme_grading: string;
    findings: BilingualText;
    recommendation: BilingualText;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
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

const GradingCard: React.FC<{ title: string; value: string | number; description: string; color: string }> = ({ title, value, description, color }) => (
    <div className={`p-6 rounded-xl border-l-4 ${color}`}>
        <p className="text-sm font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-5xl font-extrabold my-2">{value}</p>
        <p className="text-sm">{description}</p>
    </div>
);

const DiabeticRetinopathyAnalyzer: React.FC = () => {
    const [viewState, setViewState] = useState<ViewState>('initial');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<Language>('english');
    const [isChatting, setIsChatting] = useState(false);

    useEffect(() => {
        return () => { if (imageDataUrl) URL.revokeObjectURL(imageDataUrl); };
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
            const analysis = await analyzeDiabeticRetinopathy({
                imageData: base64Data,
                mimeType: imageFile.type
            });
            setResult(analysis);
            setViewState('result');
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            setViewState('error');
        }
    };

    const handleReset = () => {
        setViewState('initial');
        setImageFile(null);
        if (imageDataUrl) URL.revokeObjectURL(imageDataUrl);
        setImageDataUrl(null);
        setResult(null);
        setError(null);
        setIsChatting(false);
    };

    const drGradeMap: Record<number, { name: string, color: string }> = {
        0: { name: "No DR", color: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-500" },
        1: { name: "Mild NPDR", color: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-500" },
        2: { name: "Moderate NPDR", color: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-500" },
        3: { name: "Severe NPDR", color: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-500" },
        4: { name: "Proliferative DR", color: "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 border-purple-500" },
    };

    const dmeGradeMap: Record<string, { color: string }> = {
        "No DME": { color: "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 border-green-500" },
        "Mild DME": { color: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 border-yellow-500" },
        "Moderate DME": { color: "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200 border-orange-500" },
        "Severe DME": { color: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 border-red-500" },
    };

    const renderContent = () => {
        switch(viewState) {
            case 'initial':
                return <ImageUploader onFileSelect={handleFileSelect} onError={setError} icon={<EyeIcon className="h-16 w-16 mx-auto text-sky-500 mb-4" />} title="Diabetic Retinopathy Analyzer" description="Upload a retinal fundus image for AI-powered DR & DME grading." accept="image/*"/>;
            
            case 'image_selected':
            case 'loading':
            case 'error':
                return (
                    <div className="animate-fadeIn max-w-3xl mx-auto space-y-6">
                        <LazyImage src={imageDataUrl!} alt="Uploaded Fundus" className="rounded-xl shadow-lg w-full max-h-[50vh] bg-black" />
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                            {viewState === 'loading' && <div className="text-center py-8"><div className="relative w-16 h-16 mx-auto mb-4"><div className="w-16 h-16 border-4 border-sky-200 rounded-full"></div><div className="absolute top-0 left-0 w-16 h-16 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div></div><h2 className="text-xl font-bold">AI is Analyzing...</h2><p className="text-slate-500 dark:text-slate-400 mt-2">This may take a moment.</p></div>}
                            {viewState === 'error' && <ErrorState message={error!} onRetry={handleAnalyze} />}
                            {viewState === 'image_selected' && <>
                                <h2 className="text-2xl font-bold">Ready to Analyze</h2>
                                <p className="text-slate-600 dark:text-slate-400">Click below to start the AI analysis of the fundus image.</p>
                                <Button onClick={handleAnalyze} className="w-full">Analyze Image</Button>
                            </>}
                        </div>
                        <Button onClick={handleReset} variant="outline" className="w-full">Upload Another Image</Button>
                    </div>
                );
            
            case 'result':
                if (!result) return null;
                return (
                    <>
                    {isChatting && <FollowUpChat reportTitle="Diabetic Retinopathy Report" reportData={result} onClose={() => setIsChatting(false)} />}
                    <div className="max-w-4xl mx-auto space-y-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Analysis Report</h2>
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400"><p><strong>Disclaimer:</strong> {result.disclaimer}</p></div>
                             <div className="flex border-b border-slate-200 dark:border-slate-700">
                                <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                                <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800 dark:text-white">
                                <GradingCard title="Diabetic Retinopathy (DR)" value={result.dr_grading} description={drGradeMap[result.dr_grading]?.name || 'Unknown Grade'} color={drGradeMap[result.dr_grading]?.color || ''} />
                                <GradingCard title="Diabetic Macular Edema (DME)" value={result.dme_grading} description="Clinical Assessment" color={dmeGradeMap[result.dme_grading]?.color || ''} />
                            </div>

                             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Findings</h3>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{parseMarkdown(result.findings[language])}</p>
                            </div>
                             <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Recommendation</h3>
                                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{parseMarkdown(result.recommendation[language])}</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button onClick={handleReset} variant="outline" className="w-full">Analyze Another Image</Button>
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

export default DiabeticRetinopathyAnalyzer;
