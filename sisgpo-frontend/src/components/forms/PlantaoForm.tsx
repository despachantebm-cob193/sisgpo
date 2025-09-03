// Arquivo: frontend/src/components/forms/PlantaoForm.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';

// Interfaces
interface Viatura { id: number; prefixo: string; obm_id: number; }
interface Militar { id: number; nome_guerra: string; posto_graduacao: string; }
interface GuarnicaoMembro { militar_id: number | ''; funcao: string; }
interface PlantaoFormData {
  id?: number;
  data_plantao: string;
  viatura_id: number | '';
  obm_id: number | null;
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}
interface PlantaoDetalhado extends PlantaoFormData { id: number; }

interface PlantaoFormProps {
  plantaoToEdit?: PlantaoDetalhado | null;
  viaturas: Viatura[];
  militares: Militar[];
  onSave: (data: PlantaoFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const PlantaoForm: React.FC<PlantaoFormProps> = ({ plantaoToEdit, viaturas, militares, onSave, onCancel, isLoading }) => {
  const getInitialFormData = (): PlantaoFormData => ({
    data_plantao: new Date().toISOString().split('T')[0],
    viatura_id: '',
    obm_id: null,
    observacoes: '',
    guarnicao: [{ militar_id: '', funcao: '' }],
  });

  const [formData, setFormData] = useState<PlantaoFormData>(getInitialFormData());

  useEffect(() => {
    if (plantaoToEdit) {
      setFormData({
        ...plantaoToEdit,
        data_plantao: new Date(plantaoToEdit.data_plantao).toISOString().split('T')[0],
        guarnicao: plantaoToEdit.guarnicao.length > 0 ? plantaoToEdit.guarnicao : [{ militar_id: '', funcao: '' }],
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [plantaoToEdit]);

  const handleGuarnicaoChange = (index: number, field: keyof GuarnicaoMembro, value: string | number) => {
    const novaGuarnicao = [...formData.guarnicao];
    novaGuarnicao[index] = { ...novaGuarnicao[index], [field]: value };
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const adicionarMembro = () => setFormData(prev => ({ ...prev, guarnicao: [...prev.guarnicao, { militar_id: '', funcao: '' }] }));

  const removerMembro = (index: number) => {
    if (formData.guarnicao.length > 1) {
      const novaGuarnicao = formData.guarnicao.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
    } else {
      toast.error('A guarnição deve ter pelo menos um militar.');
    }
  };

  const handleViaturaChange = (viaturaIdStr: string) => {
    const viaturaId = Number(viaturaIdStr);
    const viaturaSelecionada = viaturas.find(v => v.id === viaturaId);
    setFormData(prev => ({
      ...prev,
      viatura_id: viaturaId,
      obm_id: viaturaSelecionada ? viaturaSelecionada.obm_id : null,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.viatura_id || !formData.obm_id) {
      toast.error('Por favor, selecione uma viatura válida.');
      return;
    }
    const guarnicaoValida = formData.guarnicao.every(m => m.militar_id && m.funcao);
    if (!guarnicaoValida) {
      toast.error('Preencha todos os campos de militar e função na guarnição.');
      return;
    }
    onSave(formData);
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
          <select id="viatura_id" value={formData.viatura_id} onChange={(e) => handleViaturaChange(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
            <option value="">Selecione uma viatura</option>
            {viaturas.map(vtr => (<option key={vtr.id} value={vtr.id}>{vtr.prefixo}</option>))}
          </select>
        </div>
      </div>
      <div>
        <Label className="mb-2">Guarnição</Label>
        <div className="space-y-3">
          {formData.guarnicao.map((membro, index) => (
            <div key={index} className="flex items-center gap-2 p-2 border rounded-md">
              <select value={membro.militar_id} onChange={(e) => handleGuarnicaoChange(index, 'militar_id', Number(e.target.value))} required className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Selecione um militar</option>
                {militares.map(m => (<option key={m.id} value={m.id}>{m.posto_graduacao} {m.nome_guerra}</option>))}
              </select>
              <Input type="text" placeholder="Função (Ex: Motorista)" value={membro.funcao} onChange={(e) => handleGuarnicaoChange(index, 'funcao', e.target.value)} required className="flex-1" />
              <Button type="button" onClick={() => removerMembro(index)} className="!w-auto bg-red-600 hover:bg-red-700 px-2 py-1" title="Remover Militar">
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" onClick={adicionarMembro} className="mt-2 !w-auto bg-green-600 hover:bg-green-700 text-sm">Adicionar Militar</Button>
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
