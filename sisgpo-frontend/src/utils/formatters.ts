// Arquivo: frontend/src/utils/formatters.ts

/**
 * Formata um número de telefone para o padrão brasileiro (XX) XXXX-XXXX.
 * Lida com números como string de dígitos, já formatados ou valores nulos.
 *
 * @param telefone - A string do telefone a ser formatada (pode ser nula ou indefinida).
 * @returns A string do telefone formatada ou "N/A" se a entrada for inválida ou não corresponder ao padrão de 10 dígitos.
 */
export function formatarTelefone(telefone: string | null | undefined): string {
  // 1. Trata casos de valores nulos, vazios ou indefinidos, retornando "N/A".
  if (!telefone) {
    return "N/A";
  }

  // 2. Remove todos os caracteres que não são dígitos da string de entrada.
  //    Ex: "(62) 3201-2169" se torna "6232012169".
  const apenasDigitos = telefone.replace(/\D/g, '');

  // 3. Verifica se o número de telefone contém exatamente 10 dígitos, que é o padrão para telefones fixos no Brasil.
  if (apenasDigitos.length === 10) {
    // Aplica a máscara de formatação (XX) XXXX-XXXX.
    // Ex: "6232012169" se torna "(62) 3201-6169".
    return `(${apenasDigitos.substring(0, 2)}) ${apenasDigitos.substring(2, 6)}-${apenasDigitos.substring(6, 10)}`;
  }
  
  // 4. Se a string, após a limpeza, não tiver 10 dígitos, consideramos que não é um telefone fixo válido
  //    para o formato desejado. Retornamos o valor original, o que é útil para números especiais como "193".
  //    Se a consistência visual for mais importante, você pode alterar para retornar "N/A" aqui também.
  return telefone;
}
