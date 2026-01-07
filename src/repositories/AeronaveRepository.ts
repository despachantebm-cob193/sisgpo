import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../config/supabase';
import { CreateAeronaveDTO, UpdateAeronaveDTO } from '../validators/aeronaveValidator';

export type AeronaveRow = {
  id?: number;
  prefixo: string;
  tipo_asa: string;
  ativa: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export class AeronaveRepository {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabaseAdmin;
  }

  async list(term?: string): Promise<AeronaveRow[]> {
    let query = this.supabase
      .from('aeronaves')
      .select('id, prefixo, tipo_asa, ativa')
      .order('prefixo', { ascending: true });

    if (term) {
      query = query.ilike('prefixo', `%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Erro ao listar aeronaves: ${error.message}`);
    }
    return data as AeronaveRow[];
  }

  async findById(id: number): Promise<AeronaveRow | null> {
    const { data, error } = await this.supabase
      .from('aeronaves')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data as AeronaveRow;
  }

  async findByPrefix(prefixo: string): Promise<AeronaveRow | null> {
    const { data, error } = await this.supabase
      .from('aeronaves')
      .select('*')
      .ilike('prefixo', prefixo)
      .single();

    if (error) return null;
    return data as AeronaveRow;
  }

  async create(data: CreateAeronaveDTO): Promise<AeronaveRow> {
    const payload = {
      prefixo: data.prefixo,
      tipo_asa: data.tipo_asa,
      ativa: data.ativa ?? true,
    };

    const { data: created, error } = await this.supabase
      .from('aeronaves')
      .insert(payload)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar aeronave: ${error.message}`);
    }
    return created as AeronaveRow;
  }

  async update(id: number, data: UpdateAeronaveDTO): Promise<AeronaveRow> {
    const payload: Partial<AeronaveRow> = {};
    if (typeof data.prefixo !== 'undefined') payload.prefixo = data.prefixo;
    if (typeof data.tipo_asa !== 'undefined') payload.tipo_asa = data.tipo_asa;
    if (typeof data.ativa !== 'undefined') payload.ativa = data.ativa;

    if (Object.keys(payload).length === 0) {
      const existing = await this.findById(id);
      if (!existing) throw new Error('Aeronave não encotnrada');
      return existing;
    }

    const { data: updated, error } = await this.supabase
      .from('aeronaves')
      .update({ ...payload, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao atualizar aeronave: ${error.message}`);
    }
    return updated as AeronaveRow;
  }

  async delete(id: number): Promise<number> {
    const { error } = await this.supabase
      .from('aeronaves')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Erro ao deletar aeronave: ${error.message}`);
    }
    return 1;
  }
}

export default AeronaveRepository;
