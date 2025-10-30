import { useUiStore } from "../store/uiStore";
import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
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

interface TransformedNatureza {
  subgrupo: string;
  totalNatureza: number;
  totals: Record<string, number>;
}

interface TransformedGroup {
  grupo: string;
  totalGroup: number;
  rows: RelatorioRow[];
  naturezas: TransformedNatureza[];
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



interface EspelhoColumn {
  codigo: string;
  grupo: string;
  subgrupo: string;
  abreviacao: string;
}

const CRBM_FIELD_MAPPINGS = Array.from({ length: 9 }, (_, index) => {
  const number = index + 1;
  const display = `${number}\u00BA CRBM`;

  return {
    display,
    keys: [display, `${number}\u00B0 CRBM`, `${number} CRBM`],
  };
});

const RELATORIO_METRIC_LABELS = [
  "Diurno",
  "Noturno",
  "Total Capital",
  ...CRBM_FIELD_MAPPINGS.map((field) => field.display),
  "Total Geral",
];

const resolveCrbmValue = (
  row: RelatorioRow,
  mapping: (typeof CRBM_FIELD_MAPPINGS)[number]
) => {
  for (const key of mapping.keys) {
    const value = row[key];
    if (value != null) {
      return value;
    }
  }
  return 0;
};

const normalizeMetricValue = (value: number | string | null | undefined): number => {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
};

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
  const setPageTitle = useUiStore((state) => state.setPageTitle);

  useEffect(() => {
    setPageTitle("Dashboard Operacional (COCB)");

    return () => {
      setPageTitle("Página Inicial"); // Reset on unmount
    };
  }, [setPageTitle]);

  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [selectedCrbm, setSelectedCrbm] = useState<string>("todos");
  const [expandedCrbms, setExpandedCrbms] = useState<Record<string, boolean>>({});
  const [expandedObms, setExpandedObms] = useState<Record<string, boolean>>({});
  const [expandedObitos, setExpandedObitos] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
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

