import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import DashboardOcorrencias from "../DashboardOcorrencias";

const mockGet = vi.fn();

vi.mock("../../services/api", () => ({
  default: {
    get: (...args: unknown[]) => mockGet(...args),
  },
}));

const mockPayload = {
  data: "2025-10-16",
  stats: {
    totalOcorrencias: 12,
    totalObitos: 3,
    ocorrenciasPorNatureza: [
      { nome: "Resgate", total: 7 },
      { nome: "Incêndio", total: 5 },
    ],
    ocorrenciasPorCrbm: [
      { nome: "1º CRBM", total: 4 },
      { nome: "2º CRBM", total: 2 },
    ],
  },
  plantao: {
    ocorrenciasDestaque: [
      {
        id: 1,
        numero_ocorrencia: "2025-0001",
        data_ocorrencia: new Date().toISOString(),
        natureza_grupo: "Resgate",
        natureza_nome: "Salvamento",
        endereco: "Rua 10",
        bairro: "Centro",
        cidade_nome: "Goiânia",
        resumo_ocorrencia: "Atendimento rápido",
      },
    ],
    supervisorPlantao: {
      usuario_id: 9,
      supervisor_nome: "Cap. Silva",
    },
  },
  relatorio: {
    estatisticas: [
      {
        grupo: "Resgate",
        subgrupo: "Resgate - Salvamento em Emergências",
        diurno: 2,
        noturno: 1,
        total_capital: 3,
        "1º CRBM": 3,
        "2º CRBM": 0,
        "3º CRBM": 0,
        "4º CRBM": 0,
        "5º CRBM": 0,
        "6º CRBM": 0,
        "7º CRBM": 0,
        "8º CRBM": 0,
        "9º CRBM": 0,
        total_geral: 3,
      },
    ],
    obitos: [
      {
        id: 1,
        quantidade_vitimas: 2,
        numero_ocorrencia: "R-01",
        obm_nome: "Goiânia",
        natureza_nome: "Acidente de Trânsito",
      },
      {
        id: 2,
        quantidade_vitimas: 1,
        numero_ocorrencia: "R-02",
        obm_nome: "Aparecida",
        natureza_nome: "Afogamento ou Cadáver",
      },
    ],
  },
  espelho: [
    {
      cidade_nome: "Goiânia - Diurno",
      crbm_nome: "1º CRBM",
      natureza_id: 101,
      natureza_grupo: "Resgate",
      natureza_nome: "Resgate - Salvamento em Emergências",
      natureza_abreviacao: "RESGATE",
      quantidade: 2,
    },
    {
      cidade_nome: "Goiânia - Diurno",
      crbm_nome: "1º CRBM",
      natureza_id: 202,
      natureza_grupo: "Incêndio",
      natureza_nome: "Edificações",
      natureza_abreviacao: "INC. EDIF",
      quantidade: 1,
    },
    {
      cidade_nome: "Rio Verde",
      crbm_nome: "2º CRBM",
      natureza_id: 303,
      natureza_grupo: "Produtos Perigosos",
      natureza_nome: "Outros / Diversos",
      natureza_abreviacao: "PPO",
      quantidade: 3,
    },
  ],
  espelhoBase: [
    { id: 1, cidade_nome: "Goiânia - Diurno", crbm_nome: "1º CRBM" },
    { id: 2, cidade_nome: "Goiânia - Noturno", crbm_nome: "1º CRBM" },
    { id: 3, cidade_nome: "Rio Verde", crbm_nome: "2º CRBM" },
  ],
};

beforeEach(() => {
  mockGet.mockReset();
});

describe("DashboardOcorrencias page", () => {
  it("renders aggregated data when API succeeds", async () => {
    mockGet.mockResolvedValueOnce({ data: mockPayload });

    render(<DashboardOcorrencias />);

    await waitFor(() => {
      expect(screen.getByText(/Dashboard Operacional/i)).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
      expect(screen.getByText("Cap. Silva")).toBeInTheDocument();
      expect(screen.getByText(/Relatório de Óbitos do Dia/i)).toBeInTheDocument();
      expect(screen.getByText(/Espelho de Lançamentos do Dia/i)).toBeInTheDocument();
      expect(screen.getByText("Goiânia - Diurno")).toBeInTheDocument();
    });
  });

  it("shows error state on API failure", async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: "Unauthorized" } } });

    render(<DashboardOcorrencias />);

    await waitFor(() => {
      expect(screen.getByText(/Falha ao carregar dados/i)).toBeInTheDocument();
      expect(screen.getByText(/Unauthorized/)).toBeInTheDocument();
    });
  });
});
