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

// TIPO ADICIONADO PARA CORRIGIR O ERRO
export interface EscalaAeronave {
  id?: number;
  data?: string;
  status?: string;
  aeronave_id?: number;
  aeronave_prefixo?: string;
  primeiro_piloto_id?: number | null;
  segundo_piloto_id?: number | null;
  comandante_id?: number;
  copiloto_id?: number;
  tripulante_id?: number;
  em_servico?: boolean;
  aeronave?: Aeronave;
  comandante?: Militar;
  copiloto?: Militar;
  tripulante?: Militar;
}

export type UserRecord = {
  id: number;
  login: string;
  nome?: string | null;
  nome_completo?: string | null;
  email?: string | null;
  perfil: 'admin' | 'user';
  ativo: boolean;
  created_at?: string;
  updated_at?: string;
};

export type FormState = {
  login: string;
  nome: string;
  nome_completo: string;
  email: string;
  senha: string;
  confirmarSenha: string;
  perfil: 'admin' | 'user';
};

export type ValidationErrors = Record<string, string>;
