import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { CreateViaturaDTO, UpdateViaturaDTO } from '../validators/viaturaValidator';
import { normalizeText } from '../utils/textUtils';

export type ViaturaRow = {
  id?: number;
  prefixo: string;
  tipo?: string | null;
  ativa: boolean;
  cidade?: string | null;
  obm?: string | null;
  telefone?: string | null;
  obm_abreviatura?: string | null;
  last_plantao_date?: string | null;
  created_at?: Date;
  updated_at?: Date;
};

export type ViaturaListFilters = {
  q?: string;
  ativa?: boolean;
  cidade?: string;
  obm?: string;
  tipo?: string;
  page: number;
  limit: number;
};

export type ViaturaListResult = {
  data: ViaturaRow[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalRecords: number;
  };
};

// Helper function mantida (lógica pura JS)
const buildObmAbbreviationMap = (obms: Array<{ id: number; nome?: string; abreviatura?: string }>) => {
  const map = new Map<string, { id: number; abreviatura?: string }>();

  obms.forEach((obm) => {
    const keys = new Set<string>();
    const nome = obm.nome || '';
    const abreviatura = obm.abreviatura || '';

    const pushKey = (rawValue: string) => {
      if (!rawValue) return;
      const normalized = normalizeText(rawValue);
      if (normalized) {
        keys.add(normalized);
      }
    };

    pushKey(nome);
    pushKey(abreviatura);

    if (nome.includes('-')) {
      pushKey(nome.split('-')[0].trim());
    }

    keys.forEach((key) => {
      if (!map.has(key)) {
        map.set(key, { id: obm.id, abreviatura: obm.abreviatura });
      }
    });
  });

  return map;
};

export class ViaturaRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  async list(filters: ViaturaListFilters): Promise<ViaturaListResult> {
    const { q, ativa, cidade, obm, tipo, page, limit } = filters;

    let query = this.supabase
      .from('viaturas')
      .select('*, plantoes(data_plantao)', { count: 'exact' });

    if (q) {
      // Busca apenas em campos da viatura por enquanto. 
      // Busca em 'obm' (string denormalizada) ajuda a achar por nome da unidade.
      const search = `prefixo.ilike.%${q}%,tipo.ilike.%${q}%,cidade.ilike.%${q}%,obm.ilike.%${q}%`;
      query = query.or(search);
    }

    if (cidade) {
      query = query.eq('cidade', cidade);
    }

    if (obm) {
      query = query.eq('obm', obm);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    if (typeof ativa === 'boolean') {
      query = query.eq('ativa', ativa);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Use order on viaturas
    const { data, count, error } = await query
      .order('prefixo', { ascending: true })
      .range(from, to);

    if (error) {
      throw new Error(`Erro ao listar viaturas: ${error.message}`);
    }

    let viaturas = (data || []).map((v: any) => {
      // Extract latest plantao date
      const dates = (v.plantoes || []).map((p: any) => p.data_plantao).sort().reverse();
      const last_plantao_date = dates.length > 0 ? dates[0] : null;

      // Clean up the nested plantoes array from the result object to match ViaturaRow cleanly
      // (Optional, but good for cleanliness)
      const { plantoes, ...rest } = v;
      return { ...rest, last_plantao_date };
    }) as ViaturaRow[];

    // Hydrate OBM abbreviations (Client-side join logic replacement)
    // Chamamos isso sempre para garantir que obm_abreviatura esteja preenchido
    viaturas = await this.hydrateObmFallback(viaturas);

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: viaturas,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    };
  }

  async search(term: string): Promise<ViaturaRow[]> {
    const search = `prefixo.ilike.%${term}%,tipo.ilike.%${term}%,cidade.ilike.%${term}%,obm.ilike.%${term}%`;

    const { data, error } = await this.supabase
      .from('viaturas')
      .select('*')
      .or(search)
      .order('prefixo')
      .limit(50); // Limite de segurança

    if (error) return [];
    return data as ViaturaRow[];
  }

