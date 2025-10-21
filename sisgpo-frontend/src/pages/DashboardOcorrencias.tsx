import React, { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import "./DashboardOcorrencias.css";

interface NaturezaStat {
  nome: string;
  total: number;
}

interface DashboardStats {
  totalOcorrencias: number;
  totalObitos: number;
  ocorrenciasPorNatureza: NaturezaStat[];
  ocorrenciasPorCrbm: NaturezaStat[];
}

interface Destaque {
  id: number;
  numero_ocorrencia?: string | null;
  data_ocorrencia: string;
  horario_ocorrencia?: string | null;
  natureza_grupo?: string | null;
  natureza_nome?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cidade_nome?: string | null;
  viaturas?: string | null;
  veiculos_envolvidos?: string | null;
  dados_vitimas?: string | null;
  resumo_ocorrencia?: string | null;
}

interface PlantaoData {
  ocorrenciasDestaque: Destaque[];
  supervisorPlantao: {
    usuario_id: number | null;
    supervisor_nome: string | null;
  } | null;
}

interface RelatorioRow {
  grupo: string;
  subgrupo: string;
  diurno: number | string;
  noturno: number | string;
  total_capital: number | string;
  [key: string]: string | number;
}

interface ObitoRegistro {
  id: number;
  numero_ocorrencia?: string | null;
  quantidade_vitimas: number;
  obm_nome?: string | null;
  natureza_nome?: string | null;
}

interface RelatorioData {
  estatisticas: RelatorioRow[];
  obitos?: ObitoRegistro[];
}

interface EspelhoEntry {
  cidade_nome: string;
  crbm_nome: string;
  natureza_id?: number | null;
  natureza_nome: string;
  natureza_grupo?: string | null;
  natureza_abreviacao?: string | null;
  quantidade: number;
}

interface EspelhoBaseEntry {
  id: number;
  cidade_nome: string;
  crbm_nome: string;
}

interface DashboardResponse {
  data?: string;
  stats: DashboardStats;
  plantao: PlantaoData;
  relatorio: RelatorioData;
  espelho?: EspelhoEntry[];
  espelhoBase?: EspelhoBaseEntry[];
}

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

const normalizeKey = (value?: string | null) =>
  (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const OBITOS_ORDER = [
  "ACIDENTE DE TRÂNSITO",
  "ACIDENTES COM VIATURAS",
  "AFOGAMENTO OU CADÁVER",
  "ARMA DE FOGO/BRANCA/AGRESSÃO",
  "AUTO EXTERMÍNIO",
  "MAL SÚBITO",
  "OUTROS",
];

interface EspelhoColumn {
  codigo: string;
  grupo: string;
  subgrupo: string;
  abreviacao: string;
}

const ESPELHO_LAYOUT: Array<Omit<EspelhoColumn, "codigo">> = [
  { grupo: "Resgate", subgrupo: "Resgate - Salvamento em Emergências", abreviacao: "RESGATE" },
  { grupo: "Incêndio", subgrupo: "Vegetação", abreviacao: "INC. VEG" },
  { grupo: "Incêndio", subgrupo: "Edificações", abreviacao: "INC. EDIF" },
  { grupo: "Incêndio", subgrupo: "Outros", abreviacao: "INC. OUT." },
  { grupo: "Busca e Salvamento", subgrupo: "Cadáver", abreviacao: "B. CADÁV." },
  { grupo: "Busca e Salvamento", subgrupo: "Diversos", abreviacao: "B. SALV." },
  { grupo: "Ações Preventivas", subgrupo: "Palestras", abreviacao: "AP. PAL" },
  { grupo: "Ações Preventivas", subgrupo: "Eventos", abreviacao: "AP. EVE" },
  { grupo: "Ações Preventivas", subgrupo: "Folders/Panfletos", abreviacao: "AP. FOL" },
  { grupo: "Ações Preventivas", subgrupo: "Outros", abreviacao: "AP. OUT" },
  { grupo: "Atividades Técnicas", subgrupo: "Inspeções", abreviacao: "AT. INS" },
  { grupo: "Atividades Técnicas", subgrupo: "Análise de Projetos", abreviacao: "AN. PROJ" },
  { grupo: "Produtos Perigosos", subgrupo: "Vazamentos", abreviacao: "PPV" },
  { grupo: "Produtos Perigosos", subgrupo: "Outros / Diversos", abreviacao: "PPO" },
  { grupo: "Defesa Civil", subgrupo: "Preventiva", abreviacao: "DC PREV." },
  { grupo: "Defesa Civil", subgrupo: "De Resposta", abreviacao: "DC RESP." },
];

const createEmptyCounts = (columns: EspelhoColumn[]) =>
  columns.reduce<Record<string, number>>((acc, col) => {
    acc[col.codigo] = 0;
    return acc;
  }, {});

const formatDate = (isoDate?: string | null) => {
  if (!isoDate) return "--";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate || "--";
  return date.toLocaleDateString("pt-BR");
};

const formatTime = (value?: string | null) => {
  if (!value) return "--:--";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }
  const match = value.match(/(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : value;
};

const DashboardOcorrencias: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedCrbm, setSelectedCrbm] = useState<string>("todos");
  const [payload, setPayload] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<DashboardResponse>("/api/dashboard-ocorrencias", {
          params: { data: selectedDate },
        });
        if (!cancelled) {
          setPayload(response.data);
          if (response.data.data && response.data.data !== selectedDate) {
            setSelectedDate(response.data.data);
          }
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) {
          const errorMessage = err.response?.data?.message || err.message;
          setError(`Falha ao carregar dados do Sistema de Ocorrências: ${errorMessage}`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  const destaque = payload?.plantao?.ocorrenciasDestaque?.[0] || null;

  const obitosResumo = useMemo(() => {
    const base = new Map(
      OBITOS_ORDER.map((label) => [
        label,
        {
          label,
          quantidade: 0,
          registros: [] as ObitoRegistro[],
        },
      ])
    );

    const findKey = (value?: string | null) => {
      if (!value) return "OUTROS";
      const normalized = normalizeText(value);
      const found = OBITOS_ORDER.find((label) => normalizeText(label) === normalized);
      return found || "OUTROS";
    };

    (payload?.relatorio?.obitos || []).forEach((registro) => {
      const key = findKey(registro.natureza_nome);
      const bucket = base.get(key);
      if (!bucket) return;
      bucket.quantidade += registro.quantidade_vitimas || 0;
      bucket.registros.push(registro);
    });

    const rows = OBITOS_ORDER.map((label) => base.get(label) || { label, quantidade: 0, registros: [] });
    const total = rows.reduce((sum, row) => sum + row.quantidade, 0);

    return { rows, total };
  }, [payload?.relatorio?.obitos]);

  const espelhoColumns = useMemo<EspelhoColumn[]>(() => {
    const entries = payload?.espelho || [];

    const idPorGrupoSub = new Map<string, string>();
    const idPorNome = new Map<string, string>();
    const idPorAbreviacao = new Map<string, string>();

    entries.forEach((entry) => {
      if (entry.natureza_id == null) {
        return;
      }

      const codigo = String(entry.natureza_id);
      const grupoNorm = normalizeKey(entry.natureza_grupo);
      const subgrupoNorm = normalizeKey(entry.natureza_nome);
      const abreviacaoNorm = normalizeKey(entry.natureza_abreviacao);

      if (grupoNorm && subgrupoNorm && !idPorGrupoSub.has(`${grupoNorm}|${subgrupoNorm}`)) {
        idPorGrupoSub.set(`${grupoNorm}|${subgrupoNorm}`, codigo);
      }
      if (subgrupoNorm && !idPorNome.has(subgrupoNorm)) {
        idPorNome.set(subgrupoNorm, codigo);
      }
      if (abreviacaoNorm && !idPorAbreviacao.has(abreviacaoNorm)) {
        idPorAbreviacao.set(abreviacaoNorm, codigo);
      }
    });

    const codigosUsados = new Set<string>();

    return ESPELHO_LAYOUT.map((colunaBase) => {
      const grupoNorm = normalizeKey(colunaBase.grupo);
      const subgrupoNorm = normalizeKey(colunaBase.subgrupo);
      const abreviacaoNorm = normalizeKey(colunaBase.abreviacao);
      const fallbackCodigo = `${grupoNorm}|${subgrupoNorm}`;

      const candidatos = [
        idPorGrupoSub.get(`${grupoNorm}|${subgrupoNorm}`),
        idPorNome.get(subgrupoNorm),
        abreviacaoNorm ? idPorAbreviacao.get(abreviacaoNorm) : undefined,
      ];

      let codigo: string | undefined;
      for (const candidato of candidatos) {
        if (candidato && !codigosUsados.has(candidato)) {
          codigo = candidato;
          break;
        }
      }

      if (!codigo || codigosUsados.has(codigo)) {
        codigo = fallbackCodigo;
      }

      codigosUsados.add(codigo);

      return {
        codigo,
        grupo: colunaBase.grupo,
        subgrupo: colunaBase.subgrupo,
        abreviacao: colunaBase.abreviacao,
      };
    });
  }, [payload?.espelho]);

  const espelhoColumnLookups = useMemo(() => {
    const byCodigo = new Map<string, EspelhoColumn>();
    const byGrupoSub = new Map<string, EspelhoColumn>();
    const bySub = new Map<string, EspelhoColumn>();
    const byAbreviacao = new Map<string, EspelhoColumn>();

    espelhoColumns.forEach((col) => {
      const grupoNorm = normalizeKey(col.grupo);
      const subgrupoNorm = normalizeKey(col.subgrupo);
      const abreviacaoNorm = normalizeKey(col.abreviacao);

      byCodigo.set(col.codigo, col);
      byGrupoSub.set(`${grupoNorm}|${subgrupoNorm}`, col);
      bySub.set(subgrupoNorm, col);
      if (abreviacaoNorm) {
        byAbreviacao.set(abreviacaoNorm, col);
      }
    });

    return { byCodigo, byGrupoSub, bySub, byAbreviacao };
  }, [espelhoColumns]);

  const espelhoGroups = useMemo(() => {
    const entries = payload?.espelho || [];
    const baseEntries = payload?.espelhoBase || [];

    const groups = new Map<
      string,
      {
        crbm: string;
        rows: Map<string, { cidade: string; counts: Record<string, number>; total: number }>;
        totals: Record<string, number>;
        total: number;
      }
    >();

    const ensureRow = (crbm: string, cidade: string) => {
      let group = groups.get(crbm);
      if (!group) {
        group = {
          crbm,
          rows: new Map(),
          totals: createEmptyCounts(espelhoColumns),
          total: 0,
        };
        groups.set(crbm, group);
      }

      if (!group.rows.has(cidade)) {
        group.rows.set(cidade, { cidade, counts: createEmptyCounts(espelhoColumns), total: 0 });
      }

      return group;
    };

    baseEntries.forEach((base) => {
      const crbm = base.crbm_nome || "OUTROS";
      const cidade = base.cidade_nome || "Não informado";
      ensureRow(crbm, cidade);
    });

    entries.forEach((entry) => {
      const codigoDireto = entry.natureza_id != null ? String(entry.natureza_id) : undefined;
      let codigoColuna: string | undefined;

      if (codigoDireto && espelhoColumnLookups.byCodigo.has(codigoDireto)) {
        codigoColuna = codigoDireto;
      } else {
        const grupoNorm = normalizeKey(entry.natureza_grupo);
        const subgrupoNorm = normalizeKey(entry.natureza_nome);
        const abreviacaoNorm = normalizeKey(entry.natureza_abreviacao);

        if (grupoNorm && subgrupoNorm && !codigoColuna) {
          codigoColuna = espelhoColumnLookups.byGrupoSub.get(`${grupoNorm}|${subgrupoNorm}`)?.codigo;
        }
        if (!codigoColuna && subgrupoNorm) {
          codigoColuna = espelhoColumnLookups.bySub.get(subgrupoNorm)?.codigo;
        }
        if (!codigoColuna && abreviacaoNorm) {
          codigoColuna = espelhoColumnLookups.byAbreviacao.get(abreviacaoNorm)?.codigo;
        }
      }

      if (!codigoColuna) return;

      const crbm = entry.crbm_nome || "OUTROS";
      const cidade = entry.cidade_nome || "Não informado";
      const group = ensureRow(crbm, cidade);
      const cityRow = group.rows.get(cidade)!;

      const quantidade = entry.quantidade || 0;
      cityRow.counts[codigoColuna] = (cityRow.counts[codigoColuna] || 0) + quantidade;
      cityRow.total += quantidade;
      group.totals[codigoColuna] = (group.totals[codigoColuna] || 0) + quantidade;
      group.total += quantidade;
    });

    return Array.from(groups.values())
      .map((group) => ({
        crbm: group.crbm,
        rows: Array.from(group.rows.values()).sort((a, b) =>
          a.cidade.localeCompare(b.cidade, "pt-BR")
        ),
        subtotal: { counts: group.totals, total: group.total },
      }))
      .sort((a, b) => a.crbm.localeCompare(b.crbm, "pt-BR"));
  }, [payload?.espelho, payload?.espelhoBase, espelhoColumns, espelhoColumnLookups]);

  useEffect(() => {
    if (selectedCrbm !== "todos" && !espelhoGroups.some((group) => group.crbm === selectedCrbm)) {
      setSelectedCrbm("todos");
    }
  }, [espelhoGroups, selectedCrbm]);

  const availableCrbms = useMemo(
    () => espelhoGroups.map((group) => group.crbm),
    [espelhoGroups]
  );

  const filteredEspelho = useMemo(
    () =>
      selectedCrbm === "todos"
        ? espelhoGroups
        : espelhoGroups.filter((group) => group.crbm === selectedCrbm),
    [espelhoGroups, selectedCrbm]
  );

  const espelhoTotal = useMemo(() => {
    const summary = {
      counts: createEmptyCounts(espelhoColumns),
      total: 0,
    };

    filteredEspelho.forEach((group) => {
      espelhoColumns.forEach((col) => {
        summary.counts[col.codigo] += group.subtotal.counts[col.codigo] || 0;
      });
      summary.total += group.subtotal.total;
    });

    return summary;
  }, [filteredEspelho, espelhoColumns]);

  const groupedRelatorio = useMemo(() => {
    const estatisticas = payload?.relatorio?.estatisticas || [];
    const groups = new Map<string, RelatorioRow[]>();
    estatisticas.forEach((row) => {
      const grupo = row.grupo || "Estatísticas";
      if (!groups.has(grupo)) {
        groups.set(grupo, []);
      }
      groups.get(grupo)!.push(row);
    });
    return Array.from(groups.entries());
  }, [payload?.relatorio?.estatisticas]);

  if (loading) {
    return <div className="oc-loading">Carregando dashboard operacional...</div>;
  }

  if (error) {
    return <div className="oc-error">{error}</div>;
  }

  if (!payload) {
    return <div className="oc-error">Nenhum dado encontrado.</div>;
  }

  const { stats } = payload;

  return (
    <div className="oc-dashboard-wrapper">
      <h1>Dashboard Operacional (COCB)</h1>

      <section className="oc-card-grid">
        <div className="oc-card">
          <h2>Total de Ocorrências</h2>
          <div className="oc-value">{stats.totalOcorrencias ?? 0}</div>
        </div>
        <div className="oc-card">
          <h2>Total de Óbitos</h2>
          <div className="oc-value">{stats.totalObitos ?? 0}</div>
        </div>
        <div className="oc-card">
          <h2>Supervisor de Plantão</h2>
          <div className="oc-value" style={{ fontSize: "1.35rem" }}>
            {payload.plantao?.supervisorPlantao?.supervisor_nome || "Não definido"}
          </div>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Ocorrências Detalhadas do Dia</span>
          {destaque && (
            <span>
              Registro Nº {destaque.numero_ocorrencia || destaque.id} — {formatDate(destaque.data_ocorrencia)}
            </span>
          )}
        </div>
        <div className="oc-section-body">
          {destaque ? (
            <div className="oc-highlight-grid">
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Grupo</span>
                <span className="oc-highlight-value">{destaque.natureza_grupo || "—"}</span>
              </div>
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Natureza</span>
                <span className="oc-highlight-value">{destaque.natureza_nome || "—"}</span>
              </div>
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Horário</span>
                <span className="oc-highlight-value">{formatTime(destaque.horario_ocorrencia)}</span>
              </div>
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Endereço</span>
                <span className="oc-highlight-value">{destaque.endereco || "—"}</span>
              </div>
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Bairro</span>
                <span className="oc-highlight-value">{destaque.bairro || "—"}</span>
              </div>
              <div className="oc-highlight-block">
                <span className="oc-highlight-label">Cidade</span>
                <span className="oc-highlight-value">{destaque.cidade_nome || "—"}</span>
              </div>
              <div className="oc-highlight-block" style={{ gridColumn: "1 / -1" }}>
                <span className="oc-highlight-label">Resumo</span>
                <span className="oc-highlight-value">{destaque.resumo_ocorrencia || "—"}</span>
              </div>
            </div>
          ) : (
            <div className="oc-empty">Nenhuma ocorrência detalhada registrada para hoje.</div>
          )}
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Relatório de Óbitos do Dia</span>
        </div>
        <div className="oc-section-body">
          <table className="oc-obitos-table">
            <thead>
              <tr>
                <th>Natureza</th>
                <th>QTE</th>
                <th>Número RAI e OBM Responsável</th>
              </tr>
            </thead>
            <tbody>
              {obitosResumo.rows.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.quantidade}</td>
                  <td>
                    {row.registros.length === 0
                      ? "—"
                      : row.registros
                          .map(
                            (registro) =>
                              `(${registro.numero_ocorrencia || "N/A"}) - ${
                                registro.obm_nome || "N/A"
                              } (${registro.quantidade_vitimas || 0})`
                          )
                          .join("; ")}
                  </td>
                </tr>
              ))}
              <tr className="oc-obitos-total-row">
                <td>TOTAL</td>
                <td>{obitosResumo.total}</td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Distribuição de Ocorrências</span>
        </div>
        <div className="oc-section-body">
          <div className="oc-tables">
            <div className="oc-table">
              <table>
                <thead>
                  <tr>
                    <th>Natureza</th>
                    <th>Total</th>
                  </tr>
                </thead>
                    <tbody>
                      {stats.ocorrenciasPorNatureza?.length ? (
                        stats.ocorrenciasPorNatureza.map((row, index) => (
                          <tr key={`${row.nome}-${index}`}>
                            <td>{row.nome}</td>
                            <td>{row.total}</td>
                          </tr>
                        ))
                      ) : (
                    <tr>
                      <td colSpan={2} className="oc-empty">
                        Nenhum registro disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="oc-table">
              <table>
                <thead>
                  <tr>
                    <th>CRBM</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.ocorrenciasPorCrbm?.length ? (
                    stats.ocorrenciasPorCrbm.map((row, index) => (
                      <tr key={`${row.nome}-${index}`}>
                        <td>{row.nome}</td>
                        <td>{row.total}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="oc-empty">
                        Nenhum registro disponível
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Espelho de Lançamentos do Dia</span>
        </div>
        <div className="oc-section-body">
          <div className="oc-espelho-controls">
            <label>
              <span>Data de Visualização</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <label>
              <span>Filtrar por CRBM</span>
              <select
                value={selectedCrbm}
                onChange={(event) => setSelectedCrbm(event.target.value)}
              >
                <option value="todos">Todos os CRBMs</option>
                {availableCrbms.map((crbm) => (
                  <option key={crbm} value={crbm}>
                    {crbm}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {filteredEspelho.length === 0 ? (
            <div className="oc-empty">Nenhum lançamento encontrado para esta data.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="oc-espelho-table">
                <thead>
                  <tr>
                    <th>CRBM</th>
                    <th>Quartel / Cidade</th>
                    {espelhoColumns.map((col) => (
                      <th key={col.codigo}>{col.abreviacao}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEspelho.map((group) => (
                      <React.Fragment key={group.crbm}>
                        {group.rows.map((row, rowIndex) => ( // Adicionamos o 'rowIndex'
                          <tr key={`${group.crbm}-${row.cidade}`}>
                            {/* CONDIÇÃO: Renderizar a célula do CRBM apenas para a primeira linha (índice 0) */}
                            {rowIndex === 0 && (
                              <td
                                className="oc-espelho-crbm"
                                // Define o rowspan com o número total de linhas no grupo
                                rowSpan={group.rows.length}
                                // Adiciona alinhamento vertical no topo para corresponder à imagem
                                style={{ verticalAlign: 'top' }}
                              >
                                {group.crbm}
                              </td>
                            )}
                            <td className="oc-espelho-city">{row.cidade}</td>
                            {espelhoColumns.map((col) => (
                              <td key={col.codigo}>{row.counts[col.codigo] || 0}</td>
                            ))}
                            <td className="oc-espelho-total-cell">{row.total}</td>
                          </tr>
                        ))}
                          <tr className="oc-espelho-subtotal">
                            {/* Célula única que mescla as duas primeiras colunas */}
                            <td colSpan={2} className="oc-espelho-city">
                              SUB TOTAL
                            </td>
                            {/* As células restantes de contagem permanecem iguais */}
                            {espelhoColumns.map((col) => (
                              <td key={`${group.crbm}-subtotal-${col.codigo}`}>
                                {group.subtotal.counts[col.codigo] || 0}
                              </td>
                            ))}
                            <td className="oc-espelho-total-cell">{group.subtotal.total}</td>
                          </tr>
                    </React.Fragment>
                  ))}

                  <tr className="oc-espelho-total-row">
                    {/* Célula única que mescla as duas colunas */}
                    <td colSpan={2} className="oc-espelho-city">TOTAL GERAL</td>
                    
                    {/* As células de contagem de totais permanecem as mesmas */}
                    {espelhoColumns.map((col) => (
                      <td key={`overall-${col.codigo}`}>{espelhoTotal.counts[col.codigo] || 0}</td>
                    ))}
                    <td className="oc-espelho-total-cell">{espelhoTotal.total}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Relatório Estatístico do Dia</span>
        </div>
        <div className="oc-section-body" style={{ overflowX: "auto" }}>
          {groupedRelatorio.length === 0 ? (
            <div className="oc-empty">Nenhuma estatística encontrada.</div>
          ) : (
            <table className="oc-relatorio-table">
              <thead>
                <tr>
                  <th>Grupo</th>
                  <th>Natureza (Subgrupo)</th>
                  <th>Diurno</th>
                  <th>Noturno</th>
                  <th>Total Capital</th>
                  <th>1º CRBM</th>
                  <th>2º CRBM</th>
                  <th>3º CRBM</th>
                  <th>4º CRBM</th>
                  <th>5º CRBM</th>
                  <th>6º CRBM</th>
                  <th>7º CRBM</th>
                  <th>8º CRBM</th>
                  <th>9º CRBM</th>
                  <th>Total Geral</th>
                </tr>
              </thead>
                  <tbody>
                    {groupedRelatorio.map(([grupo, rows]) =>
                      rows.map((row, index) => (
                        <tr key={`${grupo}-${row.subgrupo}`}>
                          {index === 0 && <td rowSpan={rows.length}>{grupo}</td>}
                          <td>{row.subgrupo}</td>
                          <td>{row.diurno}</td>
                          <td>{row.noturno}</td>
                          <td>{row.total_capital}</td>
                          <td>{row["1º CRBM"] || row["1 CRBM"] || 0}</td>
                          <td>{row["2º CRBM"] || row["2 CRBM"] || 0}</td>
                          <td>{row["3º CRBM"] || row["3 CRBM"] || 0}</td>
                          <td>{row["4º CRBM"] || row["4 CRBM"] || 0}</td>
                          <td>{row["5º CRBM"] || row["5 CRBM"] || 0}</td>
                          <td>{row["6º CRBM"] || row["6 CRBM"] || 0}</td>
                          <td>{row["7º CRBM"] || row["7 CRBM"] || 0}</td>
                          <td>{row["8º CRBM"] || row["8 CRBM"] || 0}</td>
                          <td>{row["9º CRBM"] || row["9 CRBM"] || 0}</td>
                          <td>{row.total_geral}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardOcorrencias;
