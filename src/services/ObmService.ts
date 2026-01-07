import csvParser from 'csv-parser';
import { Readable } from 'stream';
import AppError from '../utils/AppError';
import ObmRepository, { ObmFilters, ObmListResult, ObmRow } from '../repositories/ObmRepository';
import { CreateObmDTO, UpdateObmDTO } from '../validators/obmValidator';

type CsvRecord = {
  abreviatura?: string;
  nome?: string;
  cidade?: string;
  telefone?: string;
  crbm?: string;
};

const FIELD_LIMITS: Record<string, { limit: number; label: string }> = {
  abreviatura: { limit: 20, label: 'Abreviatura' },
  nome: { limit: 100, label: 'Nome' },
  cidade: { limit: 50, label: 'Cidade' },
  telefone: { limit: 20, label: 'Telefone' },
};

export class ObmService {
  constructor(private readonly repository: ObmRepository = new ObmRepository()) {}

  async list(filters: ObmFilters): Promise<ObmListResult> {
    const hasTable = await this.repository.hasTable();
    if (!hasTable) {
      return { data: [], pagination: { currentPage: 1, perPage: filters.limit, totalPages: 0, totalRecords: 0 } };
    }
    return this.repository.list(filters);
  }

  async listSimple(): Promise<ObmRow[]> {
    const hasTable = await this.repository.hasTable();
    if (!hasTable) return [];
    return this.repository.listSimple();
  }

  async searchOptions(term?: string) {
    if (!term || term.length < 2) return [];
    return this.repository.searchOptions(term);
  }

  async create(dto: CreateObmDTO): Promise<ObmRow> {
    const nomeTrim = dto.nome?.trim() || '';
    const abreviaturaTrim = dto.abreviatura?.trim() || '';
    if (!nomeTrim) throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    if (!abreviaturaTrim) throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);

    const exists = await this.repository.findByAbreviatura(abreviaturaTrim);
    if (exists) throw new AppError('Abreviatura ja cadastrada no sistema.', 409);

    return this.repository.create({
      nome: nomeTrim,
      abreviatura: abreviaturaTrim,
      cidade: dto.cidade || null,
      telefone: dto.telefone || null,
      crbm: dto.crbm || null,
    });
  }

  async update(id: number, dto: UpdateObmDTO): Promise<ObmRow> {
    const nomeTrim = dto.nome?.trim() || '';
    const abreviaturaTrim = dto.abreviatura?.trim() || '';
    if (!nomeTrim) throw new AppError('O nome da OBM nao pode ser vazio.', 400);
    if (!abreviaturaTrim) throw new AppError('A abreviatura da OBM nao pode ser vazia.', 400);

    const current = await this.repository.findById(id);
    if (!current) throw new AppError('OBM nao encontrada.', 404);

    if (abreviaturaTrim.toUpperCase() !== current.abreviatura?.toUpperCase()) {
      const conflict = await this.repository.findByAbreviatura(abreviaturaTrim);
      if (conflict && conflict.id !== id) {
        throw new AppError('A nova abreviatura ja esta em uso por outra OBM.', 409);
      }
    }

    return this.repository.update(id, {
      nome: nomeTrim,
      abreviatura: abreviaturaTrim,
      cidade: dto.cidade || null,
      telefone: dto.telefone || null,
      crbm: dto.crbm || null,
    });
  }

  async delete(id: number) {
    const result = await this.repository.delete(id);
    if (result === 0) throw new AppError('OBM nao encontrada.', 404);
  }

  async clearAll() {
    return this.repository.clearAll();
  }

  async processCsv(buffer: Buffer) {
    const csvContent = buffer.toString('utf8');
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    const records: CsvRecord[] = await new Promise((resolve, reject) => {
      const rows: CsvRecord[] = [];

      (Readable.from([csvContent]) as any)
        .pipe(
          csvParser({
            mapHeaders: ({ header }: any) => header.replace(/\uFEFF/g, '').toLowerCase(),
            mapValues: ({ value }: any) => (typeof value === 'string' ? value.trim() : value),
          }),
        )
        .on('data', (row: any) => {
          const hasData = Object.values(row).some((value) => {
            if (value === null || value === undefined) return false;
            return String(value).trim() !== '';
          });
          if (hasData) rows.push(row);
        })
        .on('end', () => resolve(rows))
        .on('error', reject);
    });

    for (let index = 0; index < records.length; index += 1) {
      const record = records[index];
      const lineNumber = index + 2;

      const abreviaturaValor = record.abreviatura ? String(record.abreviatura).trim() : '';
      const nomeValor = record.nome ? String(record.nome).trim() : '';
      const cidadeValor = record.cidade ? String(record.cidade).trim() : null;
      const telefoneValor = record.telefone ? String(record.telefone).trim() : null;
      const crbmValor = record.crbm ? String(record.crbm).trim() : null;

      if (!abreviaturaValor || !nomeValor) {
        skippedCount += 1;
        errors.push(`Linha ${lineNumber}: campos obrigatorios "abreviatura" e "nome" sao necessarios.`);
        continue;
      }

      const overflowField = Object.entries({
        abreviatura: abreviaturaValor,
        nome: nomeValor,
        cidade: cidadeValor,
        telefone: telefoneValor,
      }).find(([field, value]) => {
        if (!value) return false;
        const config = FIELD_LIMITS[field];
        return config ? (value as string).length > config.limit : false;
      });

      if (overflowField) {
        const [field, value] = overflowField as [string, any];
        const config = FIELD_LIMITS[field];
        errors.push(
          `Linha ${lineNumber}: o campo "${config.label}" excede o limite de ${config.limit} caracteres (recebeu ${value.length}).`,
        );
        skippedCount += 1;
        continue;
      }

      const existente = await this.repository.findByAbreviatura(abreviaturaValor);
      const payload: CreateObmDTO = {
        nome: nomeValor,
        abreviatura: abreviaturaValor,
        cidade: cidadeValor || null,
        telefone: telefoneValor || null,
        crbm: crbmValor || null,
      };

      if (existente) {
        await this.repository.update(existente.id as number, payload);
        updatedCount += 1;
      } else {
        await this.repository.create(payload);
        createdCount += 1;
      }
    }

    return {
      message: `Arquivo processado! OBMs Criadas: ${createdCount}. OBMs Atualizadas: ${updatedCount}. Registros ignorados: ${skippedCount}.`,
      summary: { created: createdCount, updated: updatedCount, skipped: skippedCount },
      errors,
    };
  }
}

export default ObmService;
