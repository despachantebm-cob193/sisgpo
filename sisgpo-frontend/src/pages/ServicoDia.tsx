// Arquivo: frontend/src/pages/ServicoDia.tsx (CORREÇÃO FINAL E COMPLETA)

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AsyncSelect from 'react-select/async';
import { MultiValue, SingleValue } from 'react-select';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';

// --- Interfaces ---
interface SelectOption {
  value: number;
  label: string;
  // Adicionamos o tipo da pessoa na própria opção para facilitar
  pessoa_type: 'militar' | 'civil'; 
}
interface Servico {
  funcao: string;
  pessoas: { id: number; label: string; type: 'militar' | 'civil' }[];
}

// --- Listas de Funções ---
const FUNCOES_MILITARES = [
  "Superior de Dia", "Coordenador de Operações", "Supervisor de Dia", "Supervisor de Atendimento",
  "Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM",
  "Perito", "Odontólogo", "Médico"
];
const FUNCOES_CIVIS = ["Regulador"];
const TODAS_AS_FUNCOES = [...FUNCOES_MILITARES, ...FUNCOES_CIVIS];
const FUNCOES_MULTI_SELECAO = TODAS_AS_FUNCOES;

export default function ServicoDia() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- CORREÇÃO 1: Funções de busca agora adicionam o 'pessoa_type' ---
  const loadMilitarOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`).then(res => {
      // Adiciona o tipo 'militar' a cada opção
      const options = res.data.map((o: any) => ({ ...o, pessoa_type: 'militar' }));
      callback(options);
    }).catch(() => callback([]));
  };

  const loadCivilOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/civis/search?term=${inputValue}`).then(res => {
      // Adiciona o tipo 'civil' a cada opção
      const options = res.data.map((o: any) => ({ ...o, pessoa_type: 'civil' }));
      callback(options);
    }).catch(() => callback([]));
  };
  // --- FIM DA CORREÇÃO 1 ---

  const fetchServicoDoDia = useCallback(async (dataSelecionada: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/servico-dia?data=${dataSelecionada}`);
      const servicosDaApi: { funcao: string; pessoa_id: number; nome_guerra: string; posto_graduacao: string; pessoa_type: 'militar' | 'civil' }[] = response.data || [];
      
      const servicosAgrupados = TODAS_AS_FUNCOES.map(funcao => {
        const pessoasNestaFuncao = servicosDaApi
          .filter(s => s.funcao === funcao)
          .map(s => ({
            id: s.pessoa_id,
            label: `${s.posto_graduacao || ''} ${s.nome_guerra || ''}`.trim(),
            type: s.pessoa_type,
          }));
        
        return {
          funcao,
          pessoas: pessoasNestaFuncao,
        };
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
    if (data) fetchServicoDoDia(data);
  }, [data, fetchServicoDoDia]);

  // --- CORREÇÃO 2: Handler de seleção agora usa o 'pessoa_type' da opção ---
  const handleSelectChange = (funcao: string, selectedOptions: MultiValue<SelectOption> | SingleValue<SelectOption>) => {
    const novasPessoas = (Array.isArray(selectedOptions) ? selectedOptions : [selectedOptions])
      .filter((opt): opt is SelectOption => opt !== null)
      .map(opt => ({
        id: opt.value,
        label: opt.label,
        type: opt.pessoa_type, // Pega o tipo diretamente da opção selecionada
      }));

    setServicos(prevServicos =>
      prevServicos.map(s => 
        s.funcao === funcao ? { ...s, pessoas: novasPessoas } : s
      )
    );
  };
  // --- FIM DA CORREÇÃO 2 ---

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payloadServicos = servicos.flatMap(s => 
        s.pessoas.map(p => ({
          funcao: s.funcao,
          pessoa_id: p.id,
          pessoa_type: p.type, // O tipo correto agora é enviado para a API
        }))
      );
      
      const payload = { data, servicos: payloadServicos };
      await api.post('/api/admin/servico-dia', payload);
      toast.success('Serviço do dia salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar o serviço do dia.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciar Serviço de Dia</h2>
      <p className="text-gray-600 mt-2">Defina os militares e civis para as funções especiais do dia.</p>

      <div className="my-6 max-w-xs">
        <Label htmlFor="data-servico">Data do Serviço</Label>
        <Input id="data-servico" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner className="h-12 w-12" /></div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicos.map(({ funcao, pessoas }) => {
              const isMulti = FUNCOES_MULTI_SELECAO.includes(funcao);
              const isCivil = FUNCOES_CIVIS.includes(funcao);
              const loadOptions = isCivil ? loadCivilOptions : loadMilitarOptions;
              const placeholder = isCivil ? "Buscar regulador(es)..." : "Buscar militar(es)...";
              
              const selectValue = pessoas.map(p => ({ value: p.id, label: p.label, pessoa_type: p.type }));

              return (
                <div key={funcao}>
                  <Label htmlFor={funcao}>{funcao}</Label>
                  <AsyncSelect
                    id={funcao}
                    isMulti={isMulti}
                    cacheOptions
                    loadOptions={loadOptions}
                    defaultOptions
                    isClearable
                    placeholder={placeholder}
                    value={isMulti ? selectValue : selectValue[0] || null}
                    onChange={(options) => handleSelectChange(funcao, options as any)}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Spinner /> : 'Salvar Alterações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
