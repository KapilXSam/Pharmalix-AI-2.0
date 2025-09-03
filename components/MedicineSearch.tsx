import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { checkDrugInteractions, searchMedicineGoogle } from '../services/geminiService';
import type { Medicine, AyushMedicine } from '../types';
import { Pill, Search, Loader2, AlertTriangle, Info, Globe } from 'lucide-react';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import AyushMedicineCard from './AyushMedicineCard';
import { VoiceInputButton } from './VoiceInputButton';

const MedicineCard: React.FC<{ medicine: Medicine }> = ({ medicine }) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 hover:shadow-sky-100 dark:hover:shadow-sky-900/50 transition-shadow duration-300">
        <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 pr-4">{medicine.name}</h3>
            {medicine.is_discontinued && (
                <span className="text-xs font-semibold px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full flex-shrink-0">
                    Discontinued
                </span>
            )}
        </div>
        {medicine.manufacturer_name && (
             <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">by {medicine.manufacturer_name}</p>
        )}
        
        {medicine.short_composition1 && (
            <div className="mb-4">
                 <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Composition</p>
                 <p className="text-sm text-slate-700 dark:text-slate-300">{medicine.short_composition1}</p>
            </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{medicine.pack_size_label || 'N/A'}</p>
             <p className="text-lg font-bold text-sky-600 dark:text-sky-400">
                {medicine.price ? `₹${medicine.price.toFixed(2)}` : 'Price not available'}
             </p>
        </div>
    </div>
);

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const renderLine = (line: string) => {
        const parts = line.split(/(\*\*.*?\*\*)/g).filter(Boolean);
        return (
            <>
                {parts.map((part, i) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i} className="font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                })}
            </>
        );
    };

    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    const lines = content.split('\n');

    const flushList = () => {
        if (currentList.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-1 my-2 pl-4">
                    {currentList.map((item, j) => <li key={j}>{renderLine(item)}</li>)}
                </ul>
            );
            currentList = [];
        }
    };

    lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={`h3-${elements.length}`} className="text-xl font-bold text-sky-700 dark:text-sky-300 mt-6 mb-2 border-b-2 border-sky-500/20 pb-2">{trimmedLine.substring(4)}</h3>);
        } else if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
            currentList.push(trimmedLine.substring(2));
        } else {
            flushList();
            if (trimmedLine) {
                 elements.push(<p key={`p-${elements.length}`}>{renderLine(trimmedLine)}</p>);
            }
        }
    });

    flushList();

    return <div className="space-y-3 text-slate-700 dark:text-slate-300">{elements}</div>;
};


type SearchType = 'conventional' | 'ayush' | 'google';

function isAyushMedicine(med: Medicine | AyushMedicine): med is AyushMedicine {
    return 'brand_name' in med;
}

interface Interaction {
    severity: 'Severe' | 'Moderate' | 'Mild' | 'None' | string;
    description: string;
}
interface InteractionResult {
    interactions: Interaction[];
    recommendation: string;
    disclaimer: string;
}

