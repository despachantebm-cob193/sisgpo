// Arquivo: frontend/src/pages/ServicoDia.tsx (CORRIGIDO)

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AsyncSelect from 'react-select/async';
import { MultiValue, SingleValue } from 'react-select';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import { Trash2 } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import ConfirmationModal from '../components/ui/ConfirmationModal'; // Importe o modal
import ServicoDiaCard from '../components/dashboard/ServicoDiaCard';

// Interfaces
interface SelectOption {
  value: number;
  label: string;
  pessoa_type: 'militar' | 'civil';
}
interface Servico {
  funcao: string;
  pessoas: { id: number; label: string; type: 'militar' | 'civil' }[];
}

// Listas de Funções
const FUNCOES_MILITARES = [
  "Superior de Dia", "Coordenador de Operações", "Supervisor de Dia", "Supervisor de Atendimento",
  "Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM",
  "Perito", "Odontólogo", "Médico"
];
const FUNCOES_CIVIS = ["Regulador"];
const TODAS_AS_FUNCOES = [...FUNCOES_MILITARES, ...FUNCOES_CIVIS];

const customSelectStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: '#0f141e',
    borderColor: state.isFocused ? '#22d3ee' : 'rgba(51, 65, 85, 0.5)',
    boxShadow: state.isFocused ? '0 0 0 1px #22d3ee' : 'none',
    color: '#e2e8f0',
    '&:hover': {
      borderColor: state.isFocused ? '#22d3ee' : 'rgba(34, 211, 238, 0.3)',
    },
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: '#0f141e',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isFocused ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
    color: state.isFocused ? '#22d3ee' : '#e2e8f0',
    cursor: 'pointer',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#64748b',
    fontSize: '0.875rem',
    fontFamily: 'monospace'
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#e2e8f0',
    fontFamily: 'monospace'
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: 'rgba(34, 211, 238, 0.1)',
    border: '1px solid rgba(34, 211, 238, 0.2)',
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: '#22d3ee',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    textTransform: 'uppercase'
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: '#22d3ee',
    ':hover': {
      backgroundColor: 'rgba(34, 211, 238, 0.2)',
      color: '#22d3ee',
    },
  }),
  input: (provided: any) => ({
    ...provided,
    color: '#e2e8f0',
  }),
};

