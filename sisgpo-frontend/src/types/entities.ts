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

export interface Viatura {
  id?: number;
  prefixo: string;
  tipo: string;
  obm: string;
  cidade: string;
  ativa: boolean;
  telefone: string;
  synced?: boolean;
}

export interface ServicoDia {
  id: number;
  funcao: string;
  pessoa_id: number;
  pessoa_type: string;
  data_inicio: string;
  data_fim: string;
  created_at: string;
  updated_at: string;
}

export interface Obm {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade?: string | null;
  telefone?: string | null;
  crbm?: string | null;
  obm_id?: number;
  synced?: boolean;
}

export interface Aeronave {
  id: number;
  prefixo: string;
  tipo_asa: 'fixa' | 'rotativa';
  ativa: boolean;
  created_at: string;
  updated_at: string;
  synced?: boolean;
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
  status?: 'pending' | 'pendente' | 'approved' | 'rejected';
  whatsapp?: string | null;
  unidade?: string | null;
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
  whatsapp?: string;
  unidade?: string;
};

export type ValidationErrors = Record<string, string>;
