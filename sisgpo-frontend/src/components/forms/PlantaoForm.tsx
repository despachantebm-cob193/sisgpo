// Arquivo: frontend/src/components/forms/PlantaoForm.tsx (VERSÃO CORRIGIDA)

import React, { useState, useEffect, FormEvent } from 'react';
import AsyncSelect from 'react-select/async';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';

// --- Interfaces Corrigidas ---
interface Viatura {
  id: number;
  prefixo: string;
  obm_id: number; // Propriedade que estava a faltar
}
interface MilitarOption {
  value: number;
  label: string;
  militar: { id: number; nome_completo: string; posto_graduacao: string; nome_guerra: string; };
}
interface GuarnicaoMembro {
  militar_id: number | null;
  nome_completo: string;
  posto_graduacao: string;
  funcao: string;
}
interface PlantaoFormData {
  id?: number;
  data_plantao: string;
  viatura_id: number | '';
  obm_id: number | '';
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
    militar_id: null,
    nome_completo: 'Selecione um militar...',
    posto_graduacao: '',
    funcao: '',
  });

  const getInitialFormData = (): PlantaoFormData => ({
    data_plantao: new Date().toISOString().split('T')[0],
    viatura_id: '',
    obm_id: '',
    observacoes: '',
    guarnicao: [getInitialGuarnicaoMembro()],
  });

  const [formData, setFormData] = useState<PlantaoFormData>(getInitialFormData());

  // Função para carregar as opções de militares dinamicamente
  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) {
      return callback([]);
    }
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(response => callback(response.data))
      .catch(() => callback([]));
  };

  // Manipulador para quando um militar é selecionado no dropdown
  const handleMilitarSelectChange = (index: number, selectedOption: MilitarOption | null) => {
    const novaGuarnicao = [...formData.guarnicao];
    if (selectedOption) {
      novaGuarnicao[index] = {
        ...novaGuarnicao[index],
        militar_id: selectedOption.value,
        nome_completo: selectedOption.militar.nome_completo,
        posto_graduacao: selectedOption.militar.posto_graduacao,
      };
    } else {
      novaGuarnicao[index] = getInitialGuarnicaoMembro();
    }
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const handleFuncaoChange = (index: number, value: string) => {
    const novaGuarnicao = [...formData.guarnicao];
    novaGuarnicao[index].funcao = value;
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
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
      toast.error('Verifique se todos os militares foram selecionados e se todas as funções foram preenchidas.');
      return;
    }
    const viaturaSelecionada = viaturas.find(v => v.id === formData.viatura_id);
    if (!viaturaSelecionada) {
      toast.error('Por favor, selecione uma viatura.');
      return;
    }
    const payload = {
      ...formData,
      obm_id: viaturaSelecionada.obm_id, // A linha que causava o erro, agora corrigida
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div>
                  <Label htmlFor={`militar-select-${index}`}>Buscar Militar (Nome, Guerra ou Matrícula)</Label>
                  <AsyncSelect
                    id={`militar-select-${index}`}
                    cacheOptions
                    loadOptions={loadMilitarOptions}
                    defaultOptions
                    isClearable
                    placeholder="Digite para buscar..."
                    onChange={(option) => handleMilitarSelectChange(index, option as MilitarOption)}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum militar encontrado'}
                  />
                </div>
                <div>
                  <Label htmlFor={`funcao-${index}`}>Função</Label>
                  <div className="flex items-center gap-2">
                    <Input id={`funcao-${index}`} type="text" placeholder="Ex: Motorista" value={membro.funcao} onChange={(e) => handleFuncaoChange(index, e.target.value)} required className="flex-grow" />
                    {formData.guarnicao.length > 1 && (
                      <Button type="button" onClick={() => removerMembro(index)} className="!w-auto bg-red-600 hover:bg-red-700 px-3" title="Remover Militar">
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
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
