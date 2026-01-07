import { supabaseAdmin } from '../config/supabase';

type ViaturaInput = {
  prefixo?: string;
  obm?: string;
  rawPrefixos?: string;
  missingDelimiterHint?: boolean;
  rowNumber?: number;
};

type ValidationError = {
  linha: number;
  campo: string;
  tipo: string;
  descricao: string;
  sugestao: string;
};

type ValidationResult =
  | { status: 'erro'; erros: ValidationError[] }
  | { status: 'validado'; erros: [] };

class AIAssistedValidationService {
  async validateViaturaUpload(viaturaData: ViaturaInput[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Otimização: Buscar apenas dados relevantes se o dataset for grande, 
    // ou buscar todos se a tabela for pequena. 
    // Como é 'viaturas', pode ser médio. Vamos buscar apenas prefixos para comparação.
    const { data: existingViaturas, error } = await supabaseAdmin
      .from('viaturas')
      .select('prefixo');

    if (error) {
      console.error('Erro ao validar prefixos:', error);
      // Fallback: considerar vazio ou lançar erro? 
      // Vamos considerar vazio para não bloquear, mas logar.
    }

    const existingPrefixos = new Set(existingViaturas?.map((v: any) => String(v.prefixo).toUpperCase().trim()) || []);

    const processedPrefixos = new Set<string>();
    const rowsWithDelimiterWarnings = new Set<number>();

    viaturaData.forEach((viatura, index) => {
      const lineNumber = viatura.rowNumber ?? index + 2;

      if (!viatura.prefixo) {
        errors.push({
          linha: lineNumber,
          campo: 'prefixo',
          tipo: 'campo_faltante',
          descricao: "O campo 'prefixo' é obrigatório e não foi preenchido.",
          sugestao: 'Preencha o prefixo da viatura.',
        });
      }
      if (!viatura.obm) {
        errors.push({
          linha: lineNumber,
          campo: 'obm',
          tipo: 'campo_faltante',
          descricao: "O campo 'obm' é obrigatório e não foi preenchido.",
          sugestao: 'Preencha a OBM da viatura.',
        });
      }

      if (viatura.missingDelimiterHint && !rowsWithDelimiterWarnings.has(lineNumber)) {
        errors.push({
          linha: lineNumber,
          campo: 'prefixos',
          tipo: 'prefixo_unico_sem_delimitador',
          descricao: `O valor '${viatura.rawPrefixos || viatura.prefixo}' parece conter múltiplos prefixos sem delimitador.`,
          sugestao: 'Separe os prefixos com vírgula, ponto e vírgula, barra ou espaços duplos antes de importar.',
        });
        rowsWithDelimiterWarnings.add(lineNumber);
      }

      if (viatura.prefixo) {
        const prefixo = viatura.prefixo.toUpperCase().trim();
        if (processedPrefixos.has(prefixo)) {
          errors.push({
            linha: lineNumber,
            campo: 'prefixo',
            tipo: 'duplicata_no_lote',
            descricao: `O prefixo '${viatura.prefixo}' está duplicado neste arquivo.`,
            sugestao: 'Remova uma das viaturas com este prefixo ou corrija o valor.',
          });
        } else if (existingPrefixos.has(prefixo)) {
          console.log(`Info: Prefixo '${prefixo}' já existe no banco e será atualizado.`);
        }
        processedPrefixos.add(prefixo);
      }
    });

    if (errors.length > 0) {
      return { status: 'erro', erros: errors };
    }

    return { status: 'validado', erros: [] };
  }
}

export default new AIAssistedValidationService();
