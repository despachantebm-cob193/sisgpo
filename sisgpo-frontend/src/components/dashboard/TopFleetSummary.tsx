import React from 'react';
import { Car, ShieldCheck } from 'lucide-react';

interface TopFleetSummaryProps {
  ativas: number | null;
  empenhadas: number | null;
  atualizadoEm: string | null;
}

const TopFleetSummary: React.FC<TopFleetSummaryProps> = ({ ativas, empenhadas, atualizadoEm }) => {
  const totalViaturas = ativas !== null ? ativas : 0;
  const totalEmpenhadas = empenhadas !== null ? empenhadas : 0;
  const percentualEmpenhadas = totalViaturas > 0 ? (totalEmpenhadas / totalViaturas) * 100 : 0;

  const isLoading = ativas === null || empenhadas === null;

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-cardSlate border border-borderDark/60 rounded-lg p-6">
      {/* Card Viaturas Ativas */}
      <section
        className="p-6 bg-background rounded-lg flex items-start gap-4"
        title="Clique para ver detalhes"
        aria-live="polite"
      >
        <div className="relative">
          <Car className="h-8 w-8 text-textSecondary" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500/50 ring-2 ring-emerald-400/60"></span>
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase text-textSecondary tracking-wider">Viaturas Ativas</h3>
          <p className="text-6xl font-bold text-textMain" aria-live="polite">
            {isLoading ? '--' : ativas}
          </p>
          <p className="text-xs text-textSecondary mt-1">
            {atualizadoEm ? `Atualizado ${atualizadoEm}` : 'Carregando...'}
          </p>
        </div>
      </section>

      {/* Card Viaturas Empenhadas */}
      <section
        className="p-6 bg-background rounded-lg flex items-start gap-4"
        title="Clique para ver detalhes"
        aria-live="polite"
      >
        <div className="relative">
          <ShieldCheck className="h-8 w-8 text-textSecondary" />
           <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500/50 ring-2 ring-purple-400/60"></span>
          </span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase text-textSecondary tracking-wider">Viaturas Empenhadas</h3>
          <p className="text-6xl font-bold text-textMain" aria-live="polite">
            {isLoading ? '--' : empenhadas}
          </p>
          <div className="w-full bg-borderDark/60 rounded-full h-2 mt-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
              style={{ width: `${percentualEmpenhadas}%` }}
            ></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TopFleetSummary;
