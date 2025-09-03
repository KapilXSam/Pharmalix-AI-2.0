import React, { useState } from 'react';
import { analyzeSymptoms } from '../services/geminiService';
import { HeartPulse } from 'lucide-react';
import ErrorState from './ErrorState';
import { VoiceInputButton } from './VoiceInputButton';

const commonSymptoms = [
    'Fever', 'Cough', 'Headache', 'Fatigue', 'Sore Throat', 'Shortness of Breath',
    'Nausea', 'Diarrhea', 'Muscle Aches', 'Loss of Smell/Taste', 'Chills', 'Runny Nose'
];

interface BilingualText {
    english: string;
    hindi: string;
}

interface PotentialCause {
    cause: BilingualText;
    description: BilingualText;
    likelihood: 'High' | 'Medium' | 'Low' | string;
}

interface AnalysisResult {
    potentialCauses: PotentialCause[];
    recommendations: {
        english: string[];
        hindi: string[];
    };
    severity: 'Mild' | 'Moderate' | 'Severe' | 'Seek immediate attention' | string;
    disclaimer: string;
}

const SymptomChecker: React.FC = () => {
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [otherSymptom, setOtherSymptom] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<'english' | 'hindi'>('english');


    const handleSymptomToggle = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
        );
    };

    const handleAnalyze = async () => {
        const allSymptoms = [...selectedSymptoms];
        if (otherSymptom.trim()) {
            allSymptoms.push(otherSymptom.trim());
        }

        if (allSymptoms.length === 0) {
            setError('Please select at least one symptom.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysis = await analyzeSymptoms(allSymptoms);
            setResult(analysis);
        } catch (err) {
            console.error('Error analyzing symptoms:', err);
            setError('Sorry, an error occurred while analyzing your symptoms. Please check your network connection and try again.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleReset = () => {
        setSelectedSymptoms([]);
        setOtherSymptom('');
        setResult(null);
        setError(null);
        setIsLoading(false);
    };

    const getSeverityStyles = (severity: AnalysisResult['severity']) => {
        switch (severity) {
            case 'Seek immediate attention':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200 border-red-500';
            case 'Severe':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200 border-orange-500';
            case 'Moderate':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200 border-yellow-500';
            case 'Mild':
            default:
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200 border-green-500';
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center animate-fadeIn">
                 <div className="relative mb-4">
                    <div className="w-20 h-20 border-4 border-sky-200 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-20 h-20 border-4 border-sky-500 rounded-full animate-spin border-t-transparent"></div>
                    <HeartPulse className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 text-sky-500" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">Analyzing Your Symptoms...</h2>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Our AI is processing your information. This may take a moment.</p>
            </div>
        )
    }

    if (error) {
        return <ErrorState message={error} onRetry={handleAnalyze} />;
    }
    
    if (result) {
        return (
            <div className="max-w-4xl mx-auto animate-slide-in space-y-6">
                <div className={`p-6 rounded-xl border-l-4 ${getSeverityStyles(result.severity)}`}>
                    <h3 className="text-xl font-bold">Severity Level: {result.severity}</h3>
                    <p className="mt-1">Based on the symptoms you provided, here is a preliminary analysis.</p>
                </div>
                
                 <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                    <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4">Potential Causes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.potentialCauses.map((cause, index) => (
                             <div key={index} className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-lg">{cause.cause[language]}</h4>
                                    <span className="text-xs font-semibold px-2 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200 rounded-full">{cause.likelihood} Likelihood</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mt-2">{cause.description[language]}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-2xl font-bold mb-4">Recommendations</h3>
                    <div className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                        <ul className="space-y-2 list-disc list-inside text-slate-700 dark:text-slate-300">
                            {result.recommendations[language].map((rec, index) => <li key={index}>{rec}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm">
                    <p><strong>Disclaimer:</strong> {result.disclaimer}</p>
                </div>
                
                <button
                    onClick={handleReset}
                    className="w-full mt-4 bg-sky-600 text-white font-bold py-3 px-6 rounded-xl text-lg hover:bg-sky-700 transition-colors shadow-lg"
                >
                    Start Over
                </button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto animate-slide-in">
            <div className="bg-[hsl(var(--card))] p-8 rounded-2xl shadow-xl text-center">
                <HeartPulse className="h-12 w-12 mx-auto text-sky-500 mb-4" />
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">AI Symptom Checker</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">
                    Select your symptoms for a preliminary analysis. This tool does not provide medical advice.
                </p>

                <div className="text-left">
                    <h3 className="font-bold text-lg mb-4">Common Symptoms</h3>
                    <div className="flex flex-wrap gap-3">
                        {commonSymptoms.map(symptom => (
                            <button
                                key={symptom}
                                onClick={() => handleSymptomToggle(symptom)}
                                className={`px-4 py-2 rounded-full font-medium transition-all duration-200 border-2 ${
                                    selectedSymptoms.includes(symptom)
                                        ? 'bg-sky-500 text-white border-sky-500'
                                        : 'bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-sky-100 dark:hover:bg-sky-900/50'
                                }`}
                            >
                                {symptom}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="text-left mt-8">
                    <h3 className="font-bold text-lg mb-2">Other Symptoms</h3>
                     <div className="relative">
                        <textarea
                            value={otherSymptom}
                            onChange={(e) => setOtherSymptom(e.target.value)}
                            placeholder="e.g., skin rash, dizziness, etc."
                            className="w-full p-3 pr-12 bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                            rows={3}
                        />
                        <VoiceInputButton 
                            onTranscriptUpdate={(t) => setOtherSymptom(p => `${p}${t}`)}
                            className="absolute right-2 top-2"
                        />
                     </div>
                </div>
                
                {error && <p className="text-red-500 mt-4">{error}</p>}
                
                <button
                    onClick={handleAnalyze}
                    disabled={selectedSymptoms.length === 0 && !otherSymptom.trim()}
                    className="w-full max-w-xs mt-8 bg-sky-600 text-white font-bold py-4 px-6 rounded-xl text-lg hover:bg-sky-700 transition-transform transform hover:scale-105 shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed disabled:scale-100"
                >
                    Analyze Symptoms
                </button>
            </div>
        </div>
    );
};

export default SymptomChecker;