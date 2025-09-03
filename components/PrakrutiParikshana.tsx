
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { PrakrutiAnalysis, View } from '../types';
import { analyzePrakrutiForm, analyzePrakrutiCertificate } from '../services/geminiService';
import { Leaf, UploadCloud, FileText, Bot, TrendingUp } from 'lucide-react';

import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import ImageUploader from './ImageUploader';
import { Button } from './ui/Button';
import PrakrutiQuestionnaire from './prakruti/PrakrutiQuestionnaire';
import AyurvedicChatbot from './prakruti/AyurvedicChatbot';

type ViewState = 'loading' | 'landing' | 'form' | 'upload' | 'analyzing' | 'result' | 'error';
type Language = 'english' | 'hindi';

interface PrakrutiParikshanaProps {
    setCurrentView: (view: View) => void;
}

interface AnalysisResultData {
    prakruti_type: string;
    summary: { english: string, hindi: string };
    recommendations: {
        diet: { english: string[], hindi: string[] };
        lifestyle: { english: string[], hindi: string[] };
    };
    disclaimer: string;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

const PrakrutiParikshana: React.FC<PrakrutiParikshanaProps> = ({ setCurrentView }) => {
    const [view, setView] = useState<ViewState>('loading');
    const [analysis, setAnalysis] = useState<PrakrutiAnalysis | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<Language>('english');

    const fetchExistingAnalysis = useCallback(async () => {
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in.");

            const { data, error: fetchError } = await supabase
                .from('prakruti_analysis')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            
            if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

            if (data) {
                setAnalysis(data);
                setView('result');
            } else {
                setView('landing');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to check for existing analysis.');
            setView('error');
        }
    }, []);

    useEffect(() => {
        fetchExistingAnalysis();
    }, [fetchExistingAnalysis]);

    const handleFormSubmit = async (formResponses: object, scores: { vata: number; pitta: number; kapha: number }) => {
        setView('analyzing');
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication error.");

            const result: AnalysisResultData = await analyzePrakrutiForm(formResponses);
            
            const { data: newAnalysis, error: insertError } = await supabase
                .from('prakruti_analysis')
                .insert({
                    user_id: user.id,
                    prakruti_type: result.prakruti_type,
                    summary: JSON.stringify(result),
                    form_responses: formResponses as any,
                    vata_score: scores.vata,
                    pitta_score: scores.pitta,
                    kapha_score: scores.kapha,
                })
                .select()
                .single();

            if (insertError) throw insertError;
            
            setAnalysis(newAnalysis);
            setView('result');

        } catch (err: any) {
            setError(err.message || 'An error occurred during analysis.');
            setView('error');
        }
    };
    
