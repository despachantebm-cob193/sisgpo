import AppError from '../utils/AppError';
import ViaturaRepository, {
  ViaturaListFilters,
  ViaturaListResult,
  ViaturaRow,
} from '../repositories/ViaturaRepository';
import { supabaseAdmin } from '../config/supabase';
import { normalizeText } from '../utils/textUtils';
import { CreateViaturaDTO, UpdateViaturaDTO } from '../validators/viaturaValidator';

const parseBoolean = (value: unknown, defaultValue = false): boolean => {
  if (value === undefined || value === null) return defaultValue;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'yes', 'on'].includes(String(value).trim().toLowerCase());
};

const parsePositiveNumber = (value: unknown, defaultValue: number): number => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
  return parsed;
};

export class ViaturaService {
  constructor(private readonly repository: ViaturaRepository = new ViaturaRepository()) { }

  async list(query: Record<string, unknown>): Promise<ViaturaListResult> {
    const filters: ViaturaListFilters = {
      q: typeof query.q === 'string' && query.q.trim().length > 0 ? query.q.trim() : undefined,
      cidade: typeof query.cidade === 'string' && query.cidade.trim().length > 0 ? query.cidade.trim() : undefined,
      obm: typeof query.obm === 'string' && query.obm.trim().length > 0 ? query.obm.trim() : undefined,
      ativa: typeof query.ativa === 'string' ? parseBoolean(query.ativa, false) : undefined,
      page: parsePositiveNumber(query.page, 1),
      limit: parsePositiveNumber(query.limit, 15),
    };

    const result = await this.repository.list(filters);
    const data = await this.repository.hydrateObmFallback(result.data);
    return { ...result, data };
  }

  async getAllSimple(params: { obm?: string; includeAereo?: boolean }) {
    const targetObm = params.obm && params.obm.trim().length > 0 ? params.obm.trim() : 'COA';
    const includeAereo = params.includeAereo ?? true;

    // Use list with large limit
    const listResult = await this.repository.list({ page: 1, limit: 10000, ativa: true, q: undefined });
    const viaturas = await this.repository.hydrateObmFallback(listResult.data);

    const normalizedTarget = normalizeText(targetObm);
    const targetLower = targetObm.toLowerCase();

    const filtered = viaturas.filter((viatura) => {
      const abrev = (viatura.obm_abreviatura || '').trim().toLowerCase();
      const nomeOriginal = viatura.obm || '';
      const nomeNormalized = normalizeText(nomeOriginal);

      const matchesSigla =
        abrev === targetLower || nomeNormalized === normalizedTarget || nomeOriginal.trim().toLowerCase() === targetLower;
      if (matchesSigla) return true;

      if (!includeAereo) return false;
      return nomeNormalized.includes('aereo');
    });

    return filtered.map(({ id, prefixo }) => ({ id, prefixo }));
  }

  async search(term?: string, activeOnly = true): Promise<ViaturaRow[]> {
    if (!term || term.trim().length === 0) {
      return [];
    }
    const viaturas = await this.repository.search(term.trim());
    if (activeOnly) {
      return viaturas.filter((v) => v.ativa);
    }
    return viaturas;
  }

  async getDistinctObms() {
    return this.repository.getDistinctObms();
  }

  async countByObm(obm?: string, excludeId?: number | string) {
    if (!obm) return 0;
    return this.repository.countByObm(obm, excludeId);
  }

  async create(dto: CreateViaturaDTO & { tipo?: string | null }) {
    const normalizedPrefixo = (dto.prefixo || '').trim().toUpperCase();
    if (!normalizedPrefixo) {
      throw new AppError('Prefixo e obrigatorio.', 400);
    }

    const existing = await this.repository.findByPrefix(normalizedPrefixo);
    if (existing) {
      throw new AppError('Ja existe uma viatura com esse prefixo.', 409);
    }

    return this.repository.create({
      ...dto,
      prefixo: normalizedPrefixo,
      tipo: dto.tipo ?? null,
      ativa: typeof dto.ativa === 'boolean' ? dto.ativa : true,
    });
  }

