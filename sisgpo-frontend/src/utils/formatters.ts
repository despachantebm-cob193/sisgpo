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

  // 3. Verifica se o número de telefone contém 10 ou 11 dígitos
  if (apenasDigitos.length === 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${apenasDigitos.substring(0, 2)}) ${apenasDigitos.substring(2, 6)}-${apenasDigitos.substring(6, 10)}`;
  } else if (apenasDigitos.length === 11) {
    // Celular: (XX) XXXXX-XXXX
    return `(${apenasDigitos.substring(0, 2)}) ${apenasDigitos.substring(2, 7)}-${apenasDigitos.substring(7, 11)}`;
  }

  return telefone;
}

/**
 * Gera um link para iniciar conversa no WhatsApp.
 * Adiciona o código do país (55) se necessário.
 * 
 * @param telefone - O número de telefone.
 * @param message - Mensagem opcional para pré-preencher o chat.
 * @returns A URL do WhatsApp (https://wa.me/...) ou null se inválido.
 */
export function getWhatsappLink(telefone: string | null | undefined, message?: string): string | undefined {
  if (!telefone) return undefined;

  // Remove tudo que não é dígito
  let limpo = telefone.replace(/\D/g, '');

  // Se tiver menos de 10 dígitos, provavelmente não é um número completo válido para zap
  if (limpo.length < 10) return undefined;

  // Se não começar com 55 (DDI Brasil), adiciona
  // Assumindo que números com 10 ou 11 dígitos são locais sem DDI
  if (limpo.length <= 11) {
    limpo = `55${limpo}`;
  }

  const base = `https://wa.me/${limpo}`;
  if (message) {
    return `${base}?text=${encodeURIComponent(message)}`;
  }

  return base;
}
