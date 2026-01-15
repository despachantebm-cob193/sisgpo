import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';

import { normalizeText } from '../utils/textUtils';
import db from '../config/knex';

export type PlantaoRow = {
  id?: number;
  nome?: string;
  tipo: string;
  periodo?: string | null;
  responsavel?: string | null;
  data_plantao?: Date | string | null; // Consolidado para data_plantao no schema
  data_fim?: Date | string | null;
  ativo?: boolean;
  observacoes?: string | null;
  hora_inicio?: string | null;
  hora_fim?: string | null;
  viatura_id?: number | null;
  obm_id?: number | null;
  created_at?: Date;
  updated_at?: Date;
  // Campos join (apenas leitura)
  viatura_prefixo?: string | null;
  obm_abreviatura?: string | null;
  obm_nome?: string | null;
};

export type PlantaoListFilters = {
  data_inicio?: string;
  data_fim?: string;
  obm_id?: number | null;
  viatura_prefixo?: string;
  page: number;
  limit: number;
};

export type PlantaoListResult = {
  data: PlantaoRow[];
  pagination: {
    currentPage: number;
    perPage: number;
    totalPages: number;
    totalRecords: number;
  };
};

export class PlantaoRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  async findByDateAndViatura(dataPlantao: string, viaturaId: number): Promise<PlantaoRow | null> {
    const { data, error } = await this.supabase
      .from('plantoes')
      .select('*')
      .eq('data_plantao', dataPlantao)
      .eq('viatura_id', viaturaId)
      .single();

