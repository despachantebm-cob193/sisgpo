# Modelo de dados (rascunho)

> Fonte rapida: migracao base `20250903155021_01_create_final_schema.js` e complementos em `src/database/migrations/*`. Confirmar colunas extras nas migracoes posteriores ao detalhar.

## Tabelas centrais
- `usuarios`: id, login (unique, case-insensitive), senha_hash, perfil, email, status (pending/approved/rejected), ativo, timestamps; migracoes posteriores adicionam perfil_desejado, aprovador, etc.
- `obms`: id, nome (unique), abreviatura (unique, uppercase/trim), cidade, telefone, crbm, timestamps.
- `militares`: id, matricula (unique), nome_completo, nome_guerra, posto_graduacao, obm_nome, telefone, tipo (militar/civil), ativo, timestamps.
- `viaturas`: id, prefixo (unique), tipo, cidade, obm, telefone, ativa, timestamps; indices para desempenho e combinacoes unicas (prefixo, etc.).
- `plantoes`: id, nome (unique), tipo, periodo, responsavel, data_inicio, data_fim, horarios extras, observacoes, ativo, timestamps.
- `viatura_plantao`: relacao plantao_id ↔ viatura_id, prefixo_viatura, unique(plantao_id, viatura_id).
- `militar_plantao`: relacao plantao_id ↔ militar_id, matricula_militar, unique(plantao_id, militar_id).
- `servico_dia`: registros de servico diario (polimorfico para militar ou viatura), datas/turnos, viatura_id opcional.
- `medicos` (e legado `civis`): dados de profissionais civis/medicos, com disponibilidade/horarios; `medico_id` referenciado em `civis`.
- `aeronaves`: prefixo, modelo, situacao, obm/base, ativa; restricoes unicas em prefixo.
- `escala_aeronaves`: agenda de aeronaves (data_inicio/data_fim, responsavel, equipe).
- `escala_codec`: escala para CODEC (turnos/data, obm, equipe), unica por data+turno.
- `escala_medicos`: escala de medicos/civis para periodos e bases.
- `metadata`: chave/valor de configuracao variavel (migracao inicial e repetida).
- `notificacoes`: mensagens por usuario (titulo, corpo, lidas, timestamps).
- Outros legados: `contatos_telefonicos` foi dropado e recriado em uma migracao; verificar se ainda usado.

## Complementos relevantes das migrações
- `usuarios`: colunas extras `google_id` (unique), `status` (default pending), `perfil_desejado`, `aprovado_por` (FK usuarios), `aprovado_em`, `ativo` (boolean default true); migração normaliza `login` unique e `perfil` lower-case.
- `plantoes`: colunas `viatura_id` (FK viaturas), `obm_id` (FK obms), rename `data_inicio` -> `data_plantao` em ambientes antigos, campos `hora_inicio`/`hora_fim` opcionais; `data_inicio`/`data_fim` podem coexistir.
- `servico_dia`: migração converteu `data` para `data_inicio`/`data_fim` (timestamptz, not null) e index em `data_inicio`; controllers usam COALESCE para esquemas mistos.
- `aeronaves`/`escala_aeronaves`: `aeronaves` (id, prefixo unique, tipo_asa, ativa, timestamps); `escala_aeronaves` (data, aeronave_id FK, pilotos FKs, status, unique data+aeronave_id).
- `escala_codec`: data, turno enum (diurno/noturno), militar_id FK, ordem_plantonista, unique(data, turno, ordem_plantonista).
- `civis`/médicos: migração `refactor_civis_to_medicos` remove campos de escala (entrada/saida/status) e adiciona telefone; outras rotinas ainda inserem campos de escala dependendo do ambiente — esperar esquemas mistos.
- `metadata`: criada em duas migrações; usada para chaves como `viaturas_last_upload`.
- `notificacoes`: usuario_id, titulo, mensagem, lida, timestamps.

## Como aprofundar
- Ler cada migracao em ordem para capturar colunas adicionadas (ex.: `add_horarios_to_plantoes`, `add_unique_case_insensitive_obm_abreviatura`, `add_google_id_to_usuarios`).
- Gerar diagrama rapido: entidades (obms, viaturas, militares, usuarios, plantoes, escalas) e relacoes (viatura_plantao, militar_plantao, servico_dia, escalas).
- Validar o schema real no banco apontado pelo `.env` com `knex migrate:status` e `\d` no Postgres, registrando diferencas aqui.
