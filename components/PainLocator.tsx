import React, { useState } from 'react';
import { analyzePainLocation } from '../services/geminiService';
import ErrorState from './ErrorState';
import { Button } from './ui/Button';
import FollowUpChat from './FollowUpChat';

type PainMode = 'primary' | 'referred';
type Language = 'english' | 'hindi';

interface BilingualText {
    english: string;
    hindi: string;
}

interface AnalysisResult {
    potentialConditions: {
        name: BilingualText;
        description: BilingualText;
        likelihood: string;
        specialist: BilingualText;
    }[];
    notes: BilingualText;
    disclaimer: string;
}

const HumanBody2D = ({ primaryParts, referredParts, onPartClick }: { primaryParts: string[], referredParts: string[], onPartClick: (part: string) => void }) => {
    const bodyPartData = [
        { name: 'Head', path: 'M 85,45 A 25,30 0,1,1 115,45 A 25,30 0,1,1 85,45 Z' },
        { name: 'Neck', path: 'M 95,75 L 105,75 L 105,90 L 95,90 Z' },
        { name: 'Chest', path: 'M 70,90 L 130,90 L 125,150 L 75,150 Z' },
        { name: 'Abdomen', path: 'M 75,150 L 125,150 L 120,210 L 80,210 Z' },
        { name: 'Hips/Pelvis', path: 'M 80,210 L 120,210 L 115,230 L 85,230 Z' },
        { name: 'Left Shoulder', path: 'M 70,90 A 15,15 0,0,0 50,105 L 60,110 Z' },
        { name: 'Right Shoulder', path: 'M 130,90 A 15,15 0,0,1 150,105 L 140,110 Z' },
        { name: 'Left Arm', path: 'M 50,105 L 60,110 L 65,190 L 45,185 Z' },
        { name: 'Right Arm', path: 'M 150,105 L 140,110 L 135,190 L 155,185 Z' },
        { name: 'Left Hand', path: 'M 45,185 L 65,190 L 60,210 L 40,205 Z' },
        { name: 'Right Hand', path: 'M 155,185 L 135,190 L 140,210 L 160,205 Z' },
        { name: 'Left Leg', path: 'M 85,230 L 100,230 L 95,380 L 75,375 Z' },
        { name: 'Right Leg', path: 'M 115,230 L 100,230 L 105,380 L 125,375 Z' },
        { name: 'Left Foot', path: 'M 75,375 L 95,380 L 90,400 L 70,395 Z' },
        { name: 'Right Foot', path: 'M 125,375 L 105,380 L 110,400 L 130,395 Z' },
    ];

    const getPartStyle = (partName: string) => {
        const isPrimary = primaryParts.includes(partName);
        const isReferred = referredParts.includes(partName);

        let styles = 'cursor-pointer transition-all duration-200 stroke-slate-500 dark:stroke-slate-400';
        if (isPrimary) {
            styles += ' fill-red-500/80 stroke-red-700 dark:stroke-red-500';
        } else if (isReferred) {
            styles += ' fill-yellow-400/80 stroke-yellow-600 dark:stroke-yellow-500';
        } else {
            styles += ' fill-slate-300 dark:fill-slate-600 hover:fill-sky-300 dark:hover:fill-sky-500';
        }
        return styles;
    };
    
    return (
        <svg viewBox="0 0 200 420" className="w-full h-full max-h-[70vh] object-contain">
            {bodyPartData.map(part => (
                <path
                    key={part.name}
                    d={part.path}
                    className={getPartStyle(part.name)}
                    strokeWidth="1"
                    onClick={() => onPartClick(part.name)}
                >
                    <title>{part.name}</title>
                </path>
            ))}
        </svg>
    );
};