  async update(id: number, dto: UpdateViaturaDTO & { tipo?: string | null }) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new AppError('Viatura nao encontrada.', 404);
    }

    if (dto.prefixo && dto.prefixo.trim().toUpperCase() !== current.prefixo.toUpperCase()) {
      const conflict = await this.repository.findByPrefix(dto.prefixo);
      if (conflict && conflict.id !== id) {
        throw new AppError('Ja existe uma viatura com esse prefixo.', 409);
      }
    }

    const payload: UpdateViaturaDTO & { tipo?: string | null } = {
      ...dto,
      prefixo: dto.prefixo ? dto.prefixo.trim().toUpperCase() : undefined,
      tipo: dto.tipo ?? current.tipo ?? null,
    };

    return this.repository.update(id, payload);
  }

  async toggleActive(id: number) {
    const viatura = await this.repository.findById(id);
    if (!viatura) {
      throw new AppError('Viatura nao encontrada.', 404);
    }
    const updated = await this.repository.toggleActive(id, !viatura.ativa);
    return {
      message: updated.ativa ? 'Viatura ativada com sucesso.' : 'Viatura desativada com sucesso.',
      viatura: updated,
    };
  }

  async delete(id: number) {
    const deleted = await this.repository.delete(id);
    if (deleted === 0) {
      throw new AppError('Viatura nao encontrada.', 404);
    }
  }

  async previewClearAll() {
    const { count: viaturasCount } = await supabaseAdmin.from('viaturas').select('*', { count: 'exact', head: true });
    const { count: plantoesCount } = await supabaseAdmin.from('plantoes').select('*', { count: 'exact', head: true });
    const { count: vinculosCount } = await supabaseAdmin.from('viatura_plantao').select('*', { count: 'exact', head: true });

    return {
      viaturas: viaturasCount ?? 0,
      plantoes: plantoesCount ?? 0,
      vinculos: vinculosCount ?? 0,
    };
  }

  async clearAll(confirm: string | undefined, confirmHeader: string | string[] | undefined) {
    const confirmQuery = confirm === '1';
    if (!confirmQuery) {
      throw new AppError('Confirme a limpeza com ?confirm=1', 400);
    }

    if (confirmHeader !== 'VIATURAS') {
      throw new AppError(
        'Precondition Required: Adicione o cabecalho "X-Confirm-Purge: VIATURAS" para confirmar a operacao.',
        412,
      );
    }

    if (process.env.NODE_ENV === 'production' && process.env.ALLOW_VIATURA_PURGE !== 'true') {
      throw new AppError('Operacao nao permitida em producao sem a flag ALLOW_VIATURA_PURGE=true.', 403);
    }

    // Executar deletes sequenciais (Cascade constraints devem cuidar dos filhos, 
    // mas vamos limpar filhos primeiro por segurança)

    // 1. Plantoes
    const { error: err1 } = await supabaseAdmin.from('plantoes').delete().neq('id', 0); // Delete all
    if (err1) throw new AppError(`Erro ao limpar plantoes: ${err1.message}`, 500);

    // 2. Viaturas
    const { error: err2 } = await supabaseAdmin.from('viaturas').delete().neq('id', 0); // Delete all
    if (err2) throw new AppError(`Erro ao limpar viaturas: ${err2.message}`, 500);

    // 3. Metadata
    await supabaseAdmin.from('metadata').delete().eq('key', 'viaturas_last_upload');

    return { message: 'Tabela de viaturas limpa com sucesso!' };
  }

  async updateStatusExternal(id: number, status: string, ocorrenciaId?: string) {
    const viatura = await this.repository.findById(id);
    if (!viatura) {
      throw new AppError('Viatura não encontrada.', 404);
    }

    // Validar status
    const validStatuses = ['DISPONIVEL', 'EMPENHADA', 'MANUTENCAO', 'INDISPONIVEL'];
    const normalizedStatus = status.toUpperCase();
    if (!validStatuses.includes(normalizedStatus)) {
      throw new AppError(`Status inválido. Valores aceitos: ${validStatuses.join(', ')}`, 400);
    }

    // Atualizar no banco (Supabase Realtime dispara evento automaticamente)
    const { error } = await supabaseAdmin
      .from('viaturas')
      .update({
        status: normalizedStatus,
        updated_at: new Date()
      })
      .eq('id', id);

    if (error) {
      throw new AppError(`Erro ao atualizar status da viatura: ${error.message}`, 500);
    }

    console.log(`[ViaturaService] Status atualizado via integração externa: Viatura ${viatura.prefixo} -> ${normalizedStatus} ${ocorrenciaId ? `(Ocorrência: ${ocorrenciaId})` : ''}`);

    return {
      message: 'Status da viatura atualizado com sucesso',
      viatura: { id, prefixo: viatura.prefixo, status: normalizedStatus }
    };
  }
}

export default ViaturaService;
