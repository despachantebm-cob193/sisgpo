-- Tabela para Comandantes de CRBM
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS comandantes_crbm (
    id SERIAL PRIMARY KEY,
    crbm VARCHAR(50) NOT NULL UNIQUE,  -- Ex: "1º CRBM", "2º CRBM"
    militar_id INTEGER REFERENCES militares(id),
    nome_comandante VARCHAR(255) NOT NULL,
    posto_graduacao VARCHAR(50),
    telefone VARCHAR(50),
    email VARCHAR(255),
    data_inicio DATE,  -- Quando assumiu o comando
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_comandantes_crbm_updated_at
    BEFORE UPDATE ON comandantes_crbm
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Inserir os 9 CRBMs vazios para facilitar o cadastro inicial
INSERT INTO comandantes_crbm (crbm, nome_comandante) VALUES
    ('1º CRBM', ''),
    ('2º CRBM', ''),
    ('3º CRBM', ''),
    ('4º CRBM', ''),
    ('5º CRBM', ''),
    ('6º CRBM', ''),
    ('7º CRBM', ''),
    ('8º CRBM', ''),
    ('9º CRBM', '')
ON CONFLICT (crbm) DO NOTHING;
