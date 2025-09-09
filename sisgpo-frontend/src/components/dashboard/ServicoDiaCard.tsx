// Arquivo: frontend/src/components/dashboard/ServicoDiaCard.tsx

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Award, Star, Shield, User, Stethoscope, Phone, ClipboardCheck, Building } from 'lucide-react';

// Interface para os dados que vêm da API
interface ServicoInfo {
  funcao: string;
  nome_guerra: string | null;
  posto_graduacao: string | null;
}

interface ServicoDiaCardProps {
  data: ServicoInfo[];
  isLoading: boolean;
}

// Mapeamento de funções para ícones e títulos para garantir consistência
const funcoesConfig: { [key: string]: { icon: React.ReactNode; title: string } } = {
  "Coordenador de Operações": { icon: <Star className="text-yellow-500" />, title: "Coord. Operações" },
  "Superior de Dia": { icon: <Star className="text-yellow-500" />, title: "Superior de Dia" },
  "Supervisor de Dia": { icon: <Shield className="text-blue-500" />, title: "Sup. de Dia" },
  "Supervisor de Atendimento": { icon: <Phone className="text-green-500" />, title: "Sup. Atend." },
  "Alpha": { icon: <Building className="text-gray-600" />, title: "Alpha" },
  "Bravo": { icon: <Building className="text-gray-600" />, title: "Bravo" },
  "Charlie": { icon: <Building className="text-gray-600" />, title: "Charlie" },
  "Delta": { icon: <Building className="text-gray-600" />, title: "Delta" },
  "Médico": { icon: <Stethoscope className="text-red-500" />, title: "Médico" },
  "Regulador": { icon: <ClipboardCheck className="text-purple-500" />, title: "Regulador" },
  "Odontólogo": { icon: <Stethoscope className="text-cyan-500" />, title: "Odontólogo" },
  "Perito": { icon: <Award className="text-indigo-500" />, title: "Perito" },
};

// Componente principal do card
const ServicoDiaCard: React.FC<ServicoDiaCardProps> = ({ data, isLoading }) => {
  // Se estiver carregando, mostra um spinner
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[200px]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  // Filtra apenas os serviços que têm um militar escalado
  const servicosComMilitares = data.filter(s => s.nome_guerra && s.posto_graduacao);

  // Se não houver ninguém escalado, mostra uma mensagem
  if (servicosComMilitares.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Serviço de Dia</h3>
        <p className="text-center text-gray-500">Nenhum militar escalado para hoje.</p>
      </div>
    );
  }

  // **LÓGICA DE RENDERIZAÇÃO REORGANIZADA**
  const renderLinha = (funcoes: string[]) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-6">
      {funcoes.map(funcao => {
        const servico = servicosComMilitares.find(s => s.funcao === funcao);
        const config = funcoesConfig[funcao] || { icon: <User />, title: funcao };

        return (
          <div key={funcao} className="text-center flex flex-col items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              {config.icon}
              <p className="text-sm text-gray-600 font-medium">{config.title}</p>
            </div>
            {servico ? (
              <p className="font-bold text-md text-gray-800 truncate w-full" title={`${servico.posto_graduacao} ${servico.nome_guerra}`}>
                {servico.posto_graduacao} {servico.nome_guerra}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">Não escalado</p>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Serviço de Dia</h3>
      <div className="space-y-6">
        {/* Linha 1 */}
        {renderLinha(["Coordenador de Operações", "Superior de Dia", "Supervisor de Dia", "Supervisor de Atendimento"])}
        <hr className="my-4 border-gray-200" />
        {/* Linha 2 */}
        {renderLinha(["Alpha", "Bravo", "Charlie", "Delta"])}
        <hr className="my-4 border-gray-200" />
        {/* Linha 3 */}
        {renderLinha(["Médico", "Regulador", "Odontólogo", "Perito"])}
      </div>
    </div>
  );
};

export default ServicoDiaCard;
