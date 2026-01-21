import { useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export const SupabaseAuthStateListener = () => {
    const { login, logout, token } = useAuthStore();
    const navigate = useNavigate();

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('[SupabaseAuth] Event:', event);

            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                // Se temos sessão mas o token do store é diferente (ou nulo), vamos hidratar
                if (!token || token !== session.access_token) {
                    console.log('[SupabaseAuth] Hydrating user store from Supabase DB...');
                    try {
                        // Store the token immediately
                        useAuthStore.setState({ token: session.access_token });

                        let dbUser = null;
                        const userEmail = session.user.email?.toLowerCase();

                        // 1. Try fetch by supabase_id (Best match)
                        if (session.user.id) {
                            const { data } = await supabase.from('usuarios').select('*').eq('supabase_id', session.user.id).single();
                            if (data) dbUser = data;
                        }

                        // 2. Try fetch by email (Legacy link)
                        if (!dbUser && userEmail) {
                            const { data } = await supabase.from('usuarios').select('*').eq('email', userEmail).single();
                            if (data) dbUser = data;
                        }

                        // 3. Try fetch by login (Legacy link via email user)
                        if (!dbUser && userEmail) {
                            const loginPart = userEmail.split('@')[0];
                            const { data } = await supabase.from('usuarios').select('*').eq('login', loginPart).single();
                            if (data) dbUser = data;
                        }

                        if (dbUser) {
                            // Success: Hydrate store with DB user
                            console.log('[SupabaseAuth] User profile loaded:', dbUser.login);
                            login(session.access_token, dbUser);

                            // Check active/pending status
                            if (dbUser.status === 'pending') {
                                console.warn('[SupabaseAuth] Account pending.');
                                useAuthStore.getState().setPending(true);
                                navigate('/pending-approval', { replace: true });
                            }
                        } else {
                            console.error('[SupabaseAuth] Usuário não encontrado no banco de dados. Encerrando sessão.');
                            logout();
                        }
                    } catch (e) {
                        console.error('[SupabaseAuth] Critical hydration error:', e);
                        // Prevent infinite loop by not unsetting token, but maybe redirecting?
                        // For now, logging.
                    } finally {
                        useAuthStore.getState().setLoadingProfile(false);
                    }
                } else {
                    // Session matches store, no action needed, just ensure loading is off
                    console.log('[SupabaseAuth] Session already synced. App ready.');
                    useAuthStore.getState().setLoadingProfile(false);
                }
            } else if (event === 'SIGNED_OUT') {
                if (token) {
                    console.log('[SupabaseAuth] Clearing store (Global SignOut)');
                    logout();
                }
                useAuthStore.getState().setLoadingProfile(false);
            } else if (event === 'INITIAL_SESSION' && !session) {
                console.log('[SupabaseAuth] No initial session found. App ready.');
                useAuthStore.getState().setLoadingProfile(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [token, login, logout, navigate]);

    return null;
}
