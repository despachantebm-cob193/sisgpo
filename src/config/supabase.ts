import { createClient } from '@supabase/supabase-js';

// DevOps Crisis Check: Ensure environment variables are loaded
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  const errorMsg = `
    [CRITICAL] SUPABASE CREDENTIALS MISSING! 🚨
    SUPABASE_URL: ${supabaseUrl ? 'DEFINED' : 'MISSING'}
    SUPABASE_SERVICE_ROLE_KEY: ${supabaseKey ? 'DEFINED' : 'MISSING'}
    Check your .env file or deployment environment variables.
  `;
  console.error(errorMsg);
  throw new Error("CRITICAL: Supabase Creds Missing. Check .env file.");
}

console.log("✅ Supabase Config Loaded - Initializing Client...");

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export default supabaseAdmin;
