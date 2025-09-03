import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface SettingsContextType {
    isLiteMode: boolean;
    setIsLiteMode: (isLite: boolean) => void;
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isLiteMode, setIsLiteMode] = useState<boolean>(() => {
        try {
            const item = window.localStorage.getItem('liteMode');
            return item ? JSON.parse(item) : false;
        } catch (error) {
            console.error("Could not parse liteMode from localStorage", error);
            return false;
        }
    });

    const [theme, setThemeState] = useState<Theme>(() => 
        (localStorage.getItem('theme') as Theme) || 'system'
    );

    useEffect(() => {
        try {
            window.localStorage.setItem('liteMode', JSON.stringify(isLiteMode));
        } catch (error) {
            console.error("Could not set liteMode in localStorage", error);
        }
    }, [isLiteMode]);

    const setTheme = (theme: Theme) => {
        localStorage.setItem('theme', theme);
        setThemeState(theme);
    };
    
    useEffect(() => {
        const root = window.document.documentElement;
        
        const applyTheme = () => {
            const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            root.classList.toggle('dark', isDark);
            
            // Update meta theme-color for mobile browser UI
            const themeColor = getComputedStyle(root).getPropertyValue('--background').trim();
            document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `hsl(${themeColor})`);
        };
        
        applyTheme();
        
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', applyTheme);
        
        return () => mediaQuery.removeEventListener('change', applyTheme);
    }, [theme]);


    const value = { isLiteMode, setIsLiteMode, theme, setTheme };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};