# Mapa backend (SISGPO)

## Entrada e bootstrap
- `src/server.ts`: roda migrações Knex (`db.migrate.latest()`), executa `bootstrapDatabase`, sobe servidor HTTP na porta `PORT` (padrão 3333).
- `src/app.ts`: aplica CORS com allowlist, `express.json()`, rota `/health`, raiz `/`, registra rotas, serve o build do frontend em `sisgpo-frontend/dist`, fallback `*` para `index.html`, usa `errorMiddleware`.
- Config DB em `src/config/database.js`; uploads em `src/config/upload.js`.

## Rotas registradas no app
| Prefixo montado | Arquivo de rota | Autenticação | Resumo |
| --- | --- | --- | --- |
| `/api/auth` | `src/routes/authRoutes.js` | pública | login, google callback, sso-login |
| `/api/dashboard` | `src/routes/dashboardRoutes.ts` | `authMiddleware` | estatísticas/dashboards protegidos |
| `/api/public` | `src/routes/publicRoutes.js` | pública | mesmas estatísticas expostas publicamente |
| `/api` | `src/routes/estatisticasExternasRoutes.js` | `authMiddleware` | `GET /dashboard-ocorrencias` para integração externa |
| `/api/admin` | `src/routes/adminRoutes.js` | `authMiddleware` + `ensureAdmin` em CRUD sensíveis | administração (OBMs, viaturas, militares, plantões, escalas, usuários, relatório, metadata) |

> Observação: `src/routes/externalRoutes.js` aponta para `../middleware` (singular) e não está plugado no `app.ts` — tratar como legado até confirmar uso.

## Endpoints detalhados (referência rápida)

### Auth (`/api/auth`)
| Método | Caminho | Handler |
| --- | --- | --- |
| POST | /login | authController.login |
| POST | /google/callback | authController.googleLogin |
| POST | /sso-login | ssoAuthMiddleware → authController.ssoLogin |

### Dashboard protegido (`/api/dashboard`)
Todos exigem JWT (`authMiddleware` aplicado no app).
| Método | Caminho | Handler |
| --- | --- | --- |
| GET | /stats | dashboardController.getStats |
| GET | /viatura-stats-por-tipo | dashboardController.getViaturaStatsPorTipo |
| GET | /militar-stats | dashboardController.getMilitarStats |
| GET | /viatura-stats-detalhado | dashboardController.getViaturaStatsDetalhado |
| GET | /viatura-stats-por-obm | dashboardController.getViaturaStatsPorObm |
| GET | /servico-dia | dashboardController.getServicoDia |
| GET | /escala-aeronaves | dashboardController.getEscalaAeronaves |
| GET | /escala-codec | dashboardController.getEscalaCodec |
| GET | /militares-escalados-count | dashboardController.getMilitaresEscaladosCount |
| GET | /metadata/:key | dashboardController.getMetadataByKey |
| GET | /obms | obmController.getAll |

### Dashboard público (`/api/public`)
Sem auth; mesmos handlers via `safeHandler`.
| Método | Caminho | Handler |
| --- | --- | --- |
| GET | /dashboard/stats | dashboardController.getStats |
| GET | /dashboard/viatura-stats-por-tipo | dashboardController.getViaturaStatsPorTipo |
| GET | /dashboard/militar-stats | dashboardController.getMilitarStats |
| GET | /dashboard/viatura-stats-detalhado | dashboardController.getViaturaStatsDetalhado |
| GET | /dashboard/viatura-stats-por-obm | dashboardController.getViaturaStatsPorObm |
| GET | /dashboard/servico-dia | dashboardController.getServicoDia |
| GET | /dashboard/escala-aeronaves | dashboardController.getEscalaAeronaves |
| GET | /dashboard/escala-codec | dashboardController.getEscalaCodec |
| GET | /estatisticas-externas | estatisticasExternasController.getDashboardOcorrencias |

### Integração externa autenticada (`/api/dashboard-ocorrencias`)
| Método | Caminho | Handler |
| --- | --- | --- |
| GET | /dashboard-ocorrencias | authMiddleware → estatisticasExternasController.getDashboardOcorrencias |

### Admin (`/api/admin`)
Uploads (ensureAdmin):
- POST /militares/upload-csv → militarFileController.upload  
- POST /viaturas/upload-validate → viaturaFileController.validateUpload  
- POST /viaturas/upload-csv → viaturaFileController.upload  
- POST /obms/upload-csv → obmController.uploadCsv  

