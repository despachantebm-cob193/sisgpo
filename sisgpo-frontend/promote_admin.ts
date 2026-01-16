
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://fskhcmlrionkesvmgihi.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZza2hjbWxyaW9ua2Vzdm1naWhpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NjIyNTMsImV4cCI6MjA3OTMzODI1M30.o6pRe3C8iaCfjtJxR9Zrqww5EzCosaLJAuZzmvSjmjI';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function promote() {
    console.log("Promovendo usuarios para admin...");
    // Update emails known to be from user
    const emailsToPromote = ['choa.cbmgo.2025@gmail.com', 'naina.gfg@gmail.com'];

    // Also ensure 'admin@sisgpo.com' is admin

    const { data, error } = await supabase
        .from('usuarios')
        .update({ perfil: 'admin' })
        .in('email', emailsToPromote)
        .select();

    if (error) {
        console.error("Erro:", error);
    } else {
        console.log("Usuarios atualizados:", data);
    }
}

promote();
