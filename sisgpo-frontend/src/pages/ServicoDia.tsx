// Arquivo: frontend/src/pages/ServicoDia.tsx (Novo Arquivo)

import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';

// Interfaces
interface Militar { id: number; nome_guerra: string; posto_graduacao: string; }
interface Servico { funcao: string; militar_id: number | null; }

const FUNCOES_ESPECIAIS = [
  "Superior de Dia", "Coordenador de Operações", "Supervisor de Dia", "Supervisor de Atendimento",
  "Alpha - 1º BBM", "Bravo - 2º BBM", "Charlie - 7º BBM", "Delta - 8º BBM",
  "Médico", "Odontólogo", "Perito", "Regulador"
];

export default function ServicoDia() {
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchMilitares = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/militares?all=true&ativo=true');
      setMilitares(response.data.data || []);
    } catch (error) {
      toast.error("Não foi possível carregar a lista de militares.");
    }
  }, []);

  const fetchServicoDoDia = useCallback(async (dataSelecionada: string) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/admin/servico-dia?data=${dataSelecionada}`);
      const servicosDaApi: Servico[] = response.data || [];
      
      // Mapeia as funções fixas e preenche com os dados da API ou com null
      const servicosFormatados = FUNCOES_ESPECIAIS.map(funcao => {
        const servicoExistente = servicosDaApi.find(s => s.funcao === funcao);
        return {
          funcao,
          militar_id: servicoExistente ? servicoExistente.militar_id : null,
        };
      });
      setServicos(servicosFormatados);
    } catch (error) {
      toast.error("Não foi possível carregar o serviço do dia.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMilitares();
  }, [fetchMilitares]);

  useEffect(() => {
    if (data) {
      fetchServicoDoDia(data);
    }
  }, [data, fetchServicoDoDia]);

  const handleSelectChange = (funcao: string, militar_id: string) => {
    setServicos(prevServicos =>
      prevServicos.map(s =>
        s.funcao === funcao ? { ...s, militar_id: militar_id ? Number(militar_id) : null } : s
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/admin/servico-dia', { data, servicos });
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
            {servicos.map(({ funcao, militar_id }) => (
              <div key={funcao}>
                <Label htmlFor={funcao}>{funcao}</Label>
                <select
                  id={funcao}
                  value={militar_id || ''}
                  onChange={(e) => handleSelectChange(funcao, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
                >
                  <option value="">Ninguém escalado</option>
                  {militares.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.posto_graduacao} {m.nome_guerra}
                    </option>
                  ))}
                </select>
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
