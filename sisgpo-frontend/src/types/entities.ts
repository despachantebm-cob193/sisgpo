export interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  obm_nome: string | null;
  ativo: boolean;
  telefone: string | null;
  updated_at?: string;
}

export interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface Aeronave {
  id: number;
  prefixo: string;
  tipo_asa: 'fixa' | 'rotativa';
  ativa: boolean;
  created_at: string;
  updated_at: string;
}
