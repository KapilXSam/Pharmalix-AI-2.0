import React from 'react';
import { mockNewsData } from '../lib/newsData';
import NewspaperIcon from './icons/NewspaperIcon';

const NewsTicker: React.FC = () => {
    // Duplicate the news data to ensure a seamless loop for the marquee effect
    const loopedNewsData = [...mockNewsData, ...mockNewsData];

    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'Regulatory': return 'text-sky-400';
            case 'Clinical Trial': return 'text-emerald-400';
            case 'Financial': return 'text-amber-400';
            case 'Safety': return 'text-red-400';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="glass-card rounded-xl p-3 flex items-center ticker-wrap">
            <div className="flex-shrink-0 flex items-center gap-2 mr-4">
                <NewspaperIcon className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Live Feed</span>
            </div>
            <div className="ticker-content flex items-center">
                {loopedNewsData.map((item, index) => (
                    <div key={index} className="flex items-center mx-6">
                        <span className={`text-xs font-bold uppercase mr-2 ${getCategoryStyles(item.category)}`}>
                            [{item.source}]
                        </span>
                        <span className="text-sm text-slate-200">{item.headline}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewsTicker;
