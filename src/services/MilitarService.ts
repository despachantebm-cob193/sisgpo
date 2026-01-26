import AppError from '../utils/AppError';
import MilitarRepository, {
  MilitarListFilters,
  MilitarListResult,
  MilitarRow,
} from '../repositories/MilitarRepository';
import ObmRepository from '../repositories/ObmRepository';
import { CreateMilitarDTO, UpdateMilitarDTO } from '../validators/militarValidator';

const isTruthy = (value: unknown) => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return ['true', '1', 'yes', 'on', 'escalado'].includes(normalized);
};

const toInt = (value: unknown, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export class MilitarService {
  private obmRepository: ObmRepository;

  constructor(private readonly repository: MilitarRepository = new MilitarRepository()) {
    this.obmRepository = new ObmRepository();
  }

  async list(query: Record<string, unknown>): Promise<MilitarListResult> {
    const filters: MilitarListFilters = {
      q: (query.q as string) || (query.nome_completo as string) || undefined,
      posto_graduacao: (query.posto_graduacao as string) || undefined,
      obm_nome: (query.obm_nome as string) || undefined,
      ativo: typeof query.ativo === 'string' ? query.ativo === 'true' : undefined,
      escalado: isTruthy(query.escalado),
      page: toInt(query.page, 1),
      limit: toInt(query.limit, 50),
      crbm: (query.crbm as string) || undefined,
    };
    return this.repository.list(filters);
  }

  async searchOptions(term?: string) {
    if (!term || term.length < 2) {
      return [];
    }
    const militares = await this.repository.searchOptions(term);
    return militares.map((m) => {
      const nomeExibicao =
        m.nome_guerra && m.nome_guerra.trim().length > 0 ? m.nome_guerra.trim() : m.nome_completo?.trim() || '';
      return {
        value: m.id,
        label: nomeExibicao,
        militar: { ...m, nome_exibicao: nomeExibicao },
      };
    });
  }

  async getByMatricula(matricula: string): Promise<MilitarRow | null> {
    return this.repository.findByMatricula(matricula);
  }

  async getActiveByMatricula(matricula: string): Promise<MilitarRow> {
    const militar = await this.repository.findByMatricula(matricula);
    if (!militar || militar.ativo === false) {
      throw new AppError('Militar nao encontrado ou inativo para esta matricula.', 404);
    }
    return militar;
  }

  async create(dto: CreateMilitarDTO) {
    const exists = await this.repository.findByMatricula(dto.matricula);
    if (exists) {
      throw new AppError('Matricula ja cadastrada no sistema.', 409);
    }
    const dataToSave = await this.enrichWithObm(dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { obm_id, ...persistable } = dataToSave;
    return this.repository.create(persistable);
  }

  async update(id: number, dto: UpdateMilitarDTO) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new AppError('Militar nao encontrado.', 404);
    }
    if (dto.matricula && dto.matricula !== current.matricula) {
      const conflict = await this.repository.findByMatricula(dto.matricula);
      if (conflict && conflict.id !== id) {
        throw new AppError('A nova matricula ja esta em uso por outro militar.', 409);
      }
    }
    const dataToSave = await this.enrichWithObm(dto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { obm_id, ...persistable } = dataToSave;
    return this.repository.update(id, persistable);
  }

  async toggleActive(id: number) {
    const militar = await this.repository.findById(id);
    if (!militar) {
      throw new AppError('Militar nao encontrado.', 404);
    }
    return this.repository.toggleActive(id, !militar.ativo);
  }

  async delete(id: number) {
    const deleted = await this.repository.delete(id);
    if (deleted === 0) {
      throw new AppError('Militar nao encontrado.', 404);
    }
  }

  private async enrichWithObm<T extends { obm_id?: number | null; obm_nome?: string | null }>(
    dto: T,
  ): Promise<T> {
    if (!dto.obm_id) {
      return { ...dto, obm_nome: dto.obm_nome ?? null, obm_id: null };
    }
    const obm = await this.obmRepository.findById(dto.obm_id);
    if (!obm) {
      throw new AppError('OBM informada nao encontrada.', 400);
    }
    const obmNome = obm.abreviatura || obm.nome || '';
    return { ...dto, obm_nome: obmNome };
  }
}

export default MilitarService;