  const obitosResumo = useMemo(() => {
    const obitos = payload?.relatorio?.obitos || [];
    if (obitos.length === 0) {
      return { rows: [], total: 0, totalRegistros: 0 };
    }

    const base = new Map<string, {
      label: string;
      quantidade: number;
      registros: ObitoRegistro[];
    }>();

    obitos.forEach((registro) => {
      const key = registro.natureza_nome || "OUTROS";
      if (!base.has(key)) {
        base.set(key, {
          label: key,
          quantidade: 0,
          registros: [],
        });
      }
      const bucket = base.get(key)!;
      bucket.quantidade += registro.quantidade_vitimas || 0;
      bucket.registros.push(registro);
    });

    const rows = Array.from(base.values()).sort((a, b) => a.label.localeCompare(b.label));
    const total = rows.reduce((sum, row) => sum + row.quantidade, 0);
    const totalRegistros = rows.reduce((sum, row) => sum + row.registros.length, 0);

    return { rows, total, totalRegistros };
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

  useEffect(() => {
    if (filteredEspelho.length === 0) {
      setExpandedCrbms({});
      return;
    }

    setExpandedCrbms((prev) => {
      const next: Record<string, boolean> = {};
      let anyExpanded = false;

      filteredEspelho.forEach((group, index) => {
        const previous = prev[group.crbm];
        const resolved = previous ?? (filteredEspelho.length === 1 && index === 0);
        next[group.crbm] = resolved;
        if (resolved) {
          anyExpanded = true;
        }
      });

      if (!anyExpanded) {
        next[filteredEspelho[0].crbm] = true;
      }

      const unchanged =
        Object.keys(prev).length === Object.keys(next).length &&
        Object.keys(next).every((key) => prev[key] === next[key]);

      return unchanged ? prev : next;
    });
  }, [filteredEspelho]);

  const handleToggleCrbm = (crbm: string) => {
    setExpandedCrbms((prev) => ({
      ...prev,
      [crbm]: !prev[crbm],
    }));
  };

  const handleToggleObm = (obmId: string) => {
    setExpandedObms((prev) => ({
      ...prev,
      [obmId]: !prev[obmId],
    }));
  };

  const handleToggleObito = (label: string) => {
    setExpandedObitos((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

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
    const estatisticasRaw = payload?.relatorio?.estatisticas;
    const estatisticas = Array.isArray(estatisticasRaw) ? estatisticasRaw : [];
    const groupsMap = new Map<string, TransformedGroup>();

    const addMetric = (
      natureza: TransformedNatureza,
      label: string,
      rawValue: number | string | null | undefined
    ) => {
      const value = normalizeMetricValue(rawValue);
      natureza.totals[label] = (natureza.totals[label] ?? 0) + value;
    };

    estatisticas.forEach((row) => {
      const grupo = row.grupo || "Estatísticas";
      const subgrupo = row.subgrupo || "Outros";

      if (!groupsMap.has(grupo)) {
        groupsMap.set(grupo, {
          grupo,
          totalGroup: 0,
          rows: [],
          naturezas: [],
        });
      }
      const groupData = groupsMap.get(grupo)!;
      groupData.rows.push(row);

      let naturezaData = groupData.naturezas.find((n) => n.subgrupo === subgrupo);
      if (!naturezaData) {
        naturezaData = {
          subgrupo,
          totalNatureza: 0,
          totals: {},
        };
        groupData.naturezas.push(naturezaData);
      }

      addMetric(naturezaData, "Diurno", row.diurno as number | string | null | undefined);
      addMetric(naturezaData, "Noturno", row.noturno as number | string | null | undefined);
      addMetric(
        naturezaData,
        "Total Capital",
        row.total_capital as number | string | null | undefined
      );

      CRBM_FIELD_MAPPINGS.forEach((field) => {
        addMetric(naturezaData, field.display, resolveCrbmValue(row, field));
      });

      addMetric(
        naturezaData,
        "Total Geral",
        row.total_geral as number | string | null | undefined
      );

      const totalGeralValue = normalizeMetricValue(
        row.total_geral as number | string | null | undefined
      );
      naturezaData.totalNatureza += totalGeralValue;
      groupData.totalGroup += totalGeralValue;
    });

    const sortedGroups = Array.from(groupsMap.values()).sort((a, b) =>
      a.grupo.localeCompare(b.grupo, "pt-BR")
    );
    sortedGroups.forEach((group) => {
      group.rows.sort((a, b) =>
        (a.subgrupo || "").localeCompare(b.subgrupo || "", "pt-BR")
      );
      group.naturezas.sort((a, b) => a.subgrupo.localeCompare(b.subgrupo, "pt-BR"));
    });

    return sortedGroups;
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

      <section className="oc-card-grid">
        <div className="oc-card">
          <h2>Total de Ocorrências</h2>
          <div className="oc-value">{stats.totalOcorrencias ?? 0}</div>
        </div>
        <div className="oc-card">
          <h2>Total de Óbitos</h2>
          <div className="oc-value">{stats.totalObitos ?? 0}</div>
        </div>
      </section>

      <section className="oc-section" data-testid="relatorio-obitos">
        <div className="oc-section-header">
          <span className="oc-section-title">Relatório de Óbitos do Dia</span>
        </div>
        <div className="oc-section-body">
          <div className="oc-table-wrapper">
            <table className="oc-obitos-table oc-table-desktop" data-testid="obitos-desktop">
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
                        ? "-"
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
                {obitosResumo.rows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="oc-empty">
                      Nenhum óbito registrado no dia.
                    </td>
                  </tr>
                ) : (
                  <tr className="oc-obitos-total-row">
                    <td>TOTAL</td>
                    <td>{obitosResumo.total}</td>
                    <td>
                      {obitosResumo.rows
                        .flatMap((row) => row.registros)
                        .map(
                          (registro) =>
                            `(${registro.numero_ocorrencia || "N/A"}) - ${
                              registro.obm_nome || "N/A"
                            }`
                        )
                        .join("; ")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="oc-obitos-cards" data-testid="obitos-mobile">
              {obitosResumo.rows.length > 0 ? (
                obitosResumo.rows.map((row) => {
                  const isExpanded = !!expandedObitos[row.label];

                  return (
                    <div className="oc-espelho-accordion" key={row.label}>
                      <button
                        type="button"
                        className={`oc-espelho-accordion-header ${isExpanded ? "is-open" : ""}`}
                        onClick={() => handleToggleObito(row.label)}
                      >
                        <div className="oc-espelho-accordion-title">
                          <span className="oc-espelho-accordion-arrow">
                            <ChevronDown />
                          </span>
                          <span>{row.label}</span>
                        </div>
                        <div className="oc-espelho-accordion-total">
                          <span style={{
                            backgroundColor: '#dc3545',
                            color: 'white',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                          }}>
                            {row.quantidade}
                          </span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="oc-espelho-accordion-body">
                          <div className="oc-card-row">
                            <span className="oc-card-label">REGISTROS INDIVIDUAIS</span>
                            {row.registros.map((registro) => (
                              <div key={registro.id} style={{ marginTop: '10px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <span className="oc-card-value" style={{ fontWeight: 'bold', color: '#90cdf4' }}>
                                    RAI: {registro.numero_ocorrencia || "N/A"}
                                  </span>
                                  <span className="oc-card-value" style={{ fontWeight: 'bold', color: '#90cdf4' }}>
                                    {registro.quantidade_vitimas || 0}
                                  </span>
                                </div>
                                <span className="oc-card-value" style={{ display: 'block', fontSize: '0.8rem' }}>
                                  {registro.obm_nome || "N/A"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="oc-empty">Nenhum óbito registrado no dia.</div>
              )}
              {obitosResumo.rows.length > 0 && (
                <div className="oc-obitos-card oc-obitos-card-total">
                  <div className="oc-card-row">
                    <span className="oc-card-label">Total</span>
                    <span className="oc-card-value">{obitosResumo.total}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
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
            <div className="oc-empty">Nenhum lancamento encontrado para esta data.</div>
          ) : (
            <>
              <div className="oc-table-scroll">
                <table className="oc-espelho-table oc-table-desktop">
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
                        {group.rows.map((row, rowIndex) => (
                          <tr key={`${group.crbm}-${row.cidade}`}>
                            {rowIndex === 0 && (
                              <td className="oc-espelho-crbm" rowSpan={group.rows.length} style={{ verticalAlign: "top" }}>
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
                          <td colSpan={2} className="oc-espelho-city">
                            SUB TOTAL
                          </td>
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
                      <td colSpan={2} className="oc-espelho-city">
                        TOTAL GERAL
                      </td>
                      {espelhoColumns.map((col) => (
                        <td key={`overall-${col.codigo}`}>{espelhoTotal.counts[col.codigo] || 0}</td>
                      ))}
                      <td className="oc-espelho-total-cell">{espelhoTotal.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="oc-espelho-cards">
                {filteredEspelho.map((group) => {
                  const isExpanded = !!expandedCrbms[group.crbm];

                  return (
                    <div className="oc-espelho-accordion" key={group.crbm}>
                      <button
                        type="button"
                        className={`oc-espelho-accordion-header ${isExpanded ? "is-open" : ""}`}
                        onClick={() => handleToggleCrbm(group.crbm)}
                      >
                        <div className="oc-espelho-accordion-title">
                          <span className="oc-espelho-accordion-arrow">
                            <ChevronDown />
                          </span>
                          <span>{group.crbm}</span>
                        </div>
                        <div className="oc-espelho-accordion-total">
                          <span>Total</span>
                          <span>{group.subtotal.total}</span>
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="oc-espelho-accordion-body">
                          {group.rows.map((row) => {
                            const obmId = `${group.crbm}-${row.cidade}`;
                            const isObmExpanded = !!expandedObms[obmId];
                            return (
                              <div
                                className="oc-espelho-accordion"
                                key={obmId}
                                style={{
                                  borderColor: row.total > 0 ? "rgba(40, 167, 69, 0.7)" : "rgba(220, 53, 69, 0.7)",
                                }}
                              >
                                <button
                                  type="button"
                                  className={`oc-espelho-accordion-header ${
                                    isObmExpanded ? "is-open" : ""
                                  }`}
                                  onClick={() => handleToggleObm(obmId)}
                                >
                                  <div className="oc-espelho-accordion-title">
                                    <span className="oc-espelho-accordion-arrow">
                                      <ChevronDown />
                                    </span>
                                    <span>{row.cidade}</span>
                                  </div>
                                  <div className="oc-espelho-accordion-total">
                                    <span>Total</span>
                                    <span>{row.total}</span>
                                  </div>
                                </button>
                                {isObmExpanded && (
                                  <div className="oc-espelho-accordion-body">
                                    <div className="oc-espelho-count-list">
                                      {espelhoColumns
                                        .filter((col) => (row.counts[col.codigo] || 0) > 0)
                                        .map((col) => (
                                          <div
                                            className="oc-espelho-count-row"
                                            key={`${group.crbm}-${row.cidade}-${col.codigo}`}
                                          >
                                            <span className="oc-espelho-count-label">
                                              {col.abreviacao}
                                            </span>
                                            <span className="oc-espelho-count-value">
                                              {row.counts[col.codigo]}
                                            </span>
                                          </div>
                                        ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                        </div>
                      )}
                    </div>
                  );
                })}

              </div>
            </>
          )}
        </div>
      </section>

      <section className="oc-section">
        <div className="oc-section-header">
          <span className="oc-section-title">Relatório Estatístico do Dia</span>
        </div>
        <div className="oc-section-body">
          {groupedRelatorio.length === 0 ? (
            <div className="oc-empty">Nenhuma estatistica encontrada.</div>
          ) : (
            <>
              <div className="oc-table-scroll">
                <table className="oc-relatorio-table oc-table-desktop">
                  <thead>
                    <tr>
                      <th>Grupo</th>
                      <th>Natureza (Subgrupo)</th>
                      <th>Diurno</th>
                      <th>Noturno</th>
                      <th>Total Capital</th>
                      {CRBM_FIELD_MAPPINGS.map((field) => (
                        <th key={field.display}>{field.display}</th>
                      ))}
                      <th>Total Geral</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupedRelatorio.map(({ grupo, rows }) =>
                      rows.map((row, index) => (
                        <tr key={`${grupo}-${row.subgrupo}`}>
                          {index === 0 && <td rowSpan={rows.length}>{grupo}</td>}
                          <td>{row.subgrupo}</td>
                          <td>{row.diurno}</td>
                          <td>{row.noturno}</td>
                          <td>{row.total_capital}</td>
                          {CRBM_FIELD_MAPPINGS.map((field) => (
                            <td key={`${grupo}-${row.subgrupo}-${field.display}`}>
                              {resolveCrbmValue(row, field)}
                            </td>
                          ))}
                          <td>{row.total_geral}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="oc-relatorio-cards">
                {groupedRelatorio.map((group) => {
                  const isGroupExpanded = !!expandedGroups[group.grupo];
                  return (
                    <div className="oc-relatorio-accordion" key={group.grupo}>
                      <button
                        type="button"
                        className={`oc-relatorio-accordion-header ${isGroupExpanded ? "is-open" : ""}`}
                        onClick={() => setExpandedGroups(prev => ({ ...prev, [group.grupo]: !prev[group.grupo] }))}
                      >
                        <div className="oc-relatorio-accordion-title">
                          <span className="oc-relatorio-accordion-arrow">
                            <ChevronDown />
                          </span>
                          <span>{group.grupo}</span>
                        </div>
                        <div className="oc-relatorio-accordion-total">
                          <span>Total</span>
                          <span>{group.totalGroup}</span>
                        </div>
                      </button>
                      {isGroupExpanded && (
                        <div className="oc-relatorio-accordion-body">
                          {group.naturezas.map((natureza) => (
                            <div className="oc-relatorio-natureza-card" key={natureza.subgrupo}>
                              <div className="oc-card-row">
                                <span className="oc-card-label">Natureza</span>
                                <span className="oc-card-value">{natureza.subgrupo}</span>
                              </div>
                              <div className="oc-relatorio-accordion-total">
                                <span>Total</span>
                                <span>{natureza.totalNatureza}</span>
                              </div>
                              <div className="oc-relatorio-metrics">
                                {RELATORIO_METRIC_LABELS.map((label) => (
                                  <div
                                    className="oc-relatorio-item"
                                    key={`${group.grupo}-${natureza.subgrupo}-${label}`}
                                  >
                                    <span className="oc-relatorio-label">{label}</span>
                                    <span className="oc-relatorio-value">
                                      {natureza.totals[label] ?? 0}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardOcorrencias;