OBMs:
- GET /obms/all → getAllSimple  
- GET /obms → getAll  
- GET /obms/search → search  
- POST /obms → create (validate)  
- PUT /obms/:id → update (validate)  
- DELETE /obms/:id → delete  
- DELETE /obms → clearAll  

Viaturas:
- GET /viaturas/duplicates/count → countByObm  
- GET /viaturas/simple → getAllSimple  
- GET /viaturas → getAll  
- GET /viaturas/search → search  
- GET /viaturas/distinct-obms → getDistinctObms  
- POST /viaturas → create (validate)  
- PUT /viaturas/:id → update (validate)  
- DELETE /viaturas/clear-all → clearAll  
- GET /viaturas/clear-all/preview → previewClearAll  
- DELETE /viaturas/:id → delete  
- POST /viaturas/:id/toggle-active → toggleActive  

Militares:
- GET /militares → getAll  
- GET /militares/search → search  
- POST /militares → create (validate)  
- PUT /militares/:id → update (validate)  
- DELETE /militares/:id → delete  
- POST /militares/:id/toggle-active → toggleActive  

Médicos/Civis:
- GET /medicos → getAll  
- GET /medicos/search → search  
- POST /medicos → create  
- PUT /medicos/:id → update  
- DELETE /medicos/:id → delete  
- POST /medicos/:id/toggle-active → toggleActive  
- GET /civis/search → escalaMedicoController.searchCivis (legado)  

Aeronaves:
- GET /aeronaves → getAll  
- POST /aeronaves → create (validate)  
- PUT /aeronaves/:id → update (validate)  
- DELETE /aeronaves/:id → delete  

Usuários:
- GET /users → getAll  
- GET /users/pending → getPending  
- POST /users/:id/approve → approve  
- POST /users/:id/reject → reject  
- POST /users → create (validate)  
- PUT /users/:id → update (validate)  
- DELETE /users/:id → delete  
- POST /users/:id/toggle-active → toggleActive  
- PUT /user/change-password → changePassword (usuário autenticado)  

Plantões:
- GET /plantoes → getAll  
- GET /plantoes/:id → getById  
- POST /plantoes → create  
- PUT /plantoes/:id → update  
- DELETE /plantoes/:id → delete  
- POST /plantoes/:id/add-viatura → addViatura  
- DELETE /plantoes/:plantaoId/remove-viatura/:viaturaId → removeViatura  
- POST /plantoes/:id/add-militar → addMilitar  
- DELETE /plantoes/:plantaoId/remove-militar/:militarId → removeMilitar  
- GET /plantoes/total-militares → getTotalMilitaresPlantao  

Escalas:
- GET /escala-aeronaves → escalaAeronaveController.getAll  
- GET /escala-aeronaves/:id → getById  
- POST /escala-aeronaves → create (validate)  
- PUT /escala-aeronaves/:id → update (validate)  
- DELETE /escala-aeronaves/:id → delete  
- GET /escala-codec → escalaCodecController.getAll  
- GET /escala-codec/:id → getById  
- POST /escala-codec → create (validate)  
- PUT /escala-codec/:id → update (validate)  
- DELETE /escala-codec/:id → delete  
- GET /escala-medicos → escalaMedicoController.getAll  
- GET /escala-medicos/:id → getById  
- POST /escala-medicos → create (validate)  
- PUT /escala-medicos/:id → update (validate)  
- DELETE /escala-medicos/:id → delete  
- GET /escala → escalaController.getEscala (legado)  
- PUT /escala → escalaController.updateEscala (legado)  

Serviço do dia (legado):
- GET /servico-dia → servicoDiaController.getServicoDia  
- POST /servico-dia → servicoDiaController.updateServicoDia  
- DELETE /servico-dia → servicoDiaController.deleteServicoDia  

Relatório:
- GET /relatorio/diario → relatorioController.getRelatorioDiario  
- GET /relatorio-diario → relatorioController.getRelatorioDiario (alias)  

Metadata (alias admin):
- GET /metadata/:key → dashboardController.getMetadataByKey  

## Middlewares principais
- `authMiddleware.js`: valida JWT Bearer e popula `req.user`.
- `ensureAdmin.js`: exige `user.perfil === 'admin'`.
- `errorMiddleware.js`: tratador global.
- `validationMiddleware.js`: helper para `express-validation`.
- `ssoAuthMiddleware.ts`: valida SSO externo (usado em `/api/auth/sso-login`).

