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
                        console.error('[SupabaseAuth] Failed to hydrate user from backend', e);

                        // Check specifically for pending approval error
                        if (e.response && e.response.status === 403 && e.response.data?.message === 'USER_PENDING_APPROVAL') {
                            console.warn('[SupabaseAuth] account is pending approval.');
                            useAuthStore.getState().setPending(true);
                            navigate('/pending-approval', { replace: true });
                        } else {
                            // TENTATIVA DE RECUPERAÇÃO ROBUSTA
                            const cachedUser = useAuthStore.getState().user;

                            // 1. Tenta usar o cache se existir (Assume-se que pertence à sessão atual)
                            if (cachedUser) {
                                console.warn('[SupabaseAuth] Backend unreachable. Preserving cached user profile.');
                                login(session.access_token, cachedUser);
                            } else {
                                // 2. Se não tem cache, tenta buscar direto no banco (Supabase) bypassando a API
                                console.warn('[SupabaseAuth] Backend unreachable. Attempting direct DB fetch...');

                                let dbUser = null;

                                // Estratégia A: Busca por ID do Supabase (Mais preciso)
                                if (!dbUser && session.user.id) {
                                    const { data } = await supabase
                                        .from('usuarios')
                                        .select('*')
                                        .eq('supabase_id', session.user.id)
                                        .single();
                                    if (data) console.log('[SupabaseAuth] User found by supabase_id');
                                    dbUser = data;
                                }

                                // Estratégia B: Busca por Email (conferindo lowercase)
                                if (!dbUser && session.user.email) {
                                    const { data } = await supabase
                                        .from('usuarios')
                                        .select('*')
                                        .eq('email', session.user.email.toLowerCase())
                                        .single();
                                    if (data) console.log('[SupabaseAuth] User found by email');
                                    dbUser = data;
                                }

                                // Estratégia C: Busca por Login (Legacy)
                                if (!dbUser && session.user.email) {
                                    const username = session.user.email.split('@')[0].toLowerCase();
                                    const { data } = await supabase
                                        .from('usuarios')
                                        .select('*')
                                        .eq('login', username)
                                        .single();
                                    if (data) console.log('[SupabaseAuth] User found by login');
                                    dbUser = data;
                                }

                                if (dbUser) {
                                    console.log('[SupabaseAuth] Recovered user from direct DB query:', dbUser);
                                    // Adapta o objeto do banco para o formato UserRecord esperado
                                    const recoveredUser: any = {
                                        ...dbUser,
                                        email: session.user.email // Garante que o email da sessão esteja presente
                                    };
                                    login(session.access_token, recoveredUser);
                                } else {
                                    // 3. Último caso: Fallback genérico (provavelmente perderá admin)
                                    console.warn('[SupabaseAuth] Backend unreachable and User not found in DB. Falling back to session data.');

                                    const fallbackUser: any = {
                                        id: 0,
                                        login: session.user.email || 'user',
                                        nome: session.user.user_metadata?.full_name || session.user.email,
                                        email: session.user.email,
                                        perfil: session.user.user_metadata?.perfil || 'user',
                                        ativo: true,
                                        status: 'approved'
                                    };

                                    login(session.access_token, fallbackUser);
                                    console.log('[SupabaseAuth] Logged in with fallback session data.');
                                }
                            }
                        }
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
