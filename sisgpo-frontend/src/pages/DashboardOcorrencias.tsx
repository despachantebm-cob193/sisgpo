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
  natureza_nome: string;
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

const OBITOS_ORDER = [
  "ACIDENTE DE TRÂNSITO",
  "ACIDENTES COM VIATURAS",
  "AFOGAMENTO OU CADÁVER",
  "ARMA DE FOGO/BRANCA/AGRESSÃO",
  "AUTO EXTERMÍNIO",
  "MAL SÚBITO",
  "OUTROS",
];

const ESPELHO_COLUMNS = [
  { id: "RESGATE", label: "RESGA1", targets: ["RESGATE - SALVAMENTO EM EMERGENCIAS"] },
  { id: "INC_VEG", label: "INC. VEG", targets: ["VEGETAÇÃO"] },
  { id: "INC_EDIF", label: "INC. EDIF", targets: ["EDIFICAÇÕES", "EDIFICACOES"] },
  { id: "INC_OUTROS", label: "INC. OUT.", targets: ["OUTROS"] },
  { id: "B_CADAV", label: "B. CADÁV", targets: ["CADÁVER", "CADAVER"] },
  { id: "B_SALV", label: "B. SALV.", targets: ["DIVERSOS"] },
  { id: "AP_PAL", label: "AP. PAL", targets: ["PALESTRAS"] },
  { id: "AP_EVE", label: "AP. EVE", targets: ["EVENTOS"] },
  { id: "AP_FOL", label: "AP. FOL", targets: ["FOLDERS/PANFLETOS", "FOLDERS"] },
  { id: "AP_OUT", label: "AP. OUT", targets: ["AÇÕES PREVENTIVAS OUTROS", "OUTROS / DIVERSOS"] },
  { id: "AT_INS", label: "AT. INS", targets: ["INSPEÇÕES", "INSPECOES"] },
  { id: "AN_PROJ", label: "AN. PROJ", targets: ["ANÁLISE DE PROJETOS", "ANALISE DE PROJETOS"] },
  { id: "PPV", label: "PPV", targets: ["VAZAMENTOS"] },
  { id: "PPO", label: "PPO", targets: ["OUTROS / DIVERSOS"] },
  { id: "DC_PREV", label: "DC PREV.", targets: ["PREVENTIVA"] },
  { id: "DC_RESP", label: "DC RESP.", targets: ["DE RESPOSTA"] },
];

const createEmptyCounts = () =>
  ESPELHO_COLUMNS.reduce<Record<string, number>>((acc, col) => {
    acc[col.id] = 0;
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
          totals: createEmptyCounts(),
          total: 0,
        };
        groups.set(crbm, group);
      }

      if (!group.rows.has(cidade)) {
        group.rows.set(cidade, { cidade, counts: createEmptyCounts(), total: 0 });
      }

      return group;
    };

    baseEntries.forEach((base) => {
      const crbm = base.crbm_nome || "OUTROS";
      const cidade = base.cidade_nome || "Não informado";
      ensureRow(crbm, cidade);
    });

    entries.forEach((entry) => {
      const normalized = normalizeText(entry.natureza_nome || "");
      const column = ESPELHO_COLUMNS.find((col) =>
        col.targets.some((target) => normalizeText(target) === normalized)
      );
      if (!column) return;

      const crbm = entry.crbm_nome || "OUTROS";
      const cidade = entry.cidade_nome || "Não informado";
      const group = ensureRow(crbm, cidade);
      const cityRow = group.rows.get(cidade)!;

      const quantidade = entry.quantidade || 0;
      cityRow.counts[column.id] += quantidade;
      cityRow.total += quantidade;
      group.totals[column.id] += quantidade;
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
  }, [payload?.espelho, payload?.espelhoBase]);

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
      counts: createEmptyCounts(),
      total: 0,
    };

    filteredEspelho.forEach((group) => {
      ESPELHO_COLUMNS.forEach((col) => {
        summary.counts[col.id] += group.subtotal.counts[col.id];
      });
      summary.total += group.subtotal.total;
    });

    return summary;
  }, [filteredEspelho]);

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
                    stats.ocorrenciasPorNatureza.map((row) => (
                      <tr key={row.nome}>
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
                    stats.ocorrenciasPorCrbm.map((row) => (
                      <tr key={row.nome}>
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
                    {ESPELHO_COLUMNS.map((col) => (
                      <th key={col.id}>{col.label}</th>
                    ))}
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEspelho.map((group) => (
                    <React.Fragment key={group.crbm}>
                      {group.rows.map((row) => (
                        <tr key={`${group.crbm}-${row.cidade}`}>
                          <td className="oc-espelho-crbm">{group.crbm}</td>
                          <td className="oc-espelho-city">{row.cidade}</td>
                          {ESPELHO_COLUMNS.map((col) => (
                            <td key={col.id}>{row.counts[col.id] || 0}</td>
                          ))}
                          <td className="oc-espelho-total-cell">{row.total}</td>
                        </tr>
                      ))}
                      <tr className="oc-espelho-subtotal">
                        <td className="oc-espelho-crbm">{group.crbm}</td>
                        <td className="oc-espelho-city">SUB TOTAL</td>
                        {ESPELHO_COLUMNS.map((col) => (
                          <td key={`${group.crbm}-subtotal-${col.id}`}>
                            {group.subtotal.counts[col.id] || 0}
                          </td>
                        ))}
                        <td className="oc-espelho-total-cell">{group.subtotal.total}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                  <tr className="oc-espelho-total-row">
                    <td className="oc-espelho-crbm">TOTAL</td>
                    <td className="oc-espelho-city">GERAL</td>
                    {ESPELHO_COLUMNS.map((col) => (
                      <td key={`overall-${col.id}`}>{espelhoTotal.counts[col.id] || 0}</td>
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
                      <td>{row["1º CRBM"] || row["1�� CRBM"] || 0}</td>
                      <td>{row["2º CRBM"] || row["2�� CRBM"] || 0}</td>
                      <td>{row["3º CRBM"] || row["3�� CRBM"] || 0}</td>
                      <td>{row["4º CRBM"] || row["4�� CRBM"] || 0}</td>
                      <td>{row["5º CRBM"] || row["5�� CRBM"] || 0}</td>
                      <td>{row["6º CRBM"] || row["6�� CRBM"] || 0}</td>
                      <td>{row["7º CRBM"] || row["7�� CRBM"] || 0}</td>
                      <td>{row["8º CRBM"] || row["8�� CRBM"] || 0}</td>
                      <td>{row["9º CRBM"] || row["9�� CRBM"] || 0}</td>
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