## Domínios, controllers e tabelas alvo (resumo)
- Autenticação: `controllers/authController.js` → tabela `usuarios` (login/senha_hash/perfil/status/ativo).
- Dashboard: `controllers/dashboardController.js` → consultas agregadas em `obms`, `viaturas`, `militares`, `servico_dia`, escalas.
- OBMs: `controllers/obmController.js` → tabela `obms` (nome, abreviatura, cidade, telefone, crbm).
- Viaturas: `controllers/viaturaController.js` e `viaturaFileController.js` → tabelas `viaturas`, `viatura_plantao`; upload/validação de CSV.
- Militares: `controllers/militarController.js` e `militarFileController.js` → tabelas `militares`, `militar_plantao`.
- Médicos/Civis: `controllers/medicoController.js` e `escalaMedicoController.js` → tabelas `medicos` (origem `civis`), `escala_medicos`.
- Aeronaves: `controllers/aeronaveController.js` e `escalaAeronaveController.js` → tabelas `aeronaves`, `escala_aeronaves`.
- CODEC: `controllers/escalaCodecController.js` → tabela `escala_codec`.
- Plantões: `controllers/plantaoController.js` → `plantoes`, `viatura_plantao`, `militar_plantao`.
- Serviço do dia: `controllers/servicoDiaController.js` → `servico_dia` (polimórfico).
- Usuários: `controllers/userController.js` → `usuarios`, envia notificações.
- Relatório: `controllers/relatorioController.js` → relatório diário a partir das tabelas acima.
- Estatísticas externas: `controllers/estatisticasExternasController.js` → integra ocorrências de outro sistema para dashboards.

## Notas rápidas por controller (detalhe)
- `dashboardController`:
  - `getStats`/`getViaturaStatsPorTipo`/`getViaturaStatsDetalhado`/`getViaturaStatsPorObm`: leem `viaturas` (filtros por prefixo e `ativa`), normalizam prefixo para agrupar tipos e OBMs (join com `obms`).
  - `getMilitarStats`: conta `militares` ativos agrupando por `posto_graduacao`.
  - `getServicoDia`: verifica existência de tabela/colunas (`data_inicio`/`data_fim`), pega o intervalo atual e retorna registros.
  - `getMilitaresEscaladosCount`: conta distintos em `plantoes_militares` ou `militar_plantao` (fallback), cruzando com `plantoes` e datas (usa COALESCE de `data_plantao`/`data_inicio`/`data_fim`).
  - `getEscalaAeronaves`/`getEscalaCodec`: hoje retornam array vazio (placeholder); ajustar se houver uso real.
  - `getMetadataByKey`: lê `metadata` por `key`.

- `viaturaController`:
  - `getAll`: paginação com filtros `q`, `obm`, `cidade`; join em `obms`, fallback para preencher `obm_id/abreviatura` via normalização de texto; retorna `pagination`.
  - `getAllSimple`: filtro por OBM (default `COA`), inclui aéreos opcionalmente, usa normalização/abreviaturas; retorna apenas `id`, `prefixo`.
  - `countByObm`: conta viaturas por OBM (opção de excluir um id).
  - `search`: busca por `q` em prefixo/obm/cidade; respeita flag `ativa`.
  - `create`/`update`: insere/atualiza `viaturas`, normaliza dados e valida duplicidade; atualiza `metadata` (`viaturas_last_upload`) ao criar? (ver `viaturaFileController` para uploads).
  - `delete`: remove por id.
  - `getDistinctObms`: lista OBMs distintas a partir das viaturas.
  - `previewClearAll`/`clearAll`: mostra tamanho das tabelas e permite limpeza total apenas com header `X-Confirm-Purge: VIATURAS`; em produção exige `ALLOW_VIATURA_PURGE=true`; também limpa `metadata` `viaturas_last_upload`.
  - `toggleActive`: alterna `ativa` de uma viatura.
  - `getAeronaves`: helper que lista aeronaves ativas (parece legado).

- `militarController`:
  - `getAll`: lista com paginação (default 50), filtros `q` (nome/guerra/matrícula/posto/obm), `posto_graduacao`, `obm_nome`, `ativo`; filtro `escalado=true` faz subquery em `plantoes_militares` ou `militar_plantao` (fallback) com datas futuras (usa COALESCE de datas).
  - `search`: autocomplete (mín. 2 chars) por nome/matrícula, apenas ativos; retorna lista para selects.
  - `getByMatricula`: busca militar ativo por matrícula.
  - `create`: insere militar validando matrícula única.
  - `update`: atualiza e valida conflito de matrícula.
  - `toggleActive`: alterna ativo/inativo.
  - `delete`: remove por id.

