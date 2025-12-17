2025-12-16 - Criados mapas iniciais de backend (`docs/mapa-backend.md`), frontend (`docs/mapa-frontend.md`), modelo de dados (`docs/modelo-dados.md`) e inventarios de arquivos (`docs/mapa-arquivos-backend.txt`, `docs/mapa-arquivos-frontend.txt`) para guiar manutencao limpa e gradual.
2025-12-16 - Detalhados endpoints por rota no backend e cruzamento pagina→API no frontend; registradas lacunas entre front e rotas (change-password, relatorio-diario, metadata admin).
2025-12-16 - Adicionadas rotas de compatibilidade no backend (change-password, alias relatorio-diario, alias metadata admin) e atualizado `docs/mapa-backend.md` com texto limpo/atualizado.
2025-12-16 - Documentados controllers (dashboard, viatura, militar, user, plantao) em `docs/mapa-backend.md` com principais queries/validacoes/relacoes.
2025-12-16 - Documentados controllers de escalas (aeronave, codec, medicos, legado) e servico do dia em `docs/mapa-backend.md`.
2025-12-16 - Atualizado `docs/modelo-dados.md` com complementos das migrações (usuarios, plantoes, servico_dia, aeronaves/codec/medicos, metadata/notificacoes).
2025-12-16 - Iniciada migração de controllers JS para TS: `servicoDiaController`, `escalaCodecController`, `escalaAeronaveController`.
2025-12-16 - Migrados validators para TS (aeronave, escalas, militar, obm, plantao, user, viatura, etc.) e controllers restantes para TS (`auth`, `dashboard`, `aeronave`, `relatorio`, `escala*`, `medico`, `obm*`, `militar*`, `viatura*`, `plantao`, `estatisticasExternas`); `tsc --noEmit` limpo.