    const handleCertificateUpload = async (file: File) => {
        setView('analyzing');
        setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Authentication error.");
            
            const base64Data = await fileToBase64(file);
            const result = await analyzePrakrutiCertificate({ imageData: base64Data, mimeType: file.type });

            const filePath = `${user.id}/${Date.now()}-${file.name}`;
            const { error: uploadError } = await supabase.storage.from('prakruti_certificates').upload(filePath, file);
            if (uploadError) throw uploadError;

            const { data: newAnalysis, error: insertError } = await supabase
                .from('prakruti_analysis')
                .insert({
                    user_id: user.id,
                    prakruti_type: result.prakruti_type,
                    summary: JSON.stringify({ summary: { english: result.summary, hindi: '' }, recommendations: { diet: {}, lifestyle: {} }, disclaimer: 'This analysis is based on an uploaded certificate.' }),
                    certificate_url: filePath
                })
                .select()
                .single();
            
            if (insertError) throw insertError;

            setAnalysis(newAnalysis);
            setView('result');

        } catch (err: any) {
            setError(err.message || 'Failed to process certificate.');
            setView('error');
        }
    };

    const LandingView = () => (
        <div className="text-center max-w-4xl mx-auto">
            <Leaf className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-3">Discover Your Prakruti</h1>
            <p className="text-lg text-slate-600 dark:text-slate-300 mb-10">
                Understand your unique mind-body constitution through the ancient wisdom of Ayurveda to unlock personalized wellness insights.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div onClick={() => setView('form')} className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg cursor-pointer hover:-translate-y-2 transition-transform duration-300 border-2 border-transparent hover:border-emerald-500">
                    <FileText className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Complete Questionnaire</h2>
                    <p className="text-slate-500 dark:text-slate-400">Answer a detailed set of questions for an in-depth AI-powered analysis.</p>
                </div>
                 <div onClick={() => setView('upload')} className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-lg cursor-pointer hover:-translate-y-2 transition-transform duration-300 border-2 border-transparent hover:border-emerald-500">
                    <UploadCloud className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Upload Certificate</h2>
                    <p className="text-slate-500 dark:text-slate-400">Already have a Prakruti certificate? Upload it for our AI to read.</p>
                </div>
            </div>
        </div>
    );
    
    const ResultView = () => {
        if (!analysis || !analysis.summary) return <ErrorState message="Analysis data is missing." onRetry={fetchExistingAnalysis} />;
        
        // Safely parse summary
        let parsedSummary: AnalysisResultData;
        try {
            parsedSummary = JSON.parse(analysis.summary);
        } catch (e) {
            return <ErrorState message="Could not read analysis results." onRetry={fetchExistingAnalysis} />;
        }
        
        const RecommendationSection: React.FC<{title: string, items: string[]}> = ({title, items}) => (
            <div>
                <h4 className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2">{title}</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
            </div>
        );

        return (
             <div className="max-w-4xl mx-auto space-y-8">
                <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-teal-950/50 p-8 rounded-2xl text-center">
                     <p className="text-lg text-emerald-700 dark:text-emerald-300">Your Ayurvedic Constitution</p>
                     <h1 className="text-6xl font-extrabold text-emerald-900 dark:text-white my-2">{analysis.prakruti_type}</h1>
                </div>
                
                <div className="flex justify-center border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500'}`}>English</button>
                    <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-500'}`}>Hindi</button>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-6">
                    <div>
                        <h3 className="text-2xl font-bold mb-3">Analysis Summary</h3>
                        <p className="text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{parsedSummary.summary[language]}</p>
                    </div>
                    
                    {parsedSummary.recommendations && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <RecommendationSection title="Dietary Recommendations" items={parsedSummary.recommendations.diet[language]} />
                            <RecommendationSection title="Lifestyle Recommendations" items={parsedSummary.recommendations.lifestyle[language]} />
                        </div>
                    )}
                </div>

                <Button onClick={() => setCurrentView('prakruti-progress')} className="w-full bg-slate-600 hover:bg-slate-700">
                    <TrendingUp className="mr-2 h-5 w-5" /> View My Progress & Journal
                </Button>

                <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg">
                    <div className="p-6">
                        <h3 className="text-2xl font-bold mb-3 flex items-center gap-2"><Bot className="h-6 w-6 text-emerald-500"/> Chat with an Ayurvedic AI Assistant</h3>
                        <p className="text-slate-600 dark:text-slate-300">Ask questions about diet, lifestyle, or remedies related to your <strong className="text-emerald-600 dark:text-emerald-400">{analysis.prakruti_type}</strong> constitution.</p>
                    </div>
                    <AyurvedicChatbot prakrutiType={analysis.prakruti_type || 'Unknown'} />
                </div>
                
                <Button variant="outline" onClick={() => { setAnalysis(null); setView('landing'); }} className="w-full">Start a New Analysis</Button>
            </div>
        )
    };

    switch (view) {
        case 'loading': return <LoadingState message="Loading Prakruti Analysis..." />;
        case 'error': return <ErrorState message={error!} onRetry={fetchExistingAnalysis} />;
        case 'landing': return <LandingView />;
        case 'form': return <PrakrutiQuestionnaire onSubmit={handleFormSubmit} onBack={() => setView('landing')} />;
        case 'upload': return <div className="max-w-4xl mx-auto"><ImageUploader onFileSelect={handleCertificateUpload} onError={setError} icon={<UploadCloud className="h-16 w-16 mx-auto text-emerald-500 mb-4"/>} title="Upload Certificate" description="Please upload a clear image or PDF of your certificate." accept="image/*, application/pdf" /></div>;
        case 'analyzing': return <LoadingState message="AI is analyzing your information..." />;
        case 'result': return <ResultView />;
        default: return <ErrorState message="Invalid state." onRetry={() => setView('landing')} />
    }
};

export default PrakrutiParikshana;