  async findById(id: number): Promise<ViaturaRow | null> {
    const { data, error } = await this.supabase
      .from('viaturas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as ViaturaRow;
  }

  async findByPrefix(prefixo: string): Promise<ViaturaRow | null> {
    const { data, error } = await this.supabase
      .from('viaturas')
      .select('*')
      .ilike('prefixo', prefixo)
      .single();

    if (error) return null;
    return data as ViaturaRow;
  }

  async create(data: CreateViaturaDTO & { tipo?: string | null }): Promise<ViaturaRow> {
    const payload = {
      prefixo: data.prefixo,
      tipo: data.tipo ?? null,
      ativa: typeof data.ativa === 'boolean' ? data.ativa : true,
      cidade: data.cidade || null,
      obm: data.obm || null,
      telefone: data.telefone || null,
    };

    const { data: created, error } = await this.supabase
      .from('viaturas')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar viatura: ${error.message}`);
    }
    return created as ViaturaRow;
  }

  async update(id: number, data: UpdateViaturaDTO & { tipo?: string | null }): Promise<ViaturaRow> {
    const payload: Partial<ViaturaRow> = {
      prefixo: data.prefixo,
      tipo: data.tipo,
      ativa: data.ativa,
      cidade: data.cidade,
      obm: data.obm,
      telefone: data.telefone,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => payload[key as keyof ViaturaRow] === undefined && delete payload[key as keyof ViaturaRow]);

    if (Object.keys(payload).length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Viatura não encontrada.');
      return existing;
    }

    const updateData = {
      ...payload,
      updated_at: new Date(),
    };

    const { data: updated, error } = await this.supabase
      .from('viaturas')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar viatura: ${error.message}`);
    }
    return updated as ViaturaRow;
  }

  async delete(id: number): Promise<number> {
    const { error } = await this.supabase
      .from('viaturas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar viatura: ${error.message}`);
    }
    return 1;
  }

  async toggleActive(id: number, ativa: boolean): Promise<ViaturaRow> {
    const { data: updated, error } = await this.supabase
      .from('viaturas')
      .update({ ativa, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao alternar status da viatura: ${error.message}`);
    }
    return updated as ViaturaRow;
  }

  async getDistinctObms() {
    // Busca todas as OBMs distintas (simulado via client-side unique)
    // PostgREST não tem SELECT DISTINCT direto, mas podemos buscar a coluna e filtrar
    // Se a tabela for grande, isso não é ideal, mas para viaturas é aceitável.
    const { data, error } = await this.supabase
      .from('viaturas')
      .select('obm')
      .not('obm', 'is', null)
      .order('obm');

    if (error || !data) return [];

    const uniqueObms = [...new Set(data.map((r: any) => r.obm))];
    return uniqueObms;
  }

  async countByObm(obm?: string, excludeId?: number | string) {
    let query = this.supabase
      .from('viaturas')
      .select('id', { count: 'exact', head: true }) // head: true não traz dados, só count
      .not('obm', 'is', null);

    if (obm) {
      query = query.eq('obm', obm);
    }
    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { count, error } = await query;
    if (error) return 0;
    return count || 0;
  }

  async clearAll(): Promise<number> {
    const { count, error } = await this.supabase
      .from('viaturas')
      .delete({ count: 'exact' })
      .neq('id', 0);

    if (error) throw new Error(`Erro ao limpar viaturas: ${error.message}`);
    return count || 0;
  }

  async previewClearAll(limit = 100) {
    const { data } = await this.supabase
      .from('viaturas')
      .select('*')
      .limit(limit);
    return data as ViaturaRow[];
  }

  async hydrateObmFallback(viaturas: ViaturaRow[]): Promise<ViaturaRow[]> {
    const needsFallback = viaturas.some((viatura) => !viatura.obm_abreviatura && viatura.obm);
    if (!needsFallback) {
      return viaturas;
    }

    // Busca tabela OBMs completa para fazer match em memória
    // Assumindo que a tabela OBMs não é gigantesca (< 1000 registros)
    const { data: obms } = await this.supabase.from('obms').select('id, nome, abreviatura');

    if (!obms) return viaturas;

    const obmMap = buildObmAbbreviationMap(obms as any[]);

    viaturas.forEach((viatura) => {
      if (!viatura.obm || viatura.obm_abreviatura) return;

      const candidates: string[] = [];
      // Tenta usar o helper normalize que já existe no utils
      const normalized = normalizeText(viatura.obm);
      if (normalized) {
        candidates.push(normalized);
      }
      const parts = viatura.obm.split(/[()]/).map((p) => normalizeText(p)).filter(Boolean);
      candidates.push(...parts);

      for (const candidate of candidates) {
        const match = obmMap.get(candidate);
        if (match) {
          viatura.obm_abreviatura = match.abreviatura ?? null;
          break;
        }
      }
    });

    return viaturas;
  }
}

export default ViaturaRepository;
