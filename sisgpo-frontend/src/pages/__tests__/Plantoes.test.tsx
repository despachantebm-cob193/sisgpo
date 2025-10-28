import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import Plantoes from "../Plantoes";
import api from "@/services/api";
import React from "react";
import { useUiStore } from "@/store/uiStore";

vi.mock("@/services/api");
vi.mock("@/store/uiStore");

const mockPlantoesData = {
  data: [
    {
      id: 1,
      data_plantao: "2025-10-28",
      viatura_prefixo: "ABS-36",
      obm_abreviatura: "2º BBM",
      guarnicao: [
        { militar_id: 10, posto_graduacao: "SGT", nome_guerra: "JOÃO", nome_completo: "JOÃO DA SILVA", nome_exibicao: "SGT JOÃO DA SILVA", funcao: "MOTORISTA", telefone: "62999999999" },
        { militar_id: 12, posto_graduacao: "CB", nome_guerra: "SILVA", nome_completo: "PEDRO SILVA", nome_exibicao: "CB PEDRO SILVA", funcao: "COMANDANTE", telefone: "62888888888" },
      ],
    },
    {
        id: 2,
        data_plantao: "2025-10-28",
        viatura_prefixo: "ABS-37",
        obm_abreviatura: "1º BBM",
        guarnicao: [],
    }
  ],
  pagination: { currentPage: 1, totalPages: 1 },
};

const mockDetailedPlantao = {
    id: 1,
    data_plantao: "2025-10-28",
    viatura_id: 1,
    obm_id: 1,
    observacoes: "Observacao de teste",
    guarnicao: [
        { militar_id: 10, posto_graduacao: "SGT", nome_guerra: "JOÃO", nome_completo: "JOÃO DA SILVA", nome_exibicao: "SGT JOÃO DA SILVA", funcao: "MOTORISTA", telefone: "62999999999" },
    ],
};

describe("Plantoes", () => {
  beforeEach(() => {
    (useUiStore as vi.Mock).mockReturnValue({
      setPageTitle: vi.fn(),
    });
    (api.get as vi.Mock).mockImplementation((url) => {
        if (url.startsWith('/api/admin/plantoes/1')) {
            return Promise.resolve({ data: mockDetailedPlantao });
        }
        if (url.startsWith('/api/admin/plantoes')) {
            return Promise.resolve({ data: mockPlantoesData });
        }
        if (url.startsWith('/api/admin/viaturas/simple')) {
            return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { data: [] } });
    });
  });

  it("should render the garrison columns with full military names and functions", async () => {
    render(<Plantoes />);

    await waitFor(() => {
      expect(screen.getByText("Gerenciamento de Escalas")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const { getByText } = within(table);

    // Check for table headers
    expect(getByText("Militar(es) Escalado(s)")).toBeInTheDocument();
    expect(getByText("Funcoes")).toBeInTheDocument();

    // Check for garrison data
    // Check for names
    expect(getByText("SGT JOÃO DA SILVA, CB PEDRO SILVA")).toBeInTheDocument();
    // Check for functions
    expect(getByText("MOTORISTA, COMANDANTE")).toBeInTheDocument();
    
    // Check for fallbacks
    expect(getByText("Sem militar escalado")).toBeInTheDocument();
    expect(getByText("Sem funcao definida")).toBeInTheDocument();
  });

  it("should open the edit modal with data when edit button is clicked", async () => {
    render(<Plantoes />);

    // Find all edit buttons
    const editButtons = await screen.findAllByRole("button", { name: /editar/i });
    // Click the first edit button
    await userEvent.click(editButtons[0]);

    // Check if the modal opened with the correct title
    expect(await screen.findByText("Lançar Plantão de Viatura")).toBeInTheDocument();

    // Check if the form is populated with data from the detailed mock
    expect(await screen.findByDisplayValue("Observacao de teste")).toBeInTheDocument();
  });
});