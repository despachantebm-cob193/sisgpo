-- SISGPO Supabase Schema
-- Consolidado de 45 migrations originais

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 1. Tabelas Principais -------------------------------------------------------

-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  login VARCHAR(50) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  perfil VARCHAR(20) NOT NULL DEFAULT 'Usuario', -- 'Administrador', 'Usuario'
  google_id TEXT,
  email VARCHAR(255),
  nome_completo VARCHAR(255),
  aprovado BOOLEAN DEFAULT FALSE,
  aprovado_por INT REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OBMs
CREATE TABLE IF NOT EXISTS obms (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  abreviatura VARCHAR(20) UNIQUE NOT NULL, -- Aumentado para 20 conforme migration
  cidade VARCHAR(50),
  telefone VARCHAR(20),
  crbm VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Militares
CREATE TABLE IF NOT EXISTS militares (
  id SERIAL PRIMARY KEY,
  matricula VARCHAR(20) UNIQUE NOT NULL,
  nome_completo VARCHAR(255) NOT NULL,
  nome_guerra VARCHAR(100),
  posto_graduacao VARCHAR(50),
  tipo VARCHAR(20) DEFAULT 'Militar', -- 'Militar', 'Civil' (embora Civis tenham tabela propria de medicos agora)
  ativo BOOLEAN DEFAULT TRUE,
  obm_nome VARCHAR(100),
  telefone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Viaturas
CREATE TABLE IF NOT EXISTS viaturas (
  id SERIAL PRIMARY KEY,
  prefixo VARCHAR(20) UNIQUE NOT NULL,
  tipo VARCHAR(50),
  ativa BOOLEAN DEFAULT TRUE,
  cidade VARCHAR(50),
  obm VARCHAR(100),
  telefone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aeronaves
CREATE TABLE IF NOT EXISTS aeronaves (
  id SERIAL PRIMARY KEY,
  prefixo VARCHAR(50) UNIQUE NOT NULL,
  tipo_asa VARCHAR(20) NOT NULL, -- 'fixa' ou 'rotativa'
  ativa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medicos
CREATE TABLE IF NOT EXISTS medicos (
  id SERIAL PRIMARY KEY,
  nome_completo VARCHAR(150) NOT NULL,
  funcao VARCHAR(100) NOT NULL,
  telefone VARCHAR(20),
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Operacional e Escalas ----------------------------------------------------

-- Plantoes
CREATE TABLE IF NOT EXISTS plantoes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) UNIQUE NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  periodo VARCHAR(50),
  responsavel VARCHAR(100),
  data_plantao DATE NOT NULL, -- Renomeado de data_inicio
  data_fim DATE NOT NULL,
  ativo BOOLEAN DEFAULT TRUE,
  observacoes TEXT,
  horario_inicio TIME,
  horario_fim TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Servico Dia
CREATE TABLE IF NOT EXISTS servico_dia (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  funcao VARCHAR(100) NOT NULL,
  militar_id INT REFERENCES militares(id) ON DELETE SET NULL,
  viatura_id INT REFERENCES viaturas(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  data_inicio DATE,
  data_fim DATE,
  UNIQUE(data, funcao) -- Restrição de unicidade
);

-- Notificacoes
CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  mensagem VARCHAR(255) NOT NULL,
  lida BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metadata (Configurações gerais)
CREATE TABLE IF NOT EXISTS metadata (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabelas de Relacionamento ------------------------------------------------

-- Viatura no Plantão
CREATE TABLE IF NOT EXISTS viatura_plantao (
  id SERIAL PRIMARY KEY,
  plantao_id INT NOT NULL REFERENCES plantoes(id) ON DELETE CASCADE,
  viatura_id INT NOT NULL REFERENCES viaturas(id) ON DELETE CASCADE,
  prefixo_viatura VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plantao_id, viatura_id)
);

-- Militar no Plantão
CREATE TABLE IF NOT EXISTS militar_plantao (
  id SERIAL PRIMARY KEY,
  plantao_id INT NOT NULL REFERENCES plantoes(id) ON DELETE CASCADE,
  militar_id INT NOT NULL REFERENCES militares(id) ON DELETE CASCADE,
  matricula_militar VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plantao_id, militar_id)
);

-- Escala de Aeronaves
CREATE TABLE IF NOT EXISTS escala_aeronaves (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  aeronave_id INT REFERENCES aeronaves(id) ON DELETE CASCADE,
  primeiro_piloto_id INT REFERENCES militares(id) ON DELETE SET NULL,
  segundo_piloto_id INT REFERENCES militares(id) ON DELETE SET NULL,
  status VARCHAR(30) DEFAULT 'Ativa',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, aeronave_id)
);

-- Escala CODEC (suporte fictício baseado no controller existente)
CREATE TABLE IF NOT EXISTS escala_codec (
  id SERIAL PRIMARY KEY,
  data DATE NOT NULL,
  turno VARCHAR(20),
  militar_id INT REFERENCES militares(id) ON DELETE SET NULL,
  funcao VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(data, turno, militar_id)
);

-- 4. Funções e Triggers -------------------------------------------------------

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para todas as tabelas com updated_at
CREATE TRIGGER update_usuarios_modtime BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_obms_modtime BEFORE UPDATE ON obms FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_militares_modtime BEFORE UPDATE ON militares FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_viaturas_modtime BEFORE UPDATE ON viaturas FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_aeronaves_modtime BEFORE UPDATE ON aeronaves FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_medicos_modtime BEFORE UPDATE ON medicos FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_plantoes_modtime BEFORE UPDATE ON plantoes FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_servico_dia_modtime BEFORE UPDATE ON servico_dia FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

