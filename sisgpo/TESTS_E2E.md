# Testes End-to-End – Integração SISGPO ↔ Sistema de Ocorrências

## 1. Preparação
- Serviços locais (ou staging) rodando:
  - `sisgpo` API (`npm run dev`) na porta 3333.
  - `sistema-ocorrencias` API (`npm run dev`) na porta 3001.
  - Frontends conforme necessário (Vite).
- Variáveis nos dois backends:
  ```bash
  SSO_SHARED_SECRET=local-secret
  OCORRENCIAS_API_URL=http://localhost:3001
  SISGPO_API_URL=http://localhost:3333
  ```
- Banco populado com usuário admin.

## 2. Cenários Principais

### 2.1 Login único + dashboard nativo
1. Acessar `http://localhost:5174/login`.
2. Autenticar com usuário válido.
3. Abrir menu “Ocorrencias”.
4. Verificar KPIs renderizados em cards React (sem iframe, sem redirecionamento para outro domínio).

### 2.2 Alias /api/external/dashboard
```bash
TOKEN=$(node -e "const { signSsoJwt } = require('./src/utils/signSsoJwt'); process.env.SSO_SHARED_SECRET='local-secret'; console.log(signSsoJwt());")
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/external/dashboard
```
Saída: JSON com `totalOcorrencias`, `totalOcorrenciasHoje`, `totalObitos`.

### 2.3 Rejeição de token inválido
```bash
curl http://localhost:3001/api/dashboard-ocorrencias
```
Resposta esperada: `401 {"message":"SSO token ausente ou mal formatado."}`

### 2.4 Erro de segredo incorreto
1. Alterar temporariamente `SSO_SHARED_SECRET` na API SISGPO (apenas teste).
2. Repetir o acesso via frontend; mensagem deve ser “Falha ao autenticar com o sistema de ocorrencias...” (HTTP 502). Restaurar segredo após o teste.

### 2.5 Menu do sistema de ocorrências
- Acessar `http://localhost:5173/dashboard`.
- Confirmar ausência do item “Dashboard Externo”; demais rotas continuam acessíveis.

## 3. Testes Automatizados

### 3.1 Vitest (frontend SISGPO)
```bash
cd sisgpo/sisgpo-frontend
npm install
npm run test
```
Saída esperada: `DashboardOcorrencias page (2 passed)`.

### 3.2 Curl scripts (proxy SISGPO)
```bash
cd sisgpo
SSO_SHARED_SECRET=local-secret OCORRENCIAS_API_URL=http://localhost:3001 node -e "
 const axios=require('axios');
 const {buildSsoAuthHeaders}=require('./src/utils/signSsoJwt');
 (async()=>{
   const res=await axios.get(process.env.OCORRENCIAS_API_URL+'/api/dashboard-ocorrencias',{headers:buildSsoAuthHeaders()});
   console.log(res.status, res.data);
 })();
"
```

## 4. Pós-deploy (produção)
- Repetir cenários 2.1–2.3 via URLs públicas.
- Monitorar logs por falhas 401/502.
- Validar que usuários existentes conseguem visualizar o dashboard sem refazer login.