const MedicineSearch: React.FC = () => {
    // State for Database Search
    const [searchTerm, setSearchTerm] = useState('');
    const [searchType, setSearchType] = useState<SearchType>('google');
    const [results, setResults] = useState<(Medicine | AyushMedicine)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const isSearching = useRef(false);
    
    // State for Interaction Checker
    const [drugA, setDrugA] = useState('');
    const [drugB, setDrugB] = useState('');
    const [interactionResult, setInteractionResult] = useState<InteractionResult | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [interactionError, setInteractionError] = useState<string | null>(null);

    // State for Google Search
    const [googleResult, setGoogleResult] = useState<{ text: string; sources: any[] } | null>(null);

    const handleInteractionCheck = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!drugA.trim() || !drugB.trim()) return;

        setIsChecking(true);
        setInteractionError(null);
        setInteractionResult(null);
        try {
            const result = await checkDrugInteractions(drugA, drugB);
            setInteractionResult(result);
        } catch (err: any) {
            setInteractionError(err.message || 'An error occurred while checking for interactions.');
        } finally {
            setIsChecking(false);
        }
    };
    
    const getSeverityStyles = (severity: Interaction['severity']) => {
        switch (severity.toLowerCase()) {
            case 'severe': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-500';
            case 'moderate': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-500';
            case 'mild': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 border-yellow-500';
            default: return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-500';
        }
    }

    const handleSearch = useCallback(async () => {
        if (isSearching.current || !searchTerm.trim()) return;
        
        isSearching.current = true;
        setIsLoading(true);
        setError(null);
        setHasSearched(true);
        setGoogleResult(null);
        setResults([]);

        try {
            if (searchType === 'google') {
                const result = await searchMedicineGoogle(searchTerm);
                setGoogleResult(result);
            } else if (searchType === 'conventional') {
                const { data, error: fetchError } = await supabase.from('medicines').select('*').or(`name.ilike.%${searchTerm}%,short_composition1.ilike.%${searchTerm}%`).limit(50);
                if (fetchError) throw fetchError;
                setResults(data as unknown as Medicine[] || []);
            } else {
                const { data, error: fetchError } = await supabase.from('ayush_medicines').select('*').or(`brand_name.ilike.%${searchTerm}%,generic_name_and_strength.ilike.%${searchTerm}%`).limit(50);
                if (fetchError) throw fetchError;
                setResults(data as unknown as AyushMedicine[] || []);
            }
        } catch (err: any) {
            setError(`Failed to fetch medicines. ${err.message || 'An unexpected error occurred.'}`);
        } finally {
            setIsLoading(false);
            isSearching.current = false;
        }
    }, [searchTerm, searchType]);

    const submitSearch = (e: React.FormEvent) => { e.preventDefault(); handleSearch(); };
    
    const handleTabChange = (newType: SearchType) => { 
        setSearchType(newType); 
        setResults([]); 
        setGoogleResult(null);
        setHasSearched(false); 
        setError(null); 
        setSearchTerm(''); 
    };

    const renderResults = () => {
        if (isLoading) return <LoadingState message="Searching..." />;
        if (error) return <div className="p-8 bg-white dark:bg-slate-800 rounded-xl"><ErrorState message={error} onRetry={handleSearch} /></div>;
        if (!hasSearched) {
            return (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl">
                    <h3 className="text-xl font-bold">Start Your Search</h3>
                    <p className="text-slate-500 dark:text-slate-400">
                        {searchType === 'google' ? 'Use Google Search to find comprehensive information on medicines.' : 'Enter a medicine name above to see results from our database.'}
                    </p>
                </div>
            );
        }

        if (searchType === 'google') {
            if (googleResult && googleResult.text) {
                 return (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl animate-fadeIn space-y-6">
                        <MarkdownRenderer content={googleResult.text} />
                        {googleResult.sources && googleResult.sources.length > 0 && (
                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                <h4 className="font-bold mb-2 text-slate-800 dark:text-white">Sources:</h4>
                                <ul className="list-decimal list-inside space-y-1 text-sm">
                                    {googleResult.sources.map((source, index) => (
                                        <li key={index}>
                                            <a href={source.web?.uri} target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline break-all">
                                                {source.web?.title || source.web?.uri}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                 );
            }
        } else {
            if (results.length > 0) {
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {results.map((med) => (isAyushMedicine(med) ? <AyushMedicineCard key={med.id} medicine={med} /> : <MedicineCard key={med.id} medicine={med} />))}
                    </div>
                );
            }
        }
        
        return (
            <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-xl">
                <h3 className="text-xl font-bold">No Results Found</h3>
                <p className="text-slate-500 dark:text-slate-400">Please try different keywords.</p>
            </div>
        );
    };

    return (
        <div className="max-w-5xl mx-auto animate-fadeIn space-y-8">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl">
                <div className="flex items-center mb-4">
                    <Pill className="h-8 w-8 text-sky-500 mr-3" />
                    <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Medicine Tools</h2>
                </div>
                
                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><AlertTriangle className="text-orange-500"/> AI Drug Interaction Checker</h3>
                    <form onSubmit={handleInteractionCheck} className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="relative"><input type="text" value={drugA} onChange={e => setDrugA(e.target.value)} placeholder="Enter first drug name..." className="w-full p-3 pr-12 bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" /><VoiceInputButton onTranscriptUpdate={(t) => setDrugA(p => `${p}${t}`)} className="absolute right-2 top-1/2 -translate-y-1/2"/></div>
                        <div className="relative"><input type="text" value={drugB} onChange={e => setDrugB(e.target.value)} placeholder="Enter second drug name..." className="w-full p-3 pr-12 bg-white dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" /><VoiceInputButton onTranscriptUpdate={(t) => setDrugB(p => `${p}${t}`)} className="absolute right-2 top-1/2 -translate-y-1/2"/></div>
                        <button type="submit" disabled={isChecking || !drugA.trim() || !drugB.trim()} className="sm:col-span-2 w-full p-3 bg-orange-500 text-white font-bold rounded-xl disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                             {isChecking ? <><Loader2 className="h-5 w-5 animate-spin" /> Checking...</> : 'Check Interactions'}
                        </button>
                    </form>
                    
                    <div className="mt-6">
                        {isChecking && <LoadingState message="Checking for interactions..." />}
                        {interactionError && <ErrorState message={interactionError} onRetry={handleInteractionCheck} />}
                        {interactionResult && (
                            <div className="space-y-4 animate-fadeIn">
                                {interactionResult.interactions.map((interaction, index) => (
                                    <div key={index} className={`p-4 rounded-lg border-l-4 ${getSeverityStyles(interaction.severity)}`}>
                                        <h4 className="font-bold text-lg">{interaction.severity} Interaction</h4>
                                        <p className="mt-1">{interaction.description}</p>
                                    </div>
                                ))}
                                <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300">
                                    <h4 className="font-bold flex items-center gap-2"><Info className="h-4 w-4"/> Recommendation</h4>
                                    <p className="mt-1">{interactionResult.recommendation}</p>
                                </div>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 p-2"><strong>Disclaimer:</strong> {interactionResult.disclaimer}</p>
                            </div>
                        )}
                    </div>
                </div>

                <hr className="my-8 border-slate-200 dark:border-slate-700" />

                <div>
                    <h3 className="text-xl font-bold mb-4">Search the Database</h3>
                    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
                        {(['google', 'conventional', 'ayush'] as const).map(type => (
                            <button key={type} onClick={() => handleTabChange(type)} className={`px-4 py-3 font-semibold text-sm transition-colors capitalize flex items-center gap-2 ${searchType === type ? 'border-b-2 border-sky-500 text-sky-500' : 'text-slate-500 hover:text-sky-500'}`}>
                                {type === 'google' && <Globe className="h-4 w-4" />}
                                {type} {type !== 'google' && 'Database'}
                            </button>
                        ))}
                    </div>
                    <form onSubmit={submitSearch}>
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} 
                                    placeholder={
                                        searchType === 'conventional' ? "e.g., Paracetamol, Crocin..." : 
                                        searchType === 'ayush' ? "e.g., Dabur, Patanjali..." : 
                                        "e.g., Ozempic, Lipitor..."
                                    }
                                    className="w-full p-3 pr-12 bg-slate-100 dark:bg-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500" />
                                <VoiceInputButton onTranscriptUpdate={(t) => setSearchTerm(p => `${p}${t}`)} className="absolute right-2 top-1/2 -translate-y-1/2"/>
                            </div>
                            <button type="submit" disabled={isLoading} className="p-3 bg-sky-500 text-white rounded-xl disabled:bg-slate-400 disabled:cursor-not-allowed hover:bg-sky-600 transition-colors">
                                {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Search className="h-6 w-6" />}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div>
                {renderResults()}
            </div>
        </div>
    );
};

export default MedicineSearch;