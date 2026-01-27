-- SQL Script para ser executado no Supabase do SISGPO
-- Habilita o envio de Notificações em Tempo Real para o SCO

-- 1. Habilitar a extensão pg_net se não estiver habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Função genérica para notificar o SCO
CREATE OR REPLACE FUNCTION public.notify_sco_replication()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://siscob.onrender.com/api/sisgpo/replication/webhook';
  payload JSONB;
BEGIN
  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'action', TG_OP,
    'record', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE row_to_json(NEW)::jsonb END,
    'old_record', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE row_to_json(OLD)::jsonb END
  );

  -- Envia a requisição POST assíncrona
  PERFORM net.http_post(
    url := webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := payload
  );

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar os Triggers para as tabelas solicitadas

-- OBMs
DROP TRIGGER IF EXISTS trg_replication_obms ON obms;
CREATE TRIGGER trg_replication_obms
AFTER INSERT OR UPDATE OR DELETE ON obms
FOR EACH ROW EXECUTE FUNCTION notify_sco_replication();

-- Militares
DROP TRIGGER IF EXISTS trg_replication_militares ON militares;
CREATE TRIGGER trg_replication_militares
AFTER INSERT OR UPDATE OR DELETE ON militares
FOR EACH ROW EXECUTE FUNCTION notify_sco_replication();

-- Viaturas
DROP TRIGGER IF EXISTS trg_replication_viaturas ON viaturas;
CREATE TRIGGER trg_replication_viaturas
AFTER INSERT OR UPDATE OR DELETE ON viaturas
FOR EACH ROW EXECUTE FUNCTION notify_sco_replication();
