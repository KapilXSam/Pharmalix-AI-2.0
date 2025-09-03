import React, { useState } from 'react';
import { cn } from '../lib/utils';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    placeholder?: React.ReactNode;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, placeholder, ...props }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    
    const handleLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div className={cn("relative overflow-hidden bg-slate-200 dark:bg-slate-700", className)}>
            {!isLoaded && (
                <div className="absolute inset-0 animate-pulse">
                    {placeholder}
                </div>
            )}
            <img
                src={src}
                alt={alt}
                loading="lazy"
                onLoad={handleLoad}
                className={cn(
                    "transition-opacity duration-500 w-full h-full object-cover",
                    isLoaded ? "opacity-100" : "opacity-0"
                )}
                {...props}
            />
        </div>
    );
};

export default LazyImage;
