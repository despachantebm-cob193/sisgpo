// Arquivo: src/components/dashboard/AeronavesCard.tsx

import React from 'react';
import Spinner from '@/components/ui/Spinner';
// --- CORREÇÃO APLICADA AQUI ---
// Trocando 'Helicopter' por um ícone que existe, como 'Rocket' ou 'Plane'.
// Vamos usar 'Plane' para asa fixa e 'Rocket' como um substituto visual para asa rotativa.
import { Plane, Rocket } from 'lucide-react';

interface Aeronave {
  prefixo: string;
  tipo_asa: 'fixa' | 'rotativa';
  status: string;
  primeiro_piloto: string;
  segundo_piloto: string;
}

interface AeronavesCardProps {
  data: Aeronave[];
  isLoading: boolean;
}

const AeronavesCard: React.FC<AeronavesCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center min-h-[200px]"><Spinner /></div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">Aeronaves</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-center">
          <thead className="border-b-2">
            <tr className="text-gray-600">
              <th className="p-2 font-semibold">Prefixo</th>
              <th className="p-2 font-semibold">Asa</th>
              <th className="p-2 font-semibold">1º Piloto</th>
              <th className="p-2 font-semibold">2º Piloto</th>
            </tr>
          </thead>
          <tbody>
            {data.map((aeronave, index) => (
              <tr key={index} className="border-b last:border-none">
                <td className="p-2 font-medium">{aeronave.prefixo}</td>
                <td className="p-2 flex justify-center items-center gap-1">
                  {aeronave.tipo_asa === 'rotativa' ? <Rocket size={16} /> : <Plane size={16} />}
                  {aeronave.tipo_asa}
                </td>
                <td className="p-2 font-bold">{aeronave.status === 'Baixada' ? 'Baixado' : aeronave.primeiro_piloto}</td>
                <td className="p-2 font-bold">{aeronave.status === 'Baixada' ? 'Baixado' : aeronave.segundo_piloto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AeronavesCard;
