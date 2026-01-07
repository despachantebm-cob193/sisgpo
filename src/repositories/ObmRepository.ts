import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { CreateObmDTO, UpdateObmDTO } from '../validators/obmValidator';
import { normalizeText } from '../utils/textUtils';

export type ObmRow = {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade?: string | null;
  telefone?: string | null;
  crbm?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type ObmFilters = {
  q?: string;
  cidade?: string;
  crbm?: string;
  page: number;
  limit: number;
};

export type ObmListResult = {
  data: ObmRow[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalRecords: number;
  };
};

export class ObmRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  // Verifica se a tabela existe fazendo uma query leve
  async hasTable(): Promise<boolean> {
    const { error } = await this.supabase.from('obms').select('id').limit(1);
    return !error;
  }

  async list(filters: ObmFilters): Promise<ObmListResult> {
    const { q, page, limit } = filters;

    let query = this.supabase
      .from('obms')
      .select('*', { count: 'exact' });

    if (q) {
      // Supabase .or() syntax: "col1.op.val,col2.op.val"
      // Usamos ilike para case-insensitive match
      const searchCondition = `nome.ilike.%${q}%,abreviatura.ilike.%${q}%,cidade.ilike.%${q}%,crbm.ilike.%${q}%`;
      query = query.or(searchCondition);
    }

    // Paginação
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('nome', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Erro ao listar OBMs: ${error.message}`);
    }

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: data as ObmRow[],
      pagination: {
        currentPage: page,
        perPage: limit,
        totalPages,
        totalRecords,
      },
    };
  }

  async listSimple(): Promise<ObmRow[]> {
    const { data, error } = await this.supabase
      .from('obms')
      .select('*')
      .order('crbm', { ascending: true })
      .order('cidade', { ascending: true })
      .order('nome', { ascending: true });

    if (error) {
      throw new Error(`Erro ao listar OBMs (simples): ${error.message}`);
    }

    return data as ObmRow[];
  }

  async searchOptions(term: string): Promise<Array<{ value: number; label: string }>> {
    // Normalização no client-side é mantida, mas no Supabase usamos ilike
    // Para suporte robusto a acentos (unaccent) via API, seria ideal uma RPC.
    // Por enquanto, usamos ilike que resolve a maioria dos casos de case-insensitive
    const normalizedTerm = normalizeText(term); // Mantido por compatibilidade, mas ilike usa o termo bruto geralmente

    // Tenta buscar com o termo original e o normalizado
    const searchFilter = `nome.ilike.%${term}%,abreviatura.ilike.%${term}%`;

    const { data, error } = await this.supabase
      .from('obms')
      .select('id, nome, abreviatura')
      .or(searchFilter)
      .limit(20);

    if (error) {
      throw new Error(`Erro na busca de opções OBM: ${error.message}`);
    }

    return (data || []).map((obm: any) => ({
      value: obm.id,
      label: `${obm.abreviatura} - ${obm.nome}`,
    }));
  }

  async findById(id: number): Promise<ObmRow | null> {
    const { data, error } = await this.supabase
      .from('obms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }
    return data as ObmRow;
  }

  async findByAbreviatura(abreviatura: string): Promise<ObmRow | null> {
    const { data, error } = await this.supabase
      .from('obms')
      .select('*')
      .ilike('abreviatura', abreviatura) // ilike é case-insensitive
      .single();

    if (error) return null;
    return data as ObmRow;
  }

  async create(data: CreateObmDTO): Promise<ObmRow> {
    const { data: created, error } = await this.supabase
      .from('obms')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar OBM: ${error.message}`);
    }
    return created as ObmRow;
  }

  async update(id: number, data: UpdateObmDTO): Promise<ObmRow> {
    const updateData = {
      ...data,
      updated_at: new Date(), // Supabase tem trigger, mas podemos enviar também
    };

    const { data: updated, error } = await this.supabase
      .from('obms')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar OBM: ${error.message}`);
    }
    return updated as ObmRow;
  }

  async delete(id: number): Promise<number> {
    const { error } = await this.supabase
      .from('obms')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar OBM: ${error.message}`);
    }
    return 1; // Retorna 1 para manter compatibilidade com interface antiga que esperava row count
  }

  async clearAll(): Promise<number> {
    // Para deletar tudo no Supabase, precisa de uma condição WHERE segura ou allow delete all
    // `delete().neq('id', -1)` é um hack comum se não houver filtro natural
    const { count, error } = await this.supabase
      .from('obms')
      .delete({ count: 'exact' })
      .neq('id', 0); // Deleta tudo onde ID != 0 (basicamente tudo)

    if (error) {
      throw new Error(`Erro ao limpar OBMs: ${error.message}`);
    }
    return count || 0;
  }
}

export default ObmRepository;
