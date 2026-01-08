
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const SessionTimeoutHandler = () => {
    const { logout, isAuthenticated } = useAuthStore();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 20 minutes in milliseconds
    const TIMEOUT_MS = 20 * 60 * 1000;

    const handleLogout = useCallback(() => {
        if (isAuthenticated()) {
            logout();
            toast('Sessão expirada por inatividade.', {
                icon: '🔒',
                duration: 5000,
            });
        }
    }, [logout, isAuthenticated]);

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        if (isAuthenticated()) {
            timerRef.current = setTimeout(handleLogout, TIMEOUT_MS);
        }
    }, [isAuthenticated, handleLogout]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

        const handleActivity = () => {
            resetTimer();
        };

        // Initialize timer
        resetTimer();

        // Add listeners
        events.forEach((event) => {
            window.addEventListener(event, handleActivity);
        });

        return () => {
            // Cleanup
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer]);

    return null;
};
