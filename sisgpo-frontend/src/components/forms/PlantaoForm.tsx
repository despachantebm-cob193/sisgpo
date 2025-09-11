// Arquivo: frontend/src/components/forms/PlantaoForm.tsx (VERSÃO COM LAYOUT CORRIGIDO)

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import AsyncSelect from 'react-select/async';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';

// Importando os tipos do arquivo da página para garantir consistência
import { Viatura, PlantaoDetalhado } from '../../pages/Plantoes';

// --- Interfaces específicas para o formulário ---
interface Militar {
  id: number;
  nome_completo: string;
  posto_graduacao: string;
  nome_guerra: string;
  telefone: string | null;
}
interface MilitarOption {
  value: number;
  label: string;
  militar: Militar;
}
interface GuarnicaoMembro {
  militar_id: number | null;
  nome_completo: string;
  posto_graduacao: string;
  funcao: string;
  telefone: string;
}
interface PlantaoFormData {
  id?: number;
  data_plantao: string;
  viatura_id: number | '';
  obm_id: number | '';
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}

interface PlantaoFormProps {
  plantaoToEdit?: PlantaoDetalhado | null;
  viaturas: Viatura[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

// Função de máscara para o telefone
const formatarTelefoneInput = (value: string): string => {
  if (!value) return '';
  const digitos = value.replace(/\D/g, '');
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6, 10)}`;
};

const PlantaoForm: React.FC<PlantaoFormProps> = ({ plantaoToEdit, viaturas, onSave, onCancel, isLoading }) => {
  const getInitialGuarnicaoMembro = (): GuarnicaoMembro => ({
    militar_id: null,
    nome_completo: 'Selecione um militar...',
    posto_graduacao: '',
    funcao: '',
    telefone: '',
  });

  const getInitialFormData = (): PlantaoFormData => ({
    data_plantao: new Date().toISOString().split('T')[0],
    viatura_id: '',
    obm_id: '',
    observacoes: '',
    guarnicao: [getInitialGuarnicaoMembro()],
  });

  const [formData, setFormData] = useState<PlantaoFormData>(getInitialFormData());

  useEffect(() => {
    if (plantaoToEdit) {
      setFormData({
        id: plantaoToEdit.id,
        data_plantao: new Date(plantaoToEdit.data_plantao).toISOString().split('T')[0],
        viatura_id: plantaoToEdit.viatura_id,
        obm_id: plantaoToEdit.obm_id,
        observacoes: plantaoToEdit.observacoes,
        guarnicao: plantaoToEdit.guarnicao.map(m => ({
          militar_id: m.militar_id,
          nome_completo: `${m.posto_graduacao} ${m.nome_guerra}`,
          posto_graduacao: m.posto_graduacao,
          funcao: m.funcao,
          telefone: m.telefone ? formatarTelefoneInput(m.telefone) : '',
        })),
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [plantaoToEdit]);

  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(res => callback(res.data))
      .catch(() => callback([]));
  };

  const handleMilitarSelectChange = (index: number, selectedOption: MilitarOption | null) => {
    const novaGuarnicao = [...formData.guarnicao];
    if (selectedOption) {
      novaGuarnicao[index] = {
        ...novaGuarnicao[index],
        militar_id: selectedOption.value,
        nome_completo: selectedOption.militar.nome_completo,
        posto_graduacao: selectedOption.militar.posto_graduacao,
        telefone: selectedOption.militar.telefone ? formatarTelefoneInput(selectedOption.militar.telefone) : '',
      };
    } else {
      novaGuarnicao[index] = getInitialGuarnicaoMembro();
    }
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const handleGuarnicaoInputChange = (index: number, field: 'funcao' | 'telefone', value: string) => {
    const novaGuarnicao = [...formData.guarnicao];
    if (field === 'telefone') {
      novaGuarnicao[index][field] = formatarTelefoneInput(value);
    } else {
      novaGuarnicao[index][field] = value;
    }
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
      obm_id: viaturaSelecionada.obm_id,
      guarnicao: formData.guarnicao.map(({ militar_id, funcao, telefone }) => ({
        militar_id,
        funcao,
        telefone: telefone.replace(/\D/g, ''),
      })),
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção de Data e Viatura (permanece no topo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data_plantao">Data do Plantão</Label>
          <Input id="data_plantao" type="date" value={formData.data_plantao} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, data_plantao: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="viatura_id">Viatura</Label>
          <select id="viatura_id" value={formData.viatura_id} onChange={(e: ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, viatura_id: Number(e.target.value) }))} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Selecione uma viatura</option>
            {viaturas.map(vtr => (<option key={vtr.id} value={vtr.id}>{vtr.prefixo}</option>))}
          </select>
        </div>
      </div>

      {/* Seção da Guarnição */}
      <div>
        <Label className="mb-2">Guarnição</Label>
        <div className="space-y-4">
          {formData.guarnicao.map((membro, index) => (
            <div key={index} className="p-4 border rounded-lg bg-gray-50 relative">
              {/* --- LAYOUT VERTICAL PARA CADA MEMBRO --- */}
              <div className="space-y-4">
                {/* Linha 1: Busca Militar */}
                <div>
                  <Label htmlFor={`militar-select-${index}`}>Buscar Militar</Label>
                  <AsyncSelect
                    id={`militar-select-${index}`}
                    cacheOptions
                    loadOptions={loadMilitarOptions}
                    defaultOptions
                    isClearable
                    placeholder="Nome, guerra ou matrícula..."
                    value={membro.militar_id ? { value: membro.militar_id, label: membro.nome_completo } : null}
                    onChange={(option) => handleMilitarSelectChange(index, option as MilitarOption)}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum militar encontrado'}
                  />
                </div>

                {/* Linha 2: Telefone e Função */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`telefone-${index}`}>Telefone</Label>
                    <Input
                      id={`telefone-${index}`}
                      type="text"
                      placeholder="(XX) XXXX-XXXX"
                      value={membro.telefone}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleGuarnicaoInputChange(index, 'telefone', e.target.value)}
                      maxLength={14}
                      disabled={!membro.militar_id}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`funcao-${index}`}>Função</Label>
                    <Input id={`funcao-${index}`} type="text" placeholder="Ex: Motorista" value={membro.funcao} onChange={(e: ChangeEvent<HTMLInputElement>) => handleGuarnicaoInputChange(index, 'funcao', e.target.value)} required />
                  </div>
                </div>
              </div>
              {/* --- FIM DO LAYOUT VERTICAL --- */}

              {/* Botão de remover */}
              {formData.guarnicao.length > 1 && (
                <div className="absolute top-2 right-2">
                  <Button type="button" onClick={() => removerMembro(index)} className="!w-auto !p-2 bg-red-600 hover:bg-red-700" title="Remover Militar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button type="button" onClick={adicionarMembro} className="mt-3 !w-auto bg-green-600 hover:bg-green-700 text-sm">Adicionar Militar à Guarnição</Button>
      </div>

      {/* Seção de Observações */}
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea id="observacoes" value={formData.observacoes} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Plantão'}</Button>
      </div>
    </form>
  );
};

export default PlantaoForm;
