-- Configuração de Row Level Security (RLS)
-- Garante que o acesso seja negado por padrão, exceto para a Service Role Key

-- 1. Habilitar RLS em todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE obms ENABLE ROW LEVEL SECURITY;
ALTER TABLE militares ENABLE ROW LEVEL SECURITY;
ALTER TABLE viaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aeronaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE plantoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE viatura_plantao ENABLE ROW LEVEL SECURITY;
ALTER TABLE militar_plantao ENABLE ROW LEVEL SECURITY;
ALTER TABLE escala_aeronaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE servico_dia ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE metadata ENABLE ROW LEVEL SECURITY;

-- 2. Criar Policies para Service Role (Acesso Total)
-- O backend usa a service_role key, que por padrão ignora RLS,
-- mas é uma boa prática explicitar ou criar policies se formos usar Supabase Auth no futuro.
-- Entretanto, como 'service_role' (admin) bypassa RLS, essas politicas abaixo são para
-- garantir acesso caso usemos um client autenticado normais futuramente.

-- Exemplo de politica permissiva para leitura pública (Autenticada) - Opcional
-- Descomente se quiser que o frontend leia dados diretamente no futuro
/*
CREATE POLICY "Permitir leitura para autenticados" ON obms
FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir leitura para autenticados" ON viaturas
FOR SELECT USING (auth.role() = 'authenticated');
*/

-- Por enquanto, sem policies adicionais, significa que NINGUÉM via client público (anon)
-- consegue ler/escrever. Apenas o backend (service_role) consegue acesso total.
-- Isso é o desejado para a arquitetura "Backend Express" atual.
