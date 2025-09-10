// Arquivo: frontend/src/pages/ServicoDia.tsx (VERSÃO COM BUSCA DINÂMICA)

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
  militar: { id: number; nome_completo: string; posto_graduacao: string; nome_guerra: string; };
}
interface Servico {
  funcao: string;
  militar_id: number | null;
  // Adicionamos os dados do militar para exibição no select
  militar_label?: string; 
}

// Lista de funções para garantir a ordem e a consistência
const FUNCOES_ESPECIAIS = [
  "Superior de Dia", "Coordenador de Operações", "Supervisor de Dia", "Supervisor de Atendimento",
  "Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM",
  "Médico", "Odontólogo", "Perito", "Regulador"
];

export default function ServicoDia() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Função para carregar as opções de militares dinamicamente (reutilizada)
  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) {
      return callback([]);
    }
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(response => callback(response.data))
      .catch(() => callback([]));
  };

  // Busca os dados do serviço do dia ao carregar a página ou mudar a data
  const fetchServicoDoDia = useCallback(async (dataSelecionada: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/servico-dia?data=${dataSelecionada}`);
      const servicosDaApi: { funcao: string; militar_id: number; nome_guerra: string; posto_graduacao: string; }[] = response.data || [];
      
      // Mapeia as funções fixas e preenche com os dados da API ou com valores nulos
      const servicosFormatados = FUNCOES_ESPECIAIS.map(funcao => {
        const servicoExistente = servicosDaApi.find(s => s.funcao === funcao);
        return {
          funcao,
          militar_id: servicoExistente ? servicoExistente.militar_id : null,
          // Pré-popula o label para o AsyncSelect exibir o valor inicial
          militar_label: servicoExistente ? `${servicoExistente.posto_graduacao} ${servicoExistente.nome_guerra}` : undefined,
        };
      });
      setServicos(servicosFormatados);
    } catch (error) {
      toast.error("Não foi possível carregar o serviço do dia.");
      // Inicializa com valores vazios em caso de erro
      setServicos(FUNCOES_ESPECIAIS.map(funcao => ({ funcao, militar_id: null })));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (data) {
      fetchServicoDoDia(data);
    }
  }, [data, fetchServicoDoDia]);

  // Manipulador para quando um militar é selecionado no dropdown
  const handleSelectChange = (funcao: string, selectedOption: MilitarOption | null) => {
    setServicos(prevServicos =>
      prevServicos.map(s => {
        if (s.funcao === funcao) {
          return {
            ...s,
            militar_id: selectedOption ? selectedOption.value : null,
            militar_label: selectedOption ? selectedOption.label : undefined,
          };
        }
        return s;
      })
    );
  };

  // Função para salvar as alterações
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Envia apenas os campos necessários para o backend
      const payload = {
        data,
        servicos: servicos.map(({ funcao, militar_id }) => ({ funcao, militar_id })),
      };
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
      <p className="text-gray-600 mt-2">Defina os militares para as funções especiais do dia.</p>

      <div className="my-6 max-w-xs">
        <Label htmlFor="data-servico">Data do Serviço</Label>
        <Input id="data-servico" type="date" value={data} onChange={(e) => setData(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Spinner className="h-12 w-12" /></div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {servicos.map(({ funcao, militar_id, militar_label }) => (
              <div key={funcao}>
                <Label htmlFor={funcao}>{funcao}</Label>
                <AsyncSelect
                  id={funcao}
                  cacheOptions
                  loadOptions={loadMilitarOptions}
                  defaultOptions
                  isClearable
                  placeholder="Digite para buscar..."
                  // Define o valor inicial a ser exibido
                  value={militar_id ? { value: militar_id, label: militar_label || 'Carregando...' } : null}
                  onChange={(option) => handleSelectChange(funcao, option as MilitarOption)}
                  noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum militar encontrado'}
                />
              </div>
            ))}
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