- `userController`:
  - `getAll`/`getPending`: lista usuários (sanitize).
  - `approve`/`reject`: alteram `status` (approve usa `perfil_desejado`→`perfil`, grava `aprovado_por`/`aprovado_em`).
  - `create`: valida login único, hash de senha, normaliza perfil/nomes/email; compatível com SQLite (sem returning).
  - `update`: valida login/email únicos, normaliza perfil/nome/email, opcionalmente troca senha (rehash).
  - `toggleActive`: alterna `ativo`.
  - `delete`: remove usuário.
  - `changePassword`: compara hash atual, rehash com bcrypt.

- `plantaoController` (pontos principais):
  - Usa helpers para resolver tabelas de vínculo (plantoes_militares vs militar_plantao) e datas (data_plantao/data_inicio/data_fim via COALESCE).
  - `create`: valida duplicidade (viatura+data), resolve OBM da viatura, gera nome, cria plantão e guarnição (tabela de vínculo varia), inclui horários se existir.
  - `getAll`: paginação/filtros por datas, obm, viatura, inclui guarnição e metadados de viatura; adapta aos nomes de colunas presentes.
  - `getById`: traz plantão, guarnição, viaturas ligadas.
  - `update`: atualiza plantão/guarnição com validações de conflito.
  - `delete`: remove plantão e vínculos.
  - `addViatura`/`removeViatura`: gerenciam relação viatura_plantao.
  - `addMilitar`/`removeMilitar`: gerenciam relação militar_plantao/plantoes_militares, respeitando coluna `funcao` se existir.
  - `getTotalMilitaresPlantao`: soma distintamente os militares em plantões futuros/usando datas resolvidas.

- `escalaAeronaveController`:
  - `getAll`/`getById`: join em `aeronaves` e pilotos (`militares`), suporta filtros `data_inicio`/`data_fim`.
  - `create`/`update`: resolve aeronave por id ou prefixo (cria se não existir), evita duplicidade por data+aeronave, aceita pilotos opcionais, retorna registro.
  - `delete`: remove por id.

- `escalaCodecController`:
  - `getAll`/`getById`: join com `militares`, ordena por data/turno/ordem; retorna grupos por turno.
  - `create`: zera registros na mesma data e insere listas diurno/noturno (dedup por militar_id/turno), ordenando por posição.
  - `update`: reescreve a data alvo removendo registros anteriores dessa data; `delete` remove por id.

- `escalaMedicoController` (escala de civis/médicos):
  - CRUD em `civis` com filtros por nome e intervalo de serviço (`entrada_servico`/`saida_servico`); paginação opcional.
  - `createEscala`/`updateCivil`: permitem criar/atualizar escalas com status/observações; `deleteEscala`/`deleteCivil` removem registros.
  - `searchCivis`: autocomplete ativo por nome (min 2 chars).

- `escalaController` (legado de civis):
  - CRUD básico em `civis` (nome, função, telefone, observações, ativo) e `searchCivis` para autocomplete; mantido para compatibilidade de rotas antigas.

- `servicoDiaController`:
  - `getServicoDia`/`getByDate`: procura janela ativa (data_inicio<=data<=data_fim), retorna funções do dia com nomes de `militares` ou `civis`.
  - `updateServicoDia`/`save`: remove registros da data_inicio informada e insere lista filtrando duplicados (chave pessoa_id+pessoa_type+funcao).
  - `deleteServicoDia`/`deleteByDate`: limpa registros da janela ativa que contém a data informada.

## Lacunas/itens para alinhar com o frontend
- Resolvido: adicionadas rotas de change-password, relatorio-diario e metadata sob `/api/admin`.
- `externalRoutes.js` não está montado no `app.ts` e referencia `../middleware` (singular); verificar se deve ser removido ou corrigido/montado.

## Como mapear em mais detalhe (próximo passo)
- Para cada controller, anotar: endpoints (método/caminho), consultas/tabelas, validações (validators em `src/validators/*`), middlewares usados.
- Checar serviços `src/services/*` (ex.: `aiAssistedValidationService.js`, `sheetsService.js`) e onde são consumidos.
- Revisar `src/database/migrations/*` para confirmar colunas/chaves; registrar em `docs/modelo-dados.md`.
- Atualizar este arquivo conforme novas descobertas ou refatorações (ex.: migrar rotas JS para TS, agrupar por módulo/domínio).
