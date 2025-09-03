import React from 'react';
import type { PrakrutiAnalysis } from '../../types';

interface DoshaHistoryChartProps {
    analyses: PrakrutiAnalysis[];
}

const DoshaHistoryChart: React.FC<DoshaHistoryChartProps> = ({ analyses }) => {
    // Filter out analyses that don't have scores (e.g., from certificate uploads)
    const scoredAnalyses = analyses.filter(a => 
        a.vata_score != null && a.pitta_score != null && a.kapha_score != null
    );

    if (scoredAnalyses.length === 0) {
        return null; // Don't render the chart if there's no data
    }
    
    const maxScore = Math.max(...scoredAnalyses.flatMap(a => [a.vata_score!, a.pitta_score!, a.kapha_score!]), 1);

    return (
        <div className="w-full h-80 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
            <div className="flex h-full" aria-label="Dosha scores over time chart">
                {/* Y-Axis Labels */}
                <div className="flex flex-col justify-between text-xs text-slate-400 h-full pr-2">
                    <span>{maxScore}</span>
                    <span>{Math.round(maxScore / 2)}</span>
                    <span>0</span>
                </div>
                
                {/* Chart Area */}
                <div className="flex-1 grid grid-cols-12 h-full border-l border-b border-slate-200 dark:border-slate-700">
                    {/* Y-Axis Grid Lines */}
                    <div className="col-span-12 relative h-full">
                        <div className="absolute top-0 left-0 w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="absolute top-1/2 left-0 w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="absolute bottom-0 left-0 w-full h-px bg-slate-200 dark:bg-slate-700"></div>
                    </div>

                    {/* Bars */}
                    <div className="col-span-12 flex justify-around items-end h-full absolute inset-0 px-2">
                        {scoredAnalyses.map((analysis, index) => (
                            <div key={analysis.id} className="flex-1 flex justify-center items-end gap-1 h-full relative group pt-2">
                                <div 
                                    className="w-1/4 bg-sky-400 rounded-t-sm transition-all duration-300 hover:bg-sky-300"
                                    style={{ height: `${(analysis.vata_score! / maxScore) * 100}%` }}
                                    title={`Vata: ${analysis.vata_score}`}
                                />
                                <div 
                                    className="w-1/4 bg-red-400 rounded-t-sm transition-all duration-300 hover:bg-red-300"
                                    style={{ height: `${(analysis.pitta_score! / maxScore) * 100}%` }}
                                    title={`Pitta: ${analysis.pitta_score}`}
                                />
                                <div 
                                    className="w-1/4 bg-emerald-400 rounded-t-sm transition-all duration-300 hover:bg-emerald-300"
                                    style={{ height: `${(analysis.kapha_score! / maxScore) * 100}%` }}
                                    title={`Kapha: ${analysis.kapha_score}`}
                                />
                                <div className="absolute -bottom-6 text-center text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
             {/* Legend */}
            <div className="flex justify-center items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-sky-400"></span><span className="text-slate-600 dark:text-slate-300">Vata</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400"></span><span className="text-slate-600 dark:text-slate-300">Pitta</span></div>
                <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-400"></span><span className="text-slate-600 dark:text-slate-300">Kapha</span></div>
            </div>
        </div>
    );
};

export default DoshaHistoryChart;
