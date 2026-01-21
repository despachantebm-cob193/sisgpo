-- Tabela de métricas de Web Vitals coletadas no frontend
CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,          -- LCP, CLS, INP, TTFB, FID
  value DOUBLE PRECISION NOT NULL,
  delta DOUBLE PRECISION,
  id_visita TEXT,              -- identificador anônimo da sessão
  url TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de métricas de latência/erros do backend
CREATE TABLE IF NOT EXISTS api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method TEXT,
  route TEXT,
  status INT,
  duration_ms INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
