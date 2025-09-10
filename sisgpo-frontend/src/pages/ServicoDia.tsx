// Arquivo: frontend/src/pages/ServicoDia.tsx (VERSÃO FINAL COM BUSCA DIFERENCIADA)

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import AsyncSelect from 'react-select/async';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';

// --- Interfaces ---
interface MilitarOption {
  value: number;
  label: string;
}
interface CivilOption {
  value: number;
  label: string;
}
interface Servico {
  funcao: string;
  militar_id: number | null;
  militar_label?: string;
}

// --- Listas de Funções ---
const FUNCOES_MILITARES = [
  "Superior de Dia", "Coordenador de Operações", "Supervisor de Dia", "Supervisor de Atendimento",
  "Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM",
  "Perito", "Odontólogo"
];
const FUNCOES_CIVIS = ["Médico", "Regulador"];
const TODAS_AS_FUNCOES = [...FUNCOES_MILITARES, ...FUNCOES_CIVIS];

export default function ServicoDia() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Funções de Busca Separadas ---
  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(response => callback(response.data))
      .catch(() => callback([]));
  };

  const loadCivilOptions = (inputValue: string, callback: (options: CivilOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/civis/search?term=${inputValue}`)
      .then(response => callback(response.data))
      .catch(() => callback([]));
  };

  // Busca os dados do serviço do dia
  const fetchServicoDoDia = useCallback(async (dataSelecionada: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/servico-dia?data=${dataSelecionada}`);
      const servicosDaApi: { funcao: string; militar_id: number; nome_guerra: string; posto_graduacao: string; }[] = response.data || [];
      
      const servicosFormatados = TODAS_AS_FUNCOES.map(funcao => {
        const servicoExistente = servicosDaApi.find(s => s.funcao === funcao);
        return {
          funcao,
          militar_id: servicoExistente ? servicoExistente.militar_id : null,
          militar_label: servicoExistente ? `${servicoExistente.posto_graduacao} ${servicoExistente.nome_guerra}` : undefined,
        };
      });
      setServicos(servicosFormatados);
    } catch (error) {
      toast.error("Não foi possível carregar o serviço do dia.");
      setServicos(TODAS_AS_FUNCOES.map(funcao => ({ funcao, militar_id: null })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (data) fetchServicoDoDia(data);
  }, [data, fetchServicoDoDia]);

  // Manipulador de seleção que funciona para ambos os tipos
  const handleSelectChange = (funcao: string, selectedOption: MilitarOption | CivilOption | null) => {
    setServicos(prevServicos =>
      prevServicos.map(s => 
        s.funcao === funcao 
          ? { ...s, militar_id: selectedOption?.value ?? null, militar_label: selectedOption?.label } 
          : s
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { data, servicos: servicos.map(({ funcao, militar_id }) => ({ funcao, militar_id })) };
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
            {servicos.map(({ funcao, militar_id, militar_label }) => {
              // Determina qual função de busca usar com base na lista
              const isCivilFunction = FUNCOES_CIVIS.includes(funcao);
              const loadOptions = isCivilFunction ? loadCivilOptions : loadMilitarOptions;
              const placeholder = isCivilFunction ? "Buscar médico/regulador..." : "Buscar militar...";

              return (
                <div key={funcao}>
                  <Label htmlFor={funcao}>{funcao}</Label>
                  <AsyncSelect
                    id={funcao}
                    cacheOptions
                    loadOptions={loadOptions}
                    defaultOptions
                    isClearable
                    placeholder={placeholder}
                    value={militar_id ? { value: militar_id, label: militar_label || 'Carregando...' } : null}
                    onChange={(option) => handleSelectChange(funcao, option)}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum resultado encontrado'}
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
  