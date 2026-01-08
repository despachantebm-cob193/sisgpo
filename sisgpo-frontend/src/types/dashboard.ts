export interface Viatura { id: number; prefixo: string; ativa: boolean; }
export interface Plantao { viatura_prefixo: string | null; data_plantao: string; }
export interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; perPage: number; }
export interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }
export interface DashboardStats { total_militares_ativos: number; total_viaturas_disponiveis: number; total_obms: number; }
export interface ChartStat { name: string; value: number; }
export interface Obm { id: number; abreviatura: string; nome: string; }
export interface ObmGrupo { nome: string; prefixos: string[]; }
export interface ViaturaStatAgrupada { tipo: string; quantidade: number; obms: ObmGrupo[]; }
export interface ViaturaPorObmStat {
    id: number;
    nome: string;
    quantidade: number;
    prefixos: string[];
    crbm: string | null;
    abreviatura?: string | null;
}
export interface ServicoInfo { funcao: string; nome_guerra: string | null; posto_graduacao: string | null; telefone: string | null; }
export interface Aeronave { prefixo: string; tipo_asa: 'fixa' | 'rotativa'; status: string; primeiro_piloto: string; segundo_piloto: string; }
export interface PlantonistaCodec { turno: 'diurno' | 'noturno'; ordem_plantonista: number; nome_plantonista: string; }
