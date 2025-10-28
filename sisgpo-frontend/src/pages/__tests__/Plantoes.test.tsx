import { render, screen, waitFor, within } from "@testing-library/react";
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
        { nome_guerra: "SGT JOÃO", funcao: "MOTORISTA" },
        { nome_guerra: "CB SILVA", funcao: "COMANDANTE" },
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

describe("Plantoes", () => {
  beforeEach(() => {
    (useUiStore as vi.Mock).mockReturnValue({
      setPageTitle: vi.fn(),
    });
    (api.get as vi.Mock).mockImplementation((url) => {
        if (url.startsWith('/api/admin/plantoes')) {
            return Promise.resolve({ data: mockPlantoesData });
        }
        if (url.startsWith('/api/admin/viaturas/simple')) {
            return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { data: [] } });
    });
  });

  it("should render the garrison column with military personnel", async () => {
    render(<Plantoes />);

    await waitFor(() => {
      expect(screen.getByText("Gerenciamento de Escalas")).toBeInTheDocument();
    });

    const table = screen.getByRole("table");
    const { getByText } = within(table);

    // Check for table headers
    expect(getByText("Militar(es) Escalado(s)")).toBeInTheDocument();

    // Check for garrison data
    expect(getByText("SGT JOÃO (MOTORISTA), CB SILVA (COMANDANTE)")).toBeInTheDocument();
    expect(getByText("Sem militar escalado")).toBeInTheDocument();
  });
});