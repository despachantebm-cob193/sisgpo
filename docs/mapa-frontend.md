# Mapa frontend (SISGPO)

## Entrada e infra
- Vite + React + TS. `src/main.tsx` carrega `router/index.tsx`.
- Cliente HTTP em `src/services/api.ts` (Axios com base `VITE_API_BASE_URL`, adiciona token do `authStore`, trata 401 com logout e toast). `src/services/db.ts` guarda dados locais.
- Estado global em `src/store/*` (auth, etc.). Layouts em `src/components/layout`.

## Rotas e paginas (`src/router/index.tsx`)
| Caminho | Layout/guard | Pagina | Observacao |
| --- | --- | --- | --- |
| `/` | `PublicLayout` (bloqueia se autenticado) | `Dashboard` | Dashboard publico |
| `/dashboard-ocorrencias` | publico (redirect se autenticado para `/app/dashboard-ocorrencias`) | `DashboardOcorrencias` | Dash de integracao externa |
| `/login` | publico | `Login` | Autenticacao |
| `/sso/login` | publico | `SsoLogin` | Fluxo SSO externo |
| `/app` | `PrivateRoute` (requer token) + `AppLayout` | redirect para `/app/dashboard` | Shell autenticado |
| `/app/dashboard` | privado | `Dashboard` | KPIs internos |
| `/app/dashboard-ocorrencias` | privado | `DashboardOcorrencias` | |
| `/app/obms` | privado | `Obms` | Administracao |
| `/app/viaturas` | privado | `Viaturas` | Administracao |
| `/app/aeronaves` | privado | `Aeronaves` | Administracao |
| `/app/militares` | privado | `Militares` | Administracao |
| `/app/medicos` | privado | `Medicos` | Administracao |
| `/app/plantoes` | privado | `Plantoes` | Administracao |
| `/app/servico-dia` | privado | `ServicoDia` | Administracao |
| `/app/usuarios` | `AdminRoute` (user.perfil === 'admin') | `Users` | Gestao de usuarios |
| `/app/relatorio` | privado | `Relatorio` | Relatorios |
| `/app/perfil` | privado | `Profile` | Perfil/logado |
| `*` | - | `NotFound` | 404 |

## Paginas → APIs que toca
- Dashboard: `/api/admin/viaturas?ativa=true`, `/api/admin/plantoes`, `/api/dashboard|/api/public` (`/stats`, `/viatura-stats-por-tipo`, `/militar-stats`, `/viatura-stats-detalhado`, `/viatura-stats-por-obm`, `/servico-dia`, `/escala-aeronaves`, `/escala-codec`, `/militares-escalados-count`), `/api/dashboard/obms`, `/api/dashboard/metadata/viaturas_last_upload`.
- DashboardOcorrencias: `GET /api/dashboard-ocorrencias` (protegida pelo auth do sisgpo).
- Login: `POST /api/auth/login`, `POST /api/auth/google/callback`.
- SsoLogin: `POST /api/auth/sso-login`.
- Obms: `GET/POST/PUT/DELETE /api/admin/obms`, `DELETE /api/admin/obms` (clear-all), `GET /api/admin/viaturas/distinct-obms`, `POST /api/admin/obms/upload-csv`, `GET /api/admin/metadata/viaturas_last_upload` (rota a confirmar).
- Viaturas: `GET /api/admin/viaturas`, `GET /api/admin/viaturas/duplicates/count`, `GET /api/admin/plantoes`, `GET /api/admin/metadata/viaturas_last_upload`, `POST /api/admin/viaturas`, `PUT /api/admin/viaturas/:id`, `DELETE /api/admin/viaturas/:id`, `POST /api/admin/viaturas/upload-validate`, `POST /api/admin/viaturas/upload-csv`, `GET /api/admin/viaturas/clear-all/preview`, `DELETE /api/admin/viaturas/clear-all?confirm=1`.
- Militares: `GET /api/admin/militares`, `GET /api/admin/obms`, `POST /api/admin/militares/upload-csv`, `POST/PUT/DELETE /api/admin/militares`, toggle e busca; carrega plantoes para ver escalados.
- Aeronaves: usa hook `useCrud` em `/api/admin/aeronaves` (listar/criar/editar/excluir).
- Medicos: `GET /api/admin/medicos`, `POST/PUT /api/admin/medicos`, `DELETE /api/admin/medicos/:id`.
- Plantoes: `GET /api/admin/plantoes` (+ `/api/admin/plantoes/:id`), `POST/PUT/DELETE /api/admin/plantoes`, `POST /api/admin/plantoes/:id/add-viatura`, `/remove-viatura/:viaturaId`, `add-militar`, `remove-militar`; lê listas auxiliares: `/api/admin/viaturas`, `/api/admin/escala-medicos`, `/api/admin/escala-aeronaves`, `/api/admin/escala-codec`; cria/apaga escalas via `/api/admin/escala-medicos|aeronaves|codec`.
- ServicoDia: `GET /api/admin/servico-dia?data=...`, `POST /api/admin/servico-dia`, `DELETE /api/admin/servico-dia`, buscas auxiliares `/api/admin/militares/search`, `/api/admin/civis/search`.
- Users: `GET /api/admin/users`, `POST /api/admin/users/:id/toggle-active`, `POST /approve`, `POST /reject`, `DELETE /api/admin/users/:id`.
- Profile: `PUT /api/admin/user/change-password` (rota nao encontrada nas rotas atuais, precisa ser confirmada/criada).
- Relatorio: `GET /api/admin/relatorio-diario?data=...` (rota atual no backend é `/api/admin/relatorio/diario`; alinhar).

## Proximo passo (pagina a pagina)
- `src/pages/Dashboard*.tsx`: identificar widgets/graficos e endpoints consumidos (ver `services/api.ts` calls ou hooks). Cruza com rotas `/api/public` e `/api/dashboard`.
- Páginas de admin (`Obms`, `Viaturas`, `Aeronaves`, `Militares`, `Medicos`, `Plantoes`, `ServicoDia`, `Users`): mapear formularios, uploads e botoes → endpoints `/api/admin/*` correspondentes.
- `DashboardOcorrencias`: confirmar se usa `/api/public/estatisticas-externas` ou `/api/dashboard-ocorrencias`.
- `Login`/`SsoLogin`: fluxo de auth e persistencia no `authStore`.
- `Relatorio`, `Profile`: listar chamadas e efeitos colaterais.
- Para cada pagina, anotar embaixo do titulo no proprio `docs/mapa-frontend.md` os botoes principais e APIs tocadas; manter cruzao com `docs/mapa-backend.md`.

## Como mapear paginas e acoes (proximo passo)
- Em cada `src/pages/<Pagina>.tsx`, listar botoes/acoes e a chamada de API correspondente (procure por `api.<metodo>` ou `useQuery`/`useMutation`).
- Ver quais componentes reutilizaveis estao em `src/components/*` e onde sao usados (ex.: tabelas, formularios).
- Cruzar cada rota com o endpoint backend em `docs/mapa-backend.md` para saber impacto de manutencao.
- Registrar notas curtas em cada pagina (ex.: "Upload CSV -> POST /api/admin/viaturas/upload-csv") conforme voce for lendo.
