import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { CreateMilitarDTO, UpdateMilitarDTO } from '../validators/militarValidator';

export type MilitarRow = {
  id?: number;
  matricula: string;
  nome_completo: string;
  nome_guerra?: string | null;
  posto_graduacao?: string | null;
  ativo: boolean;
  obm_nome?: string | null;
  telefone?: string | null;
  foto_url?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type MilitarListFilters = {
  q?: string;
  ativo?: boolean;
  posto_graduacao?: string;
  obm_nome?: string;
  escalado?: boolean;
  page: number;
  limit: number;
  crbm?: string;
};

export type MilitarListResult = {
  data: MilitarRow[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalRecords: number;
  };
};

export class MilitarRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  async findById(id: number): Promise<MilitarRow | null> {
    const { data, error } = await this.supabase
      .from('militares')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as MilitarRow;
  }

  async findByMatricula(matricula: string): Promise<MilitarRow | null> {
    const { data, error } = await this.supabase
      .from('militares')
      .select('*')
      .eq('matricula', matricula)
      .single();

    if (error) return null;
    return data as MilitarRow;
  }

  async list(filters: MilitarListFilters): Promise<MilitarListResult> {
    const { q, ativo, posto_graduacao, obm_nome, escalado, page, limit, crbm } = filters;
    console.log('[MilitarRepository] List filters:', filters);

    let query = this.supabase
      .from('militares')
      .select('id, matricula, nome_completo, nome_guerra, posto_graduacao, ativo, obm_nome, telefone, foto_url', { count: 'exact' });

    // Filtro de busca textual
    if (q) {
      const search = `nome_completo.ilike.%${q}%,nome_guerra.ilike.%${q}%,matricula.ilike.%${q}%,posto_graduacao.ilike.%${q}%,obm_nome.ilike.%${q}%`;
      query = query.or(search);
    }

    // Filtros exatos
    if (posto_graduacao) {
      query = query.eq('posto_graduacao', posto_graduacao);
    }
    if (obm_nome) {
      query = query.eq('obm_nome', obm_nome);
    }
    if (typeof ativo === 'boolean') {
      query = query.eq('ativo', ativo);
    }
    if (crbm) {
      if (crbm === 'Sem CRBM') {
        query = query.is('crbm', null);
      } else {
        query = query.eq('crbm', crbm);
      }
    }

    // Filtro complexo: Escalado
    // Verifica se o militar está em algum plantão futuro
    if (escalado) {
      // Estratégia: Buscar IDs de militares em plantões futuros primeiro
      const hoje = new Date().toISOString().split('T')[0];

      // Busca na tabela de relação militar_plantao join plantoes
      const { data: escalados, error: errEscala } = await this.supabase
        .from('militar_plantao')
        .select('militar_id, plantoes!inner(data_plantao)')
        .gte('plantoes.data_plantao', hoje);

      if (!errEscala && escalados && escalados.length > 0) {
        const ids = escalados.map((e: any) => e.militar_id);
        // Remove duplicatas
        const uniqueIds = [...new Set(ids)];
        query = query.in('id', uniqueIds);
      } else if (!errEscala && escalados && escalados.length === 0) {
        // Ninguém escalado -> força retorno vazio
        query = query.eq('id', -1);
      }
      // Se der erro na busca de escala, ignoramos silenciosamente ou logamos (mantém comportamento original que retornava vazio se tabelas não existissem)
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('nome_completo', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Erro ao listar militares: ${error.message}`);
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: data as MilitarRow[],
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    };
  }

  async searchOptions(term: string) {
    let query = this.supabase
      .from('militares')
      .select('id, matricula, nome_completo, posto_graduacao, nome_guerra, telefone')
      .eq('ativo', true);

    const search = `nome_completo.ilike.%${term}%,nome_guerra.ilike.%${term}%,matricula.ilike.%${term}%`;
    query = query.or(search);

    const { data, error } = await query.limit(15);

    if (error) return [];
    return data;
  }

  async create(data: CreateMilitarDTO): Promise<MilitarRow> {
    const { data: created, error } = await this.supabase
      .from('militares')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar militar: ${error.message}`);
    }
    return created as MilitarRow;
  }

  async update(id: number, data: UpdateMilitarDTO): Promise<MilitarRow> {
    const updateData = {
      ...data,
      updated_at: new Date(),
    };

    const { data: updated, error } = await this.supabase
      .from('militares')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar militar: ${error.message}`);
    }
    return updated as MilitarRow;
  }

  async delete(id: number): Promise<number> {
    const { error } = await this.supabase
      .from('militares')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar militar: ${error.message}`);
    }
    return 1;
  }

  async toggleActive(id: number, ativo: boolean): Promise<MilitarRow> {
    const { data: updated, error } = await this.supabase
      .from('militares')
      .update({ ativo, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao alterar status do militar: ${error.message}`);
    }
    return updated as MilitarRow;
  }
}

export default MilitarRepository;
