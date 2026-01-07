import { createClient } from '@supabase/supabase-js';
import env from './env';

if (!env.SUPABASE || !env.SUPABASE.URL || !env.SUPABASE.SERVICE_ROLE_KEY) {
  throw new Error('Supabase URL and Service Role Key are required!');
}

// Cliente Admin com privilégios elevados (Service Role)
// USE COM CUIDADO! Ignora RLS.
export const supabaseAdmin = createClient(
  env.SUPABASE.URL,
  env.SUPABASE.SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabaseAdmin;
