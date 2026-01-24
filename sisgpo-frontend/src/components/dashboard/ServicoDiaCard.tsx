import React from 'react';
import Spinner from '@/components/ui/Spinner';
import { Award, Star, Shield, Phone, ClipboardCheck, Building, Stethoscope } from 'lucide-react';

interface ServicoInfo {
  funcao: string;
  nome_guerra: string | null;
  posto_graduacao: string | null;
  telefone: string | null;
}

interface ServicoDiaCardProps {
  data: ServicoInfo[];
  isLoading: boolean;
}

// Configuração atualizada com cores Neon para o tema Sci-Fi
const funcoesConfig: { [key: string]: { icon: React.ReactNode; title: string } } = {
  "Coordenador de Operações": { icon: <Star className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" />, title: "COORD. OPERAÇÕES" },
  "Superior de Dia": { icon: <Star className="text-amber-400" />, title: "SUPERIOR DE DIA" },
  "Supervisor de Dia": { icon: <Shield className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />, title: "SUP. DE DIA" },
  "Supervisor de Atendimento": { icon: <Phone className="text-emerald-400" />, title: "SUP. ATENDIMENTO" },
  "Alpha - 1º BBM": { icon: <Building className="text-slate-400" />, title: "ALPHA" },
  "Bravo - 2º BBM": { icon: <Building className="text-slate-400" />, title: "BRAVO" },
  "Charlie - 7º BBM": { icon: <Building className="text-slate-400" />, title: "CHARLIE" },
  "Delta - 8º BBM": { icon: <Building className="text-slate-400" />, title: "DELTA" },
  "Médico": { icon: <Stethoscope className="text-rose-400" />, title: "MÉDICO" },
  "Regulador": { icon: <ClipboardCheck className="text-blue-400" />, title: "REGULADOR" },
  "Odontólogo": { icon: <Stethoscope className="text-cyan-300" />, title: "ODONTÓLOGO" },
  "Perito": { icon: <Award className="text-purple-400" />, title: "PERITO" },
};

const ServicoDiaCard: React.FC<ServicoDiaCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-[#0a0d14]/60 backdrop-blur-md p-6 rounded-xl border border-white/5 flex justify-center items-center min-h-[200px]">
        <Spinner className="h-12 w-12 text-cyan-500" />
      </div>
    );
  }

  const safeData = Array.isArray(data) ? data : [];
  const profissionaisPorFuncao = safeData.reduce((acc, servico) => {
    const { funcao } = servico;
    if (!acc[funcao]) {
      acc[funcao] = [];
    }
    acc[funcao].push(servico);
    return acc;
  }, {} as { [key: string]: ServicoInfo[] });

  const renderLinha = (funcoes: string[]) => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {funcoes.map(keyConfig => {
        const funcaoDataKey = Object.keys(profissionaisPorFuncao).find(
          k => k.trim().toLowerCase() === keyConfig.trim().toLowerCase()
        );

        const profissionais = funcaoDataKey ? profissionaisPorFuncao[funcaoDataKey] : [];
        const config = funcoesConfig[keyConfig];

        return (
          <div key={keyConfig} className="relative group overflow-hidden rounded-lg bg-[#0e121b] border border-white/5 p-4 hover:border-cyan-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)] flex flex-col items-center text-center">

            {/* Header do Card Item */}
            <div className="flex items-center gap-2 mb-3 z-10 w-full justify-center">
              {config.icon}
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{config.title}</p>
            </div>

            {/* Conteúdo */}
            <div className="w-full z-10 flex flex-col items-center">
              {profissionais.length > 0 ? (
                profissionais.map((p, index) => (
                  <div key={index} className="flex flex-col items-center w-full">
                    <span
                      className="text-sm font-bold text-white tracking-wide font-mono w-full text-center whitespace-normal break-words leading-tight px-1"
                      title={`${p.posto_graduacao || ''} ${p.nome_guerra || ''}`.trim()}
                    >
                      {`${p.posto_graduacao || ''} ${p.nome_guerra || ''}`.trim()}
                    </span>
                    {p.telefone && <span className="text-[10px] font-mono text-cyan-500/70 mt-1 bg-cyan-900/10 px-2 py-0.5 rounded border border-cyan-500/10 mb-1">{p.telefone}</span>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-700 italic font-mono">- Sem escala -</p>
              )}
            </div>

            {/* Hover Glow Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-[#0a0d14]/80 backdrop-blur-md p-3 md:p-8 rounded-xl md:rounded-2xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden w-full max-w-full box-border">
      {/* Top Neon accent */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-80" />

      <div className="flex items-center justify-center gap-2 md:gap-3 mb-4 md:mb-8 px-2">
        <Shield className="w-4 h-4 md:w-6 md:h-6 text-cyan-400 animate-pulse-slow shrink-0" />
        <h3 className="text-sm md:text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 tracking-wider md:tracking-[0.2em] uppercase text-center break-words">
          Escala Oficial
        </h3>
        <Shield className="w-4 h-4 md:w-6 md:h-6 text-cyan-400 animate-pulse-slow shrink-0" />
      </div>

      <div className="space-y-4 md:space-y-6">
        {renderLinha(["Coordenador de Operações", "Superior de Dia", "Supervisor de Dia", "Supervisor de Atendimento"])}

        {/* Divider Metallic */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

        {renderLinha(["Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM"])}

        {/* Divider Metallic */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />

        {renderLinha(["Médico", "Regulador", "Odontólogo", "Perito"])}
      </div>
    </div>
  );
};

export default ServicoDiaCard;
