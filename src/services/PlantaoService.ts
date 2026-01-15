import AppError from '../utils/AppError';
import PlantaoRepository, { PlantaoListFilters, PlantaoListResult, PlantaoRow } from '../repositories/PlantaoRepository';
import ViaturaRepository from '../repositories/ViaturaRepository';

const parsePositiveInt = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : null;
};

const normalizeHorarioInput = (value: unknown) => {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length ? trimmed : null;
};

const sanitizeStringToken = (token?: string | null) => {
  if (!token) return null;
  return token
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase();
};

const buildPlantaoNome = (prefixo: string, dataPlantao: string, viaturaId: number | string) => {
  const fallback = `VTR-${viaturaId}`;
  const token = sanitizeStringToken(prefixo) || sanitizeStringToken(fallback) || `PLANTAO-${viaturaId}`;
  return `PLANTAO-${token}-${dataPlantao}`;
};

export class PlantaoService {
  constructor(
    private readonly repository: PlantaoRepository = new PlantaoRepository(),
    private readonly viaturaRepository: ViaturaRepository = new ViaturaRepository(),
  ) { }

  async list(query: Record<string, unknown>): Promise<PlantaoListResult> {
    const filters: PlantaoListFilters = {
      data_inicio: typeof query.data_inicio === 'string' ? query.data_inicio : undefined,
      data_fim: typeof query.data_fim === 'string' ? query.data_fim : undefined,
      obm_id: parsePositiveInt(query.obm_id),
      viatura_prefixo: typeof query.viatura_prefixo === 'string' ? query.viatura_prefixo : undefined,
      page: parsePositiveInt(query.page) || 1,
      limit: parsePositiveInt(query.limit) || 10,
    };
    return this.repository.list(filters);
  }

  async getById(id: number) {
    const plantao = await this.repository.findById(id);
    if (!plantao) {
      throw new AppError('Plantão não encontrado.', 404);
    }
    const guarnicao = await this.repository.getGuarnicao(id);
    return { ...plantao, guarnicao };
  }

  private async resolveViaturaContext(viaturaId: number, providedObmId?: number | null) {
    const viaturaContext = await this.repository.getViaturaContext(viaturaId);
    if (!viaturaContext.prefixo) {
      throw new AppError('Viatura não encontrada.', 404);
    }
    let resolvedObmId = parsePositiveInt(providedObmId) || viaturaContext.obmId;
    if (!resolvedObmId) {
      throw new AppError(
        `Não foi possível identificar a OBM vinculada a viatura selecionada (prefixo=${viaturaContext.prefixo}). ` +
        'Verifique se o campo OBM da viatura corresponde a um nome ou sigla cadastrada em OBMs.',
        400,
      );
    }
    return { obmId: resolvedObmId, prefixo: viaturaContext.prefixo };
  }

  async create(payload: {
    data_plantao: string;
    viatura_id: number;
    obm_id?: number | null;
    observacoes?: string | null;
    guarnicao?: Array<{ militar_id: number; funcao?: string | null }>;
    hora_inicio?: string | null;
    hora_fim?: string | null;
  }) {
    const { data_plantao, viatura_id, obm_id, observacoes, guarnicao, hora_inicio, hora_fim } = payload;
    const exists = await this.repository.findByDateAndViatura(data_plantao, viatura_id);
    if (exists) {
      throw new AppError('Já existe um plantão cadastrado para esta viatura nesta data.', 409);
    }

    const { obmId, prefixo } = await this.resolveViaturaContext(viatura_id, obm_id);
    const plantaoNome = buildPlantaoNome(prefixo, data_plantao, viatura_id);

    const created = await this.repository.create({
      nome: plantaoNome,
      tipo: 'VIATURA',
      data_plantao,
      data_fim: data_plantao,
      viatura_id,
      obm_id: obmId,
      ativo: true,
      observacoes: observacoes || null,
      horario_inicio: normalizeHorarioInput(hora_inicio),
      horario_fim: normalizeHorarioInput(hora_fim),
    });

    // PASSO 4: Integridade de Dados (Compensating Transaction)
    if (Array.isArray(guarnicao) && guarnicao.length > 0) {
      try {
        await this.repository.replaceGuarnicao(created.id as number, guarnicao);
      } catch (error) {
        console.error(`[PlantaoService] Erro ao salvar guarnição. Cancelando plantão ${created.id}...`, error);
        await this.repository.delete(created.id as number).catch(delErr =>
          console.error('[PlantaoService] Erro crítico no rollback manual:', delErr)
        );
        throw new AppError('Falha ao salvar a guarnição do plantão. A operação foi cancelada.', 500);
      }
    }

    return created;
  }

  async update(
    id: number,
    payload: {
      data_plantao?: string;
      viatura_id?: number;
      obm_id?: number | null;
      observacoes?: string | null;
      guarnicao?: Array<{ militar_id: number; funcao?: string | null }>;
      hora_inicio?: string | null;
      hora_fim?: string | null;
    },
  ) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new AppError('Plantão não encontrado.', 404);
    }

    const updatePayload: Partial<PlantaoRow> = {
      observacoes: payload.observacoes,
      horario_inicio: normalizeHorarioInput(payload.hora_inicio),
      horario_fim: normalizeHorarioInput(payload.hora_fim),
    };

    if (payload.data_plantao) updatePayload.data_plantao = payload.data_plantao;
    if (payload.viatura_id) updatePayload.viatura_id = payload.viatura_id;
    if (payload.obm_id) updatePayload.obm_id = payload.obm_id;

    if (payload.viatura_id) {
      const { obmId, prefixo } = await this.resolveViaturaContext(payload.viatura_id, payload.obm_id);
      updatePayload.obm_id = obmId;
      updatePayload.nome = buildPlantaoNome(prefixo, payload.data_plantao || (current.data_plantao as string), payload.viatura_id);
    }

    const updated = await this.repository.update(id, updatePayload);

    if (Array.isArray(payload.guarnicao)) {
      try {
        await this.repository.replaceGuarnicao(id, payload.guarnicao);
      } catch (error) {
        console.error(`[PlantaoService] Erro ao atualizar guarnição do plantão ${id}:`, error);
        throw new AppError('O plantão foi atualizado, mas houve erro ao salvar a guarnição.', 500);
      }
    }

    return updated;
  }

  async delete(id: number) {
    const deleted = await this.repository.delete(id);
    if (deleted === 0) {
      throw new AppError('Plantão não encontrado.', 404);
    }
  }

  async addViatura(plantaoId: number, viaturaId: number) {
    const plantao = await this.repository.findById(plantaoId);
    if (!plantao) throw new AppError('Plantão não encontrado.', 404);

    const viatura = await this.viaturaRepository.findById(viaturaId);
    if (!viatura) throw new AppError('Viatura não encontrada.', 404);

    await this.repository.addViatura(plantaoId, viaturaId, viatura.prefixo);
  }

  async removeViatura(plantaoId: number, viaturaId: number) {
    await this.repository.removeViatura(plantaoId, viaturaId);
  }

  async addMilitar(plantaoId: number, militarId: number, funcao?: string | null) {
    const plantao = await this.repository.findById(plantaoId);
    if (!plantao) throw new AppError('Plantão não encontrado.', 404);
    await this.repository.addMilitar(plantaoId, militarId, funcao);
  }

  async removeMilitar(plantaoId: number, militarId: number) {
    await this.repository.removeMilitar(plantaoId, militarId);
  }

  async getTotalMilitaresPlantao() {
    return this.repository.countDistinctMilitares();
  }
}

export default PlantaoService;
