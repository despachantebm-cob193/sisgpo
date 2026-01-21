-- Trigger para criar perfil de usuário automaticamente após login via Google

-- 1. Função que será executada pelo trigger
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  -- Verifica se o usuário já existe na tabela public.usuarios (pelo email)
  -- Se já existir, apenas atualiza o google_id e supabase_id se estiverem nulos
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE email = NEW.email) THEN
    UPDATE public.usuarios 
    SET google_id = NEW.id::text,
        supabase_id = NEW.id,
        -- Atualiza nome se estiver vazio
        nome_completo = COALESCE(NULLIF(nome_completo, ''), NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', nome_completo)
    WHERE email = NEW.email;
    
    RETURN NEW;
  END IF;

  -- Se não existir, insere novo registro
  INSERT INTO public.usuarios (
    login,
    senha_hash,
    email,
    nome_completo,
    perfil,
    google_id,
    supabase_id,
    ativo,
    aprovado
  )
  VALUES (
    -- Usa o email como login
    NEW.email,
    -- Senha dummy
    '$2b$10$DUMMYPASSWORDHASHFORGOOGLEAUTH0000000000', 
    NEW.email,
    -- Obtém o nome dos metadados do Google
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Usuário Google'),
    'Usuario', -- Perfil padrão
    NEW.id::text,
    NEW.id, -- O ID da tabela auth.users é o UUID que usamos como supabase_id
    TRUE, -- Ativo por padrão
    FALSE -- Requer aprovação
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Criação do Trigger
-- Remove se já existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
