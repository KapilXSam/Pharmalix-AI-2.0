import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSessionTimeoutProps {
    onLogout: () => void;
    timeout?: number; // total timeout in ms
    warningTime?: number; // time before timeout to show warning in ms
    enabled?: boolean;
}

export const useSessionTimeout = ({
    onLogout,
    timeout = 15 * 60 * 1000, // 15 minutes
    warningTime = 1 * 60 * 1000, // 1 minute
    enabled = true,
}: UseSessionTimeoutProps) => {
    const [isWarningVisible, setIsWarningVisible] = useState(false);
    const warningTimerRef = useRef<number | null>(null);
    const logoutTimerRef = useRef<number | null>(null);

    const clearTimers = useCallback(() => {
        if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
        if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    }, []);

    const showWarning = useCallback(() => {
        setIsWarningVisible(true);
    }, []);

    const handleLogout = useCallback(() => {
        clearTimers();
        onLogout();
        setIsWarningVisible(false);
    }, [onLogout, clearTimers]);

    const resetTimer = useCallback(() => {
        clearTimers();
        warningTimerRef.current = window.setTimeout(showWarning, timeout - warningTime);
        logoutTimerRef.current = window.setTimeout(handleLogout, timeout);
    }, [clearTimers, showWarning, timeout, warningTime, handleLogout]);

    const handleStayLoggedIn = useCallback(() => {
        setIsWarningVisible(false);
        resetTimer();
    }, [resetTimer]);

    useEffect(() => {
        if (!enabled) {
            clearTimers();
            return;
        }

        const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
        const eventHandler = () => resetTimer();

        events.forEach(event => window.addEventListener(event, eventHandler, { passive: true }));
        resetTimer();

        return () => {
            clearTimers();
            events.forEach(event => window.removeEventListener(event, eventHandler));
        };
    }, [resetTimer, enabled, clearTimers]);

    return {
        isWarningVisible,
        handleStayLoggedIn,
    };
};
