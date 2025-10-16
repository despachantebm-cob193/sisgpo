# Deploy Checklist – Integração SISGPO ↔ Sistema de Ocorrências

## 1. Pré-requisitos
- Ambas as bases (Neon) disponíveis e migradas.
- Variáveis de ambiente alinhadas (Render/Vercel):
  - `SSO_SHARED_SECRET` (mesmo valor em ambos backends).
  - `OCORRENCIAS_API_URL`
  - `SISGPO_API_URL`
  - `JWT_SECRET`, `DB_*` (SISGPO) / `DATABASE_URL` (ocorrências).
  - `VITE_API_BASE_URL` (fronts) e, se necessário, `VITE_OCORRENCIAS_API_URL`.
- Node 18+ e npm atualizados para builds locais.

## 2. Backends (Render)
1. SISGPO API
   - Atualizar ENV (`Settings → Environment`).
   - `npm install`, `npm run build` (se aplicável) ou redeploy automático.
   - Verificar logs de startup (`/api/health` → HTTP 200).
2. Sistema de Ocorrências API
   - Atualizar ENV com as mesmas chaves.
   - Redeploy e conferir `/api/health`.
   - Teste manual do SSO:
     ```bash
     # gerar token via script local (SISGPO)
     node -e "const { signSsoJwt } = require('./src/utils/signSsoJwt'); console.log(signSsoJwt());"
     # consumir rota protegida
     curl -H "Authorization: Bearer <TOKEN>" https://<sistema-ocorrencias-host>/api/dashboard-ocorrencias
     ```

## 3. Frontends (Vercel)
- SISGPO Front:
  - Atualizar `VITE_API_BASE_URL`, `VITE_OCORRENCIAS_API_URL` (se usado).
  - Rodar `npm run build` localmente; publicar.
- Sistema de Ocorrências Front:
  - Atualizar `VITE_API_BASE_URL`.
  - Confirmar que o menu não contém “Dashboard Externo”.

## 4. Smoke Tests Pós-deploy
1. Login no SISGPO (produção/staging) → `/app/dashboard`.
2. Abrir menu “Ocorrencias” → verificar KPIs carregados sem redirecionamento.
3. Simular erro: alterar temporariamente `SSO_SHARED_SECRET` em um dos serviços para garantir mensagem 502 amigável, depois restaurar.
4. Sistema de Ocorrências UI: menu lateral sem link redundante, dashboard interno funcional.
5. `curl` anônimo para `/api/dashboard-ocorrencias` deve retornar 401.

## 5. Rollback
- **Ambiente**: Reverter variáveis para valores anteriores (Render/Vercel) e redeploy.
- **Código**: Reverter commits correspondentes (`git revert` dos IDs introduzidos nesta entrega).
- **Alias legado**: `/api/external/dashboard` permanece disponível; se necessário, reativar o iframe front-end revertendo `EstatisticasExternas.tsx` e o item de menu.
- **Verificação**: Repetir smoke tests confirmando retorno ao comportamento anterior.

## 6. Monitoramento
- Monitorar logs de ambas as APIs (Render) por 15 minutos.
- Configurar alerta para falhas 401/502 em `/api/dashboard-ocorrencias`.
- Validar métricas front-end (Sentry/Analytics) se disponíveis.
