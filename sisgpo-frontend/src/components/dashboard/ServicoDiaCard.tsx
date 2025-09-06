// Arquivo: frontend/src/components/dashboard/ServicoDiaCard.tsx (Novo Arquivo)

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Award, Star, Shield } from 'lucide-react';

interface ServicoInfo {
  funcao: string;
  nome_guerra: string | null;
  posto_graduacao: string | null;
}

interface ServicoDiaCardProps {
  data: ServicoInfo[];
  isLoading: boolean;
}

const getIconForFunction = (funcao: string) => {
  if (funcao.toLowerCase().includes('superior') || funcao.toLowerCase().includes('coordenador')) {
    return <Star className="w-5 h-5 text-yellow-500" />;
  }
  if (funcao.toLowerCase().includes('supervisor')) {
    return <Shield className="w-5 h-5 text-blue-500" />;
  }
  return <Award className="w-5 h-5 text-gray-500" />;
};

const ServicoDiaCard: React.FC<ServicoDiaCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[200px]">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }

  const servicosPrincipais = data.filter(s => s.nome_guerra);

  if (servicosPrincipais.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Serviço de Dia</h3>
        <p className="text-center text-gray-500">Nenhum militar escalado para hoje.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">Serviço de Dia</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
        {servicosPrincipais.map((servico) => (
          <div key={servico.funcao} className="text-center flex flex-col items-center">
            <div className="flex items-center gap-1 mb-1">
              {getIconForFunction(servico.funcao)}
            </div>
            <p className="text-sm text-gray-500">{servico.funcao}</p>
            <p className="font-bold text-lg text-gray-800 truncate w-full" title={`${servico.posto_graduacao} ${servico.nome_guerra}`}>
              {servico.posto_graduacao} {servico.nome_guerra}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServicoDiaCard;
