-- Adiciona coluna para vincular usuários do sistema legado ao Supabase Auth
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS supabase_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL;

-- Index para performance na busca por ID do Supabase
CREATE INDEX IF NOT EXISTS idx_usuarios_supabase_id ON public.usuarios(supabase_id);

-- Comentário: 
-- Após rodar este script, o sistema backend começará a tentar vincular logins 
-- ao auth.users automaticamente via bootstrap ou login lazy.
