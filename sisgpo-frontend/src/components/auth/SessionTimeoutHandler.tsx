
import { useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export const SessionTimeoutHandler = () => {
    const logout = useAuthStore(state => state.logout);
    const isAuthenticated = useAuthStore(state => state.isAuthenticated);
    const token = useAuthStore(state => state.token);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 20 minutes in milliseconds
    const TIMEOUT_MS = 20 * 60 * 1000;

    const handleLogout = useCallback(() => {
        if (isAuthenticated()) {
            logout();
            toast('Sessão expirada por inatividade (20m).', {
                icon: '🔒',
                duration: 6000,
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
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
    }, [isAuthenticated, handleLogout, TIMEOUT_MS]);

    useEffect(() => {
        // Monitor standard user activities
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click'];

        const handleActivity = () => {
            resetTimer();
        };

        // Initialize timer if authenticated
        if (token) {
            resetTimer();

            // Add listeners
            events.forEach((event) => {
                window.addEventListener(event, handleActivity, { passive: true });
            });
        }

        return () => {
            // Cleanup
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            events.forEach((event) => {
                window.removeEventListener(event, handleActivity);
            });
        };
    }, [resetTimer, token]);

    // This component doesn't render anything
    return null;
};
