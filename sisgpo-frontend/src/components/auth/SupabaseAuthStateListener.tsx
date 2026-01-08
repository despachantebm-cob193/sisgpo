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

            if (event === 'SIGNED_IN' && session) {
                // Se temos sessão mas o token do store é diferente (ou nulo), vamos hidratar
                if (!token || token !== session.access_token) {
                    console.log('[SupabaseAuth] Hydrating user store from backend...');
                    try {
                        // Define token temporariamente para permitir chamada API
                        useAuthStore.setState({ token: session.access_token });

                        // Busca dados completos do usuário (perfil, permissoes) no nosso backend
                        const { data } = await api.get('/api/auth/me');

                        // Consolida login no store
                        login(session.access_token, data.user);
                        console.log('[SupabaseAuth] Store hydrated successfully.');
                    } catch (e: any) {
                        console.error('[SupabaseAuth] Failed to hydrate user', e);

                        // Check specifically for pending approval error
                        if (e.response && e.response.status === 403 && e.response.data?.message === 'USER_PENDING_APPROVAL') {
                            console.warn('[SupabaseAuth] account is pending approval.');
                            useAuthStore.getState().setPending(true);
                            navigate('/pending-approval', { replace: true });
                        } else {
                            // Se falhar recuperar o user do backend por outros motivos, faz logout
                            logout();
                            await supabase.auth.signOut();
                        }
                    } finally {
                        useAuthStore.getState().setLoadingProfile(false);
                    }
                }
            } else if (event === 'SIGNED_OUT') {
                if (token) {
                    console.log('[SupabaseAuth] Clearing store (Global SignOut)');
                    logout();
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [token, login, logout, navigate]);

    return null;
}
