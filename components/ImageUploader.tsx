import React, { useRef, useCallback } from 'react';

interface ImageUploaderProps {
    onFileSelect: (file: File) => void;
    onError: (message: string) => void;
    icon: React.ReactNode;
    title: string;
    description: string;
    accept?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, onError, icon, title, description, accept = "image/*" }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((files: FileList | null) => {
        const file = files?.[0];
        if (file) {
            const fileType = file.type;
            const fileName = file.name.toLowerCase();
            const acceptedTypes = accept.split(',').map(t => t.trim());
            
            const isValid = acceptedTypes.some(type => {
                if (type.startsWith('.')) { // extension check
                    return fileName.endsWith(type);
                }
                if (type.endsWith('/*')) { // wildcard mime type
                    return fileType.startsWith(type.slice(0, -1));
                }
                return fileType === type; // exact mime type
            });
            
            if (isValid) {
                onFileSelect(file);
            } else {
                onError(`Please select a valid file. Accepted formats: ${accept}`);
            }
        }
    }, [accept, onFileSelect, onError]);
    
    const handleDragOver = useCallback((e: React.DragEvent) => e.preventDefault(), []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        handleFileChange(e.dataTransfer.files);
    }, [handleFileChange]);

    return (
        <div className="max-w-4xl mx-auto">
            <div
                className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl text-center border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-sky-500 dark:hover:border-sky-500 transition-colors cursor-pointer"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => { if (e.key === 'Enter') fileInputRef.current?.click() }}
                aria-label={`Upload file for ${title}`}
            >
                {icon}
                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">{title}</h2>
                <p className="text-lg text-slate-500 dark:text-slate-400 mb-8">{description}</p>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileChange(e.target.files)}
                    accept={accept}
                    className="hidden"
                    aria-hidden="true"
                />
                <span className="inline-block font-bold text-white bg-sky-600 hover:bg-sky-700 py-2 px-6 rounded-lg" aria-hidden="true">
                    Click to Upload
                </span>
                <p className="text-sm text-slate-400 mt-4">or drag and drop a file here</p>
            </div>
        </div>
    );
};

export default ImageUploader;
