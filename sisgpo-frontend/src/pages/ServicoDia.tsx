// Arquivo: frontend/src/pages/ServicoDia.tsx

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

export default function ServicoDia() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Gerenciar Serviço de Dia");
  }, [setPageTitle]);

  // Define o estado inicial para as datas de início e fim
  const hoje = new Date();
  const amanha = new Date(hoje);
  amanha.setDate(hoje.getDate() + 1);

  const [dataInicio, setDataInicio] = useState(hoje.toISOString().slice(0, 16));
  const [dataFim, setDataFim] = useState(amanha.toISOString().slice(0, 16));
  
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

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

  // Nova função para limpar todos os campos de seleção
  const handleClearAll = () => {
    setServicos(prev => prev.map(s => ({ ...s, pessoas: [] })));
    toast.success('Campos da escala limpos. Salve para confirmar.');
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciar Serviço de Dia</h2>
      <p className="text-gray-600 mt-2">Defina os militares e civis para as funções especiais do dia.</p>

      {/* Campos de Data de Início e Fim */}
      <div className="my-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <div>
          <Label htmlFor="data-inicio">Início do Plantão</Label>
          <Input id="data-inicio" type="datetime-local" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="data-fim">Fim do Plantão</Label>
          <Input id="data-fim" type="datetime-local" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner className="h-12 w-12" /></div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {servicos.map(({ funcao, pessoas }) => {
              const isCivil = FUNCOES_CIVIS.includes(funcao);
              const loadOptions = isCivil ? loadCivilOptions : loadMilitarOptions;
              const placeholder = isCivil ? "Buscar regulador(es)..." : "Buscar militar(es)...";
              const selectValue = pessoas.map(p => ({ value: p.id, label: p.label, pessoa_type: p.type }));

              return (
                <div key={funcao}>
                  <Label htmlFor={funcao}>{funcao}</Label>
                  <AsyncSelect
                    id={funcao}
                    isMulti
                    cacheOptions
                    loadOptions={loadOptions}
                    defaultOptions
                    isClearable
                    placeholder={placeholder}
                    value={selectValue}
                    onChange={(options) => handleSelectChange(funcao, options as any)}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            {/* Botão de Limpar */}
            <Button onClick={handleClearAll} disabled={isSaving} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar Escala
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Spinner /> : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
