import React, { useState, useCallback } from 'react';
import { findNearbyPharmacies } from '../services/geminiService';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { MapPin, Search, Store } from 'lucide-react';

interface GeminiPharmacy {
    name: string;
    address: string;
    phone_number?: string;
}

const PharmacyCard: React.FC<{ pharmacy: GeminiPharmacy }> = ({ pharmacy }) => (
    <div className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-md flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-200 h-full border dark:border-slate-700">
        <div>
            <h3 className="font-bold text-md text-slate-800 dark:text-white">{pharmacy.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{pharmacy.address}</p>
        </div>
        {pharmacy.phone_number && (
             <p className="text-sm text-sky-600 dark:text-sky-400 mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 font-mono">
                {pharmacy.phone_number}
             </p>
        )}
    </div>
);

type SearchQuery = { lat: number; lng: number } | { address: string };

const Pharmacies: React.FC = () => {
    const [pharmacies, setPharmacies] = useState<GeminiPharmacy[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQueryText, setSearchQueryText] = useState('');
    const [hasSearched, setHasSearched] = useState(false);
    const [lastQuery, setLastQuery] = useState<SearchQuery | null>(null);

    const performSearch = useCallback(async (query: SearchQuery) => {
        setLastQuery(query);
        setLoading(true);
        setError(null);
        setPharmacies([]);
        setHasSearched(true);

        try {
            const results = await findNearbyPharmacies(query);
            setPharmacies(results);
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred while searching for pharmacies.');
        } finally {
            setLoading(false);
        }
    }, []);

    const handleManualSearch = (event: React.FormEvent) => {
        event.preventDefault();
        if (!searchQueryText.trim()) return;
        performSearch({ address: searchQueryText });
    };

    const handleLocationSearch = () => {
        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                performSearch({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
            },
            (err) => {
                setError("Could not get your location. Please use the manual search or enable location services in your browser settings.");
                setLoading(false);
            },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };
    
    const handleRetry = () => {
        if (lastQuery) {
            performSearch(lastQuery);
        } else {
            setError(null);
            setHasSearched(false);
        }
    };

    const renderResults = () => {
        if (loading) {
            return <LoadingState message="Finding pharmacies with AI..." />;
        }

        if (error) {
            return <ErrorState message={error} onRetry={handleRetry} />;
        }

        if (hasSearched && pharmacies.length === 0) {
            return (
                <div className="text-center p-10 text-slate-500 dark:text-slate-400 bg-[hsl(var(--card))] rounded-lg shadow-md">
                    <h3 className="text-xl font-bold">No Pharmacies Found</h3>
                    <p>The AI could not find any pharmacies for your location. Please try a different search term.</p>
                </div>
            );
        }
        
        if (pharmacies.length > 0) {
            return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pharmacies.map((pharmacy, index) => (
                        <PharmacyCard key={`${pharmacy.name}-${index}`} pharmacy={pharmacy} />
                    ))}
                </div>
            );
        }
        
        return (
            <div className="text-center p-10 text-slate-500 dark:text-slate-400 bg-[hsl(var(--card))] rounded-lg shadow-md">
                <Store className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-xl font-bold">Find Nearby Pharmacies</h3>
                <p>Use your current location or enter an address to find pharmacies near you using AI.</p>
            </div>
        );
    };

    return (
        <div className="animate-slide-in space-y-6">
            <div className="bg-[hsl(var(--card))] p-4 rounded-lg shadow-md">
                <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="relative flex-grow w-full">
                        <input
                            type="text"
                            value={searchQueryText}
                            onChange={(e) => setSearchQueryText(e.target.value)}
                            placeholder="Enter a location, e.g., 'Eiffel Tower, Paris'"
                            className="w-full p-3 pl-4 bg-slate-100 dark:bg-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                            disabled={loading}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !searchQueryText.trim()}
                        className="p-3 bg-sky-500 text-white rounded-lg disabled:bg-slate-400 hover:bg-sky-600 transition-colors flex-shrink-0 w-full sm:w-auto"
                        aria-label="Search location"
                    >
                        <Search className="h-6 w-6" />
                    </button>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-600 hidden sm:block mx-2"></div>
                    <button
                        type="button"
                        onClick={handleLocationSearch}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 p-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex-shrink-0 w-full sm:w-auto"
                    >
                        <MapPin className="h-6 w-6" />
                        <span className="font-medium">Use my location</span>
                    </button>
                </form>
            </div>
            
            <div className="mt-6">
                {renderResults()}
            </div>
        </div>
    );
};

export default Pharmacies;