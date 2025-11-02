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
    return (
      <div className="surface-card flex min-h-[200px] items-center justify-center p-6">
        <Spinner className="text-tagBlue" />
      </div>
    );
  }

  return (
    <div className="surface-card p-6">
      <h3 className="mb-4 text-center text-xl font-semibold text-textMain">Aeronaves</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-center text-sm text-textSecondary">
          <thead className="border-b-2 border-borderDark/60 text-textSecondary">
            <tr className="text-textSecondary">
              <th className="p-2 font-semibold">Prefixo</th>
              <th className="p-2 font-semibold">Asa</th>
              <th className="p-2 font-semibold">1º Piloto</th>
              <th className="p-2 font-semibold">2º Piloto</th>
            </tr>
          </thead>
          <tbody>
            {data.map((aeronave, index) => (
              <tr key={index} className="border-b border-borderDark/40 last:border-none">
                <td className="p-2 font-medium text-textMain">{aeronave.prefixo}</td>
                <td className="flex items-center justify-center gap-1 p-2 text-textMain">
                  {aeronave.tipo_asa === 'rotativa' ? <Rocket size={16} /> : <Plane size={16} />}
                  <span className="capitalize text-textSecondary">{aeronave.tipo_asa}</span>
                </td>
                <td className="p-2 font-bold text-textMain">{aeronave.status === 'Baixada' ? 'Baixado' : aeronave.primeiro_piloto}</td>
                <td className="p-2 font-bold text-textMain">{aeronave.status === 'Baixada' ? 'Baixado' : aeronave.segundo_piloto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AeronavesCard;

