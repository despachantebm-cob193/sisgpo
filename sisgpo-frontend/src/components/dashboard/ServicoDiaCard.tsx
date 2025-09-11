// Arquivo: frontend/src/components/dashboard/ServicoDiaCard.tsx (VERSÃO FINAL E CORRIGIDA)

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Award, Star, Shield, User, Stethoscope, Phone, ClipboardCheck, Building } from 'lucide-react';

// Interface para os dados que o componente recebe
interface ServicoInfo {
  funcao: string;
  nome_guerra: string | null;
  posto_graduacao: string | null;
}

interface ServicoDiaCardProps {
  data: ServicoInfo[];
  isLoading: boolean;
}

// Mapeamento de funções para ícones e títulos, para uma UI mais rica
const funcoesConfig: { [key: string]: { icon: React.ReactNode; title: string } } = {
  "Coordenador de Operações": { icon: <Star className="text-yellow-500" />, title: "Coord. Operações" },
  "Superior de Dia": { icon: <Star className="text-yellow-500" />, title: "Superior de Dia" },
  "Supervisor de Dia": { icon: <Shield className="text-blue-500" />, title: "Sup. de Dia" },
  "Supervisor de Atendimento": { icon: <Phone className="text-green-500" />, title: "Sup. Atend." },
  "Alpha - 1º BBM": { icon: <Building className="text-gray-600" />, title: "Alpha" },
  "Bravo - 2º BBM": { icon: <Building className="text-gray-600" />, title: "Bravo" },
  "Charlie - 7º BBM": { icon: <Building className="text-gray-600" />, title: "Charlie" },
  "Delta - 8º BBM": { icon: <Building className="text-gray-600" />, title: "Delta" },
  "Médico": { icon: <Stethoscope className="text-red-500" />, title: "Médico" },
  "Regulador": { icon: <ClipboardCheck className="text-purple-500" />, title: "Regulador" },
  "Odontólogo": { icon: <Stethoscope className="text-cyan-500" />, title: "Odontólogo" },
  "Perito": { icon: <Award className="text-indigo-500" />, title: "Perito" },
};

// --- CORREÇÃO PRINCIPAL APLICADA AQUI ---
// A lógica de renderização foi refeita para ser mais robusta e dinâmica.

const ServicoDiaCard: React.FC<ServicoDiaCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[200px]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // Agrupa os profissionais por função a partir dos dados recebidos da API
  const profissionaisPorFuncao = data.reduce((acc, servico) => {
    const { funcao } = servico;
    if (!acc[funcao]) {
      acc[funcao] = [];
    }
    acc[funcao].push(servico);
    return acc;
  }, {} as { [key: string]: ServicoInfo[] });

  // Função que renderiza uma linha de funções
  const renderLinha = (funcoes: string[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
      {funcoes.map(funcao => {
        const profissionais = profissionaisPorFuncao[funcao] || [];
        const config = funcoesConfig[funcao] || { icon: <User />, title: funcao };

        return (
          <div key={funcao} className="text-center flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              {config.icon}
              <p className="text-sm text-gray-600 font-medium">{config.title}</p>
            </div>
            
            <div className="font-bold text-md text-gray-800 w-full">
              {profissionais.length > 0 ? (
                profissionais.map((p, index) => (
                  <div key={index} className="truncate" title={`${p.posto_graduacao || ''} ${p.nome_guerra || ''}`.trim()}>
                    {`${p.posto_graduacao || ''} ${p.nome_guerra || ''}`.trim()}
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-400 italic font-normal">Não escalado</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Serviço de Dia</h3>
      <div className="space-y-6">
        {renderLinha(["Coordenador de Operações", "Superior de Dia", "Supervisor de Dia", "Supervisor de Atendimento"])}
        <hr className="my-4 border-gray-200" />
        {renderLinha(["Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM"])}
        <hr className="my-4 border-gray-200" />
        {renderLinha(["Médico", "Regulador", "Odontólogo", "Perito"])}
      </div>
    </div>
  );
};

export default ServicoDiaCard;
