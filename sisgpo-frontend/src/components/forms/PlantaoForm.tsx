// frontend/src/components/forms/PlantaoForm.tsx (VERSÃO FINAL COM FEEDBACK)

import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Trash2, Search } from 'lucide-react';
import api from '../../services/api';
import Spinner from '../ui/Spinner';

// Interfaces (sem alteração)
interface Viatura { id: number; prefixo: string; }
interface GuarnicaoMembro {
  matricula: string;
  militar_id: number | null;
  nome_completo: string;
  posto_graduacao: string;
  funcao: string;
  isLoading?: boolean;
  error?: string | null; // <-- NOVO CAMPO: para armazenar a mensagem de erro
}
interface PlantaoFormData {
  id?: number;
  data_plantao: string;
  viatura_id: number | '';
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}
interface PlantaoDetalhado extends PlantaoFormData { id: number; }

interface PlantaoFormProps {
  plantaoToEdit?: PlantaoDetalhado | null;
  viaturas: Viatura[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const PlantaoForm: React.FC<PlantaoFormProps> = ({ plantaoToEdit, viaturas, onSave, onCancel, isLoading }) => {
  const getInitialGuarnicaoMembro = (): GuarnicaoMembro => ({
    matricula: '',
    militar_id: null,
    nome_completo: 'Aguardando matrícula...',
    posto_graduacao: '',
    funcao: '',
    isLoading: false,
    error: null, // <-- NOVO CAMPO: inicializado como nulo
  });

  const getInitialFormData = (): PlantaoFormData => ({
    data_plantao: new Date().toISOString().split('T')[0],
    viatura_id: '',
    observacoes: '',
    guarnicao: [getInitialGuarnicaoMembro()],
  });

  const [formData, setFormData] = useState<PlantaoFormData>(getInitialFormData());

  useEffect(() => {
    if (plantaoToEdit) {
      setFormData({
        ...plantaoToEdit,
        data_plantao: new Date(plantaoToEdit.data_plantao).toISOString().split('T')[0],
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [plantaoToEdit]);

  const handleGuarnicaoChange = (index: number, field: keyof GuarnicaoMembro, value: any) => {
    const novaGuarnicao = [...formData.guarnicao];
    (novaGuarnicao[index] as any)[field] = value;
    
    // Se a matrícula for alterada, limpa o erro anterior
    if (field === 'matricula') {
      novaGuarnicao[index].error = null;
    }

    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const handleBuscaMilitar = async (index: number) => {
    const matricula = formData.guarnicao[index].matricula;
    if (!matricula) {
      toast.error('Por favor, digite uma matrícula.');
      return;
    }

    handleGuarnicaoChange(index, 'isLoading', true);
    handleGuarnicaoChange(index, 'error', null); // Limpa erros anteriores

    try {
      const response = await api.get(`/api/admin/militares/matricula/${matricula}`);
      const militar = response.data;
      
      const novaGuarnicao = [...formData.guarnicao];
      novaGuarnicao[index] = {
        ...novaGuarnicao[index],
        militar_id: militar.id,
        nome_completo: militar.nome_completo,
        posto_graduacao: militar.posto_graduacao,
      };
      setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));

    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao buscar militar.';
      toast.error(errorMessage);
      
      // --- CORREÇÃO PRINCIPAL APLICADA AQUI ---
      // Atualiza o estado da linha específica da guarnição com a mensagem de erro
      const novaGuarnicao = [...formData.guarnicao];
      novaGuarnicao[index] = {
        ...novaGuarnicao[index],
        militar_id: null,
        nome_completo: '', // Limpa o nome
        posto_graduacao: '', // Limpa o posto
        error: 'Matrícula não encontrada', // Define a mensagem de erro
      };
      setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
      // --- FIM DA CORREÇÃO ---

    } finally {
      handleGuarnicaoChange(index, 'isLoading', false);
    }
  };

  const adicionarMembro = () => setFormData(prev => ({ ...prev, guarnicao: [...prev.guarnicao, getInitialGuarnicaoMembro()] }));
  const removerMembro = (index: number) => {
    if (formData.guarnicao.length > 1) {
      setFormData(prev => ({ ...prev, guarnicao: prev.guarnicao.filter((_, i) => i !== index) }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const guarnicaoValida = formData.guarnicao.every(m => m.militar_id && m.funcao);
    if (!guarnicaoValida) {
      toast.error('Verifique se todos os militares foram encontrados (via matrícula) e se todas as funções foram preenchidas.');
      return;
    }
    
    const payload = {
      ...formData,
      guarnicao: formData.guarnicao.map(({ militar_id, funcao }) => ({ militar_id, funcao })),
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data_plantao">Data do Plantão</Label>
          <Input id="data_plantao" type="date" value={formData.data_plantao} onChange={(e) => setFormData(prev => ({ ...prev, data_plantao: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="viatura_id">Viatura</Label>
          <select id="viatura_id" value={formData.viatura_id} onChange={(e) => setFormData(prev => ({ ...prev, viatura_id: Number(e.target.value) }))} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Selecione uma viatura</option>
            {viaturas.map(vtr => (<option key={vtr.id} value={vtr.id}>{vtr.prefixo}</option>))}
          </select>
        </div>
      </div>
      <div>
        <Label className="mb-2">Guarnição</Label>
        <div className="space-y-4">
          {formData.guarnicao.map((membro, index) => (
            <div key={index} className="p-3 border rounded-lg space-y-3 bg-gray-50">
              <div className="flex items-end gap-2">
                <div className="flex-grow">
                  <Label htmlFor={`matricula-${index}`}>Matrícula (RG)</Label>
                  <Input id={`matricula-${index}`} type="text" placeholder="Digite a matrícula" value={membro.matricula} onChange={(e) => handleGuarnicaoChange(index, 'matricula', e.target.value)} />
                </div>
                <Button type="button" onClick={() => handleBuscaMilitar(index)} className="!w-auto px-3" disabled={membro.isLoading}>
                  {membro.isLoading ? <Spinner className="h-5 w-5" /> : <Search className="w-5 h-5" />}
                </Button>
                {formData.guarnicao.length > 1 && (
                  <Button type="button" onClick={() => removerMembro(index)} className="!w-auto bg-red-600 hover:bg-red-700 px-3" title="Remover Militar">
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Militar</Label>
                  {/* --- RENDERIZAÇÃO CONDICIONAL DO FEEDBACK --- */}
                  <div className={`h-10 flex items-center px-3 rounded-md text-sm ${membro.error ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-700'}`}>
                    {membro.error ? (
                      <span>{membro.error}</span>
                    ) : (
                      <span>{membro.posto_graduacao} {membro.nome_completo}</span>
                    )}
                  </div>
                  {/* --- FIM DA RENDERIZAÇÃO CONDICIONAL --- */}
                </div>
                <div>
                  <Label htmlFor={`funcao-${index}`}>Função</Label>
                  <Input id={`funcao-${index}`} type="text" placeholder="Ex: Motorista" value={membro.funcao} onChange={(e) => handleGuarnicaoChange(index, 'funcao', e.target.value)} required />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" onClick={adicionarMembro} className="mt-3 !w-auto bg-green-600 hover:bg-green-700 text-sm">Adicionar Militar à Guarnição</Button>
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea id="observacoes" value={formData.observacoes} onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Plantão'}</Button>
      </div>
    </form>
  );
};

export default PlantaoForm;