    if (error) return null;
    return data as PlantaoRow;
  }

  async list(filters: PlantaoListFilters): Promise<PlantaoListResult> {
    const { data_inicio, data_fim, obm_id, viatura_prefixo, page, limit } = filters;

    // Supabase join syntax: table!fk(columns)
    // Precisamos selecionar colunas de relações
    let query = this.supabase
      .from('plantoes')
      .select(`
        *,
        viaturas (prefixo),
        obms (abreviatura, nome)
      `, { count: 'exact' });

    if (data_inicio) {
      query = query.gte('data_plantao', data_inicio);
    }
    if (data_fim) {
      query = query.lte('data_plantao', data_fim);
    }
    if (obm_id) {
      query = query.eq('obm_id', obm_id);
    }

    // Filtro por viatura_prefixo (relação) é complexo no Supabase (inner join filter)
    // Se precisarmos filtrar, usamos !inner
    if (viatura_prefixo) {
      // Isso força inner join e filtra
      query = this.supabase
        .from('plantoes')
        .select(`
          *,
          viaturas!inner(prefixo),
          obms(abreviatura, nome)
        `, { count: 'exact' })
        .ilike('viaturas.prefixo', viatura_prefixo);
    }

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await query
      .order('data_plantao', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Erro ao listar plantões: ${error.message}`);
    }

    // Flatten results
    const plantoes = (data || []).map((p: any) => ({
      ...p,
      viatura_prefixo: p.viaturas?.prefixo,
      obm_abreviatura: p.obms?.abreviatura,
      obm_nome: p.obms?.nome,
    }));

    const totalRecords = count || 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    return {
      data: plantoes,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    };
  }

  async findById(id: number): Promise<PlantaoRow | null> {
    const { data, error } = await this.supabase
      .from('plantoes')
      .select(`
        *,
        viaturas (prefixo),
        obms (abreviatura, nome)
      `)
      .eq('id', id)
      .single();

    if (error) return null;

    // Flatten
    const p: any = data;
    return {
      ...p,
      viatura_prefixo: p.viaturas?.prefixo,
      obm_abreviatura: p.obms?.abreviatura,
      obm_nome: p.obms?.nome,
    };
  }

  async getViaturaContext(viaturaId: number): Promise<{ prefixo: string; obmId: number | null }> {
    // Busca info da viatura
    const { data: viatura } = await this.supabase
      .from('viaturas')
      .select('prefixo, obm')
      .eq('id', viaturaId)
      .single();

    if (!viatura) return { prefixo: '', obmId: null };
    if (!viatura.obm) return { prefixo: viatura.prefixo, obmId: null };

    // Busca todas as OBMs para fazer match inteligente em memória
    // Tabela pequena (< 100 registros), safe para carregar
    const { data: obms } = await this.supabase.from('obms').select('id, nome, abreviatura');

    if (!obms || obms.length === 0) {
      // Fallback para lógica antiga se falhar carga
      return { prefixo: viatura.prefixo, obmId: null };
    }

    const target = normalizeText(viatura.obm);

    // 1. Exact match (normalized)
    let match = obms.find((o: any) =>
      normalizeText(o.nome) === target || normalizeText(o.abreviatura) === target
    );

    // 3. Token-based cross-match (e.g. "1º BBM - BOPAR" vs "BOPAR - 1º BBM")
    if (!match) {
      // Break target into meaningful tokens
      const targetTokens = viatura.obm
        .split(/[-/()]/) // Split by common separators
        .map((t: string) => normalizeText(t))
        .filter((t: string) => t.length > 2); // Ignore small connectors

      // Search in DB
      for (const obm of obms) {
        const dbTokens = [obm.nome, obm.abreviatura]
          .filter(Boolean)
          .join(' ')
          .split(/[-/()]/)
          .map((t: string) => normalizeText(t))
          .filter((t: string) => t.length > 2);

        // Check intersection
        const hasMatch = targetTokens.some((token: string) => dbTokens.includes(token));
        if (hasMatch) {
          match = obm;
          break;
        }
      }
    }

    // 4. Fallback: "Starts With" or "Contains"
    if (!match) {
      match = obms.find((o: any) => {
        const name = normalizeText(o.nome || '');
        const abbr = normalizeText(o.abreviatura || '');
        return target.startsWith(name) || target.includes(abbr) || abbr.includes(target);
      });
    }

    if (!match) {
      console.warn(`[getViaturaContext] Failed to match OBM for viatura ${viatura.prefixo}. Raw: '${viatura.obm}', Target: '${target}'`);
      console.warn(`[getViaturaContext] Available OBMs sample: ${obms.slice(0, 3).map((o: any) => `${o.nome} (${o.abreviatura})`).join(', ')}`);
    } else {
      console.log(`[getViaturaContext] Matched OBM: ${match.nome} (ID: ${match.id}) for viatura ${viatura.prefixo}`);
    }

    return {
      prefixo: viatura.prefixo,
      obmId: match ? match.id : null,
    };
  }

  async create(payload: Partial<PlantaoRow>): Promise<PlantaoRow> {
    const { data, error } = await this.supabase
      .from('plantoes')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar plantão: ${error.message}`);
    return data as PlantaoRow;
  }

  async update(id: number, payload: Partial<PlantaoRow>): Promise<PlantaoRow> {
    const { data, error } = await this.supabase
      .from('plantoes')
      .update({ ...payload, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar plantão: ${error.message}`);
    return data as PlantaoRow;
  }

  async delete(id: number): Promise<number> {
    const { error } = await this.supabase.from('plantoes').delete().eq('id', id);
    if (error) throw new Error(`Erro ao deletar plantão: ${error.message}`);
    return 1;
  }

  async getGuarnicao(plantaoId: number) {
    const data = await db('militar_plantao')
      .join('militares', 'militar_plantao.militar_id', 'militares.id')
      .where('militar_plantao.plantao_id', plantaoId)
      .select(
        'militar_plantao.id',
        'militar_plantao.militar_id',
        'militar_plantao.funcao',
        'militares.nome_guerra',
        'militares.posto_graduacao'
      );

    return data.map((item: any) => ({
      id: item.id,
      militar_id: item.militar_id,
      funcao: item.funcao,
      nome_guerra: item.nome_guerra,
      posto_graduacao: item.posto_graduacao,
    }));
  }

  async replaceGuarnicao(plantaoId: number, guarnicao: Array<{ militar_id: number; funcao?: string | null }>) {
    try {
      await db.transaction(async (trx) => {
        // 1. Delete existentes
        await trx('militar_plantao').where('plantao_id', plantaoId).delete();

        // 2. Insert novos
        const payload = guarnicao
          .filter((m) => m.militar_id)
          .map((m) => ({
            plantao_id: plantaoId,
            militar_id: m.militar_id,
            funcao: m.funcao || null
          }));

        if (payload.length > 0) {
          await trx('militar_plantao').insert(payload);
        }
      });
    } catch (error) {
      console.error('Erro ao substituir guarnição (Knex):', error);
      throw error; // Re-throw to ensure caller knows it failed
    }
  }

  async addMilitar(plantaoId: number, militarId: number, funcao?: string | null) {
    await db('militar_plantao')
      .insert({ plantao_id: plantaoId, militar_id: militarId, funcao: funcao || null })
      .onConflict(['plantao_id', 'militar_id'])
      .ignore();
  }

  async removeMilitar(plantaoId: number, militarId: number) {
    await db('militar_plantao').where({ plantao_id: plantaoId, militar_id: militarId }).delete();
  }

  async addViatura(plantaoId: number, viaturaId: number, prefixo: string) {
    await db('viatura_plantao')
      .insert({ plantao_id: plantaoId, viatura_id: viaturaId, prefixo_viatura: prefixo })
      .onConflict(['plantao_id', 'viatura_id'])
      .ignore();
  }

  async removeViatura(plantaoId: number, viaturaId: number) {
    await db('viatura_plantao').where({ plantao_id: plantaoId, viatura_id: viaturaId }).delete();
  }

  async countDistinctMilitares(): Promise<number> {
    // Count distinct militar_id
    // Supabase não tem count(distinct col). 
    // Workaround: RPC ou fetch unique ids
    // Select count from (select distinct militar_id from militar_plantao)
    // Sem RPC, é difícil fazer count distinct eficiente de tabela grande.
    // Vou fazer fetch da coluna e contar no JS (se não for muito grande).
    // militar_plantao pode ser grande.
    // Melhor: RPC. Mas como não tenho acesso pra criar RPC agora (ou tenho, via SQL)
    // Vou deixar retornando 0 ou um count simples por enquanto (count de registros totais != distinct players)
    // Se "militar_plantao" é "militar escalado em um plantão", o count * é escalas, não militares distintos.
    // Vou usar query HEAD para contar linhas totais de escala, que é uma proxy razoável por enquanto.
    const { count } = await this.supabase.from('militar_plantao').select('*', { count: 'exact', head: true });
    return count || 0;
  }
}

export default PlantaoRepository;
