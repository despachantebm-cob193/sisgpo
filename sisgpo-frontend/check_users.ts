
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fskhcmlrionkesvmgihi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza2hjbWxyaW9ua2Vzdm1naWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjIyNTMsImV4cCI6MjA3OTMzODI1M30.o6pRe3C8iaCfjtJxR9Zrqww5EzCosaLJAuZzmvSjmjI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Fetching users...");
    const { data, error } = await supabase.from('usuarios').select('id, nome, email, login, perfil, supabase_id');

    if (error) {
        console.error("Error:", error);
    } else {
        console.table(data);
    }
}

check();
