// Arquivo: src/components/dashboard/CodecCard.tsx (CORRIGIDO)

import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Sun, Moon } from 'lucide-react';

// Interface para os dados que vêm da API
interface Plantonista {
  turno: 'diurno' | 'noturno';
  ordem_plantonista: number;
  nome_plantonista: string;
}

interface CodecCardProps {
  data: Plantonista[];
  isLoading: boolean;
}

const CodecCard: React.FC<CodecCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[200px]">
        <Spinner />
      </div>
    );
  }

  // Separa os plantonistas por turno
  const diurno = data.filter(p => p.turno === 'diurno');
  const noturno = data.filter(p => p.turno === 'noturno');

  // Componente para renderizar um turno
  const Turno = ({ titulo, icone, plantonistas }: { titulo: string; icone: React.ReactNode; plantonistas: Plantonista[] }) => (
    <div className="flex-1 min-w-[250px] bg-gray-50 p-4 rounded-lg border">
      <div className="flex items-center gap-3 mb-3">
        {icone}
        <h4 className="font-bold text-lg text-gray-700">{titulo}</h4>
      </div>
      <div className="space-y-2">
        {plantonistas.length > 0 ? (
          plantonistas.map(p => (
            // --- INÍCIO DA CORREÇÃO DE LAYOUT ---
            <div key={p.ordem_plantonista} className="flex justify-between items-center text-sm gap-2">
              <span className="text-gray-500 whitespace-nowrap">Plantonista {p.ordem_plantonista}:</span>
              <span 
                className="font-semibold text-gray-800 text-right truncate"
                title={p.nome_plantonista} // Adiciona um tooltip para ver o nome completo
              >
                {p.nome_plantonista}
              </span>
            </div>
            // --- FIM DA CORREÇÃO DE LAYOUT ---
          ))
        ) : (
          <p className="text-sm text-gray-400 italic text-center py-4">
            Nenhum plantonista escalado
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Comando de Operações de Defesa Civil - CODEC
      </h3>
      <div className="flex flex-col lg:flex-row gap-6 justify-center">
        <Turno 
          titulo="Turno Diurno (7h-19h)" 
          icone={<Sun className="text-yellow-500" size={24} />} 
          plantonistas={diurno} 
        />
        <Turno 
          titulo="Turno Noturno (19h-7h)" 
          icone={<Moon className="text-indigo-500" size={24} />} 
          plantonistas={noturno} 
        />
      </div>
    </div>
  );
};

export default CodecCard;