export default function ServicoDia() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

  useEffect(() => {
    setPageTitle("Gerenciar Serviço de Dia");
  }, [setPageTitle]);

  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  const [dataInicio, setDataInicio] = useState(hoje.toISOString().slice(0, 16));
  const [dataFim, setDataFim] = useState(amanha.toISOString().slice(0, 16));

  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Estados do Modal e Deleção
  const [isDeleting, setIsDeleting] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);


  // Funções de busca de militares e civis (sem alteração)
  const loadMilitarOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`).then(res => {
      const options = res.data.map((o: any) => ({ ...o, pessoa_type: 'militar' }));
      callback(options);
    }).catch(() => callback([]));
  };

  const loadCivilOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    // NOTA: Verifique se a rota '/api/admin/civis' existe ou se foi renomeada para '/api/admin/medicos'
    api.get(`/api/admin/civis/search?term=${inputValue}`).then(res => {
      const options = res.data.map((o: any) => ({ ...o, pessoa_type: 'civil' }));
      callback(options);
    }).catch(() => callback([]));
  };

  // Busca os dados com base na data de início
  const fetchServicoDoDia = useCallback(async (dataSelecionada: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/servico-dia?data=${new Date(dataSelecionada).toISOString()}`);
      const servicosDaApi: { funcao: string; pessoa_id: number; nome_guerra: string; posto_graduacao: string; pessoa_type: 'militar' | 'civil' }[] = response.data || [];

      const servicosAgrupados = TODAS_AS_FUNCOES.map(funcao => {
        const pessoasNestaFuncao = servicosDaApi
          .filter(s => s.funcao === funcao)
          .map(s => ({
            id: s.pessoa_id,
            label: `${s.posto_graduacao || ''} ${s.nome_guerra || ''}`.trim(),
            type: s.pessoa_type,
          }));

        return { funcao, pessoas: pessoasNestaFuncao };
      });
      setServicos(servicosAgrupados);
    } catch (error) {
      toast.error("Não foi possível carregar o serviço do dia.");
      setServicos(TODAS_AS_FUNCOES.map(funcao => ({ funcao, pessoas: [] })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (dataInicio) fetchServicoDoDia(dataInicio);
  }, [dataInicio, fetchServicoDoDia]);

  const handleSelectChange = (funcao: string, selectedOptions: MultiValue<SelectOption> | SingleValue<SelectOption>) => {
    const novasPessoas = (Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions])
      .filter((opt): opt is SelectOption => opt !== null)
      .map(opt => ({ id: opt.value, label: opt.label, type: opt.pessoa_type }));

    setServicos(prevServicos =>
      prevServicos.map(s => s.funcao === funcao ? { ...s, pessoas: novasPessoas } : s)
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadServicos = servicos.flatMap(s =>
        s.pessoas.map(p => ({ funcao: s.funcao, pessoa_id: p.id, pessoa_type: p.type }))
      );

      const payload = { data_inicio: dataInicio, data_fim: dataFim, servicos: payloadServicos };
      await api.post('/api/admin/servico-dia', payload);
      toast.success('Serviço do dia salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar o serviço do dia.');
    } finally {
      setIsSaving(false);
    }
  };

  // Função que APENAS abre o modal
  const handleOpenClearModal = () => {
    setIsClearModalOpen(true);
  };

  // Função que será chamada ao confirmar a deleção
  const handleConfirmClear = async () => {
    setIsDeleting(true);
    try {
      // Chama a nova rota DELETE, passando a data de início como parâmetro
      await api.delete('/api/admin/servico-dia', {
        params: {
          data: new Date(dataInicio).toISOString()
        }
      });

      // Limpa o estado local para refletir a mudança
      setServicos(prev => prev.map(s => ({ ...s, pessoas: [] })));
      toast.success('Escala limpa com sucesso do sistema e do Dashboard.');

    } catch (error) {
      toast.error('Erro ao limpar a escala.');
    } finally {
      setIsDeleting(false);
      setIsClearModalOpen(false); // Fecha o modal
    }
  };


  return (
    <div>
      <p className="text-slate-400 mt-2 font-mono text-sm max-w-3xl">
        <span className="text-cyan-400 mr-2">::</span>
        Defina os militares e civis para as funções especiais do dia. Use os seletores abaixo.
      </p>

      {/* Campos de Data de Início e Fim */}
      <div className="my-8 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl bg-[#0a0d14]/50 p-6 rounded-xl border border-white/5">
        <div>
          <Label htmlFor="data-inicio">Início do Plantão</Label>
          <Input id="data-inicio" type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} disabled={!isAdmin} />
        </div>
        <div>
          <Label htmlFor="data-fim">Fim do Plantão</Label>
          <Input id="data-fim" type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} disabled={!isAdmin} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner className="h-12 w-12 text-cyan-500" /></div>
      ) : (
        <div className="bg-[#0a0d14]/80 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          {/* Decorative Top Line */}
          <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent mb-8" />

          <div className="grid grid-cols-1 gap-x-6 gap-y-8 md:grid-cols-2 lg:grid-cols-4">
            {servicos.map(({ funcao, pessoas }) => {
              const isCivil = FUNCOES_CIVIS.includes(funcao);
              const loadOptions = isCivil ? loadCivilOptions : loadMilitarOptions;
              const placeholder = isCivil ? "Buscar regulador(es)..." : "Buscar militar(es)...";
              const selectValue = pessoas.map(p => ({ value: p.id, label: p.label, pessoa_type: p.type }));

              return (
                <div key={funcao}>
                  <Label htmlFor={funcao} className="text-cyan-500/80 mb-2 block text-xs font-bold uppercase tracking-wider">{funcao}</Label>
                  <AsyncSelect
                    id={funcao}
                    isMulti
                    cacheOptions
                    loadOptions={loadOptions}
                    defaultOptions
                    isClearable={isAdmin}
                    isDisabled={!isAdmin}
                    placeholder={placeholder}
                    value={selectValue}
                    onChange={(options) => handleSelectChange(funcao, options as any)}
                    styles={customSelectStyles}
                  />
                </div>
              );
            })}
          </div>
          {isAdmin && (
            <div className="mt-10 pt-6 border-t border-white/5 flex justify-end gap-4">
              {/* Botão de Limpar */}
              <Button
                onClick={handleOpenClearModal}
                disabled={isSaving || isDeleting}
                className="!bg-rose-500/10 !border !border-rose-500/30 !text-rose-400 hover:!bg-rose-500/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? <Spinner /> : 'Limpar Escala'}
              </Button>
              <Button onClick={handleSave} disabled={isSaving || isDeleting} className="!bg-cyan-500/10 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/20 hover:!shadow-[0_0_15px_rgba(34,211,238,0.4)]">
                {isSaving ? <Spinner /> : 'Salvar Alterações'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* --- INÍCIO DA CORREÇÃO --- */}
      {/* A propriedade 'confirmButtonText' foi removida */}
      <ConfirmationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClear}
        title="Limpar Escala do Dia"
        message="Tem certeza que deseja limpar esta escala? Esta ação é irreversível e removerá todos os dados do Dashboard para este plantão."
        isLoading={isDeleting}
      />
      {/* --- FIM DA CORREÇÃO --- */}

      {/* --- PREVIEW DO DASHBOARD (ESPELHO) --- */}
      <div className="mt-12">
        <h2 className="text-lg font-semibold text-white mb-4">Pré-visualização do Dashboard</h2>
        <div className="opacity-90 hover:opacity-100 transition-opacity">
          <ServicoDiaCard
            isLoading={isLoading}
            data={servicos.flatMap(s =>
              s.pessoas.map(p => {
                // Tenta extrair posto e nome do label (ex: "MAJ FULANO")
                // Se o label for "MAJ FULANO", posto="MAJ", nome="FULANO" aproximadamente
                // Mas como é preview, usamos o label completo como nome_guerra se não conseguirmos separar
                // O ideal seria ter o objeto militar completo, mas aqui temos apenas {id, label, type}
                // Vamos tentar uma heuristica simples ou mostrar label inteiro

                const parts = p.label.split(' ');
                const posto = parts[0];
                const nome = parts.slice(1).join(' ');

                return {
                  funcao: s.funcao,
                  posto_graduacao: posto, // Aproximacao para preview
                  nome_guerra: nome || p.label, // Fallback
                  telefone: null // Nao temos telefone no select option
                };
              })
            )}
          />
        </div>
        <p className="text-xs text-center text-textSecondary mt-2">
          * Esta é uma pré-visualização baseada nos dados do formulário. Telefones e detalhes adicionais aparecerão no Dashboard oficial após salvar.
        </p>
      </div>
    </div>
  );
}