const PainLocator: React.FC = () => {
    const [painMode, setPainMode] = useState<PainMode>('primary');
    const [primaryParts, setPrimaryParts] = useState<string[]>([]);
    const [referredParts, setReferredParts] = useState<string[]>([]);

    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [language, setLanguage] = useState<Language>('english');
    const [isChatting, setIsChatting] = useState(false);

    const handlePartClick = (part: string) => {
        const updater = (prev: string[]) => prev.includes(part) ? prev.filter(p => p !== part) : [...prev, part];
        if (painMode === 'primary') {
            setPrimaryParts(updater);
        } else {
            setReferredParts(updater);
        }
    };

    const handleReset = () => {
        setPrimaryParts([]);
        setReferredParts([]);
        setResult(null);
        setError(null);
        setIsLoading(false);
        setIsChatting(false);
    };

    const handleAnalyze = async () => {
        if (primaryParts.length === 0 && referredParts.length === 0) {
            setError("Please select at least one pain point.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const analysis = await analyzePainLocation(primaryParts, referredParts);
            setResult(analysis);
        } catch (err: any) {
            setError(err.message || "An error occurred during analysis. Please check your network and try again.");
        } finally {
            setIsLoading(false);
        }
    };
    
    if (result) {
        return (
            <>
            {isChatting && <FollowUpChat reportTitle="Pain Location Analysis" reportData={result} onClose={() => setIsChatting(false)} />}
            <div className="max-w-4xl mx-auto animate-fadeIn space-y-6">
                 <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Pain Analysis Report</h2>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm border-l-4 border-yellow-400">
                    <p><strong>Disclaimer:</strong> {result.disclaimer}</p>
                </div>
                
                 <div className="flex border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setLanguage('english')} className={`px-4 py-2 font-semibold ${language === 'english' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>English</button>
                    <button onClick={() => setLanguage('hindi')} className={`px-4 py-2 font-semibold ${language === 'hindi' ? 'text-sky-500 border-b-2 border-sky-500' : 'text-slate-500'}`}>Hindi</button>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4">Potential Conditions</h3>
                    <div className="space-y-4">
                        {result.potentialConditions.map((cond, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-lg text-sky-700 dark:text-sky-400">{cond.name[language]}</h4>
                                    <span className="text-xs font-semibold px-2 py-1 bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200 rounded-full">{cond.likelihood} Likelihood</span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm">{cond.description[language]}</p>
                                <p className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <strong>Suggested Specialist:</strong> {cond.specialist[language]}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-4">General Notes</h3>
                    <p className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow text-slate-600 dark:text-slate-300">{result.notes[language]}</p>
                </div>
                 
                <div className="flex flex-col sm:flex-row gap-4">
                    <Button onClick={handleReset} variant="outline" className="w-full">Start Over</Button>
                    <Button onClick={() => setIsChatting(true)} className="w-full">Chat with AI about this Report</Button>
                </div>
            </div>
            </>
        );
    }
    
    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] animate-fadeIn">
            <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-xl shadow-lg flex items-center justify-center">
                <HumanBody2D primaryParts={primaryParts} referredParts={referredParts} onPartClick={handlePartClick} />
            </div>
            <div className="w-full lg:w-80 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-lg flex flex-col">
                {error && !isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <ErrorState message={error} onRetry={() => { setError(null); handleAnalyze(); }} />
                    </div>
                ) : (
                <>
                    <h3 className="text-xl font-bold mb-4">Pain Locator Controls</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Select a pain type, then click on the diagram to mark the location.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        <button
                            onClick={() => setPainMode('primary')}
                            className={`py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${painMode === 'primary' ? 'bg-red-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`}
                        >
                            Primary Pain
                        </button>
                         <button
                            onClick={() => setPainMode('referred')}
                            className={`py-2 px-3 text-sm font-semibold rounded-lg transition-colors ${painMode === 'referred' ? 'bg-yellow-500 text-white shadow-md' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'}`}
                        >
                            Referred Pain
                        </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-2 text-sm p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md">
                       {primaryParts.length > 0 && <div><h4 className="font-semibold text-red-500">Primary Points:</h4><ul className="list-disc list-inside ml-4">{primaryParts.map((part, i) => <li key={i}>{part}</li>)}</ul></div>}
                       {referredParts.length > 0 && <div><h4 className="font-semibold text-yellow-500">Referred Points:</h4><ul className="list-disc list-inside ml-4">{referredParts.map((part, i) => <li key={i}>{part}</li>)}</ul></div>}
                       {primaryParts.length === 0 && referredParts.length === 0 && <p className="text-slate-400 text-center py-4">No points selected.</p>}
                    </div>
                                    
                    <div className="mt-auto pt-4 space-y-2">
                        <Button onClick={handleAnalyze} loading={isLoading} disabled={isLoading || (primaryParts.length === 0 && referredParts.length === 0)} className="w-full">
                            Analyze Pain
                        </Button>
                        <Button onClick={handleReset} variant="ghost" className="w-full">
                            Reset
                        </Button>
                    </div>
                </>
                )}
            </div>
        </div>
    );
};

export default PainLocator;