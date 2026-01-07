import AppError from '../utils/AppError';
import AeronaveRepository from '../repositories/AeronaveRepository';
import { CreateAeronaveDTO, UpdateAeronaveDTO } from '../validators/aeronaveValidator';

export class AeronaveService {
  constructor(private readonly repository: AeronaveRepository = new AeronaveRepository()) {}

  async list(term?: string) {
    return this.repository.list(term);
  }

  async create(dto: CreateAeronaveDTO) {
    const existing = await this.repository.findByPrefix(dto.prefixo);
    if (existing) {
      throw new AppError('Prefixo de aeronave ja cadastrado.', 409);
    }
    return this.repository.create(dto);
  }

  async update(id: number, dto: UpdateAeronaveDTO) {
    const current = await this.repository.findById(id);
    if (!current) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }

    if (dto.prefixo && dto.prefixo !== current.prefixo) {
      const conflict = await this.repository.findByPrefix(dto.prefixo);
      if (conflict && conflict.id !== id) {
        throw new AppError('Outro registro ja utiliza este prefixo.', 409);
      }
    }

    if (!dto.prefixo && !dto.tipo_asa && typeof dto.ativa === 'undefined') {
      return current;
    }

    return this.repository.update(id, dto);
  }

  async delete(id: number) {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new AppError('Aeronave nao encontrada.', 404);
    }
  }
}

export default AeronaveService;
