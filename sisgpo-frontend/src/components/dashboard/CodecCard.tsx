import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Sun, Moon, Radio, Phone, User, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface CodecCardProps {
  data: any[];
  isLoading: boolean;
  lastUpdated: string | null;
}

const CodecCard: React.FC<CodecCardProps> = ({ data, isLoading, lastUpdated }) => {
  // Filters for Day (Diurno) and Night (Noturno)
  const diurno = data?.filter(d => d.turno === 'DIURNO') || [];
  const noturno = data?.filter(d => d.turno === 'NOTURNO') || [];

  return (
    <div className="bg-[#0a0d14]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-indigo-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20">
            <Radio className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono leading-none">
              CODEC
            </h3>
            <p className="text-[10px] text-indigo-400/60 font-mono mt-0.5">Coordenação de Emergências</p>
          </div>
        </div>

        {lastUpdated && (
          <span className="text-[10px] text-slate-500 font-mono hidden sm:inline-block">
            {lastUpdated}
          </span>
        )}
      </div>

      <div className="flex-1 p-4 overflow-auto relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Spinner className="text-indigo-500 w-8 h-8" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Radio className="w-8 h-8 mb-2 opacity-20" />
            <p className="font-mono text-xs tracking-widest">SEM OPERADORES ONLINE</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
            {/* Diurno Column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                <Sun className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] font-bold text-amber-200 uppercase tracking-widest">Diurno</span>
              </div>

              {diurno.length === 0 ? (
                <div className="p-3 border border-dashed border-white/10 rounded bg-white/5 text-center">
                  <span className="text-[10px] text-slate-500">Sem escala</span>
                </div>
              ) : (
                diurno.map((item, idx) => (
                  <OperatorCard key={`d-${idx}`} item={item} color="amber" />
                ))
              )}
            </div>

            {/* Noturno Column */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 mb-1 px-1">
                <Moon className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Noturno</span>
              </div>

              {noturno.length === 0 ? (
                <div className="p-3 border border-dashed border-white/10 rounded bg-white/5 text-center">
                  <span className="text-[10px] text-slate-500">Sem escala</span>
                </div>
              ) : (
                noturno.map((item, idx) => (
                  <OperatorCard key={`n-${idx}`} item={item} color="indigo" />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Subcomponent for Operator Card
const OperatorCard = ({ item, color }: { item: any, color: 'amber' | 'indigo' }) => {
  const borderColor = color === 'amber' ? 'border-amber-500/20' : 'border-indigo-500/20';
  const bgGradient = color === 'amber' ? 'from-amber-500/5' : 'from-indigo-500/5';
  const textColor = color === 'amber' ? 'text-amber-100' : 'text-indigo-100';
  const iconColor = color === 'amber' ? 'text-amber-400' : 'text-indigo-400';

  return (
    <div className={`
             relative group p-3 rounded-lg border ${borderColor} bg-gradient-to-r ${bgGradient} to-transparent
             hover:bg-white/5 transition-all duration-300 hover:border-white/20
        `}>
      {/* Tech Decoration */}
      <div className={`absolute top-0 right-0 w-2 h-2 border-t border-r ${borderColor} rounded-tr opacity-50`} />
      <div className={`absolute bottom-0 left-0 w-2 h-2 border-b border-l ${borderColor} rounded-bl opacity-50`} />

      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-md bg-black/40 border ${borderColor}`}>
          <User className={`w-4 h-4 ${iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${textColor} truncate font-mono`}>
            {item.posto_graduacao} {item.nome_guerra}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400">{item.funcao || 'Operador'}</span>
            </div>
          </div>
          {item.telefone && (
            <div className="flex items-center gap-1 mt-1">
              <Phone className="w-3 h-3 text-emerald-500/70" />
              <span className="text-[10px] text-emerald-400 font-mono tracking-wide">{item.telefone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CodecCard;
