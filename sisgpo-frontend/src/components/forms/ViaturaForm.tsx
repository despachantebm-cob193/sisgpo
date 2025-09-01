// frontend/src/components/forms/ViaturaForm.tsx
import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// --- INTERFACES CORRIGIDAS ---
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

// Esta é a nova e correta estrutura de uma Viatura
interface Viatura {
  id?: number;
  prefixo: string;
  ativa: boolean;
  obm_id: number | null;
}

// O tipo de dados que o formulário manipula
type ViaturaFormData = Viatura;

interface ViaturaFormProps {
  viaturaToEdit?: Viatura | null; // Agora espera o tipo correto
  obms: Obm[];
  onSave: (viatura: ViaturaFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: { field: string; message: string }[];
}

const ViaturaForm: React.FC<ViaturaFormProps> = ({ viaturaToEdit, obms, onSave, onCancel, isLoading, errors = [] }) => {
  
  // Estado inicial alinhado com a nova estrutura
  const getInitialState = (): ViaturaFormData => ({
    prefixo: '',
    ativa: true,
    obm_id: null,
  });

  const [formData, setFormData] = useState<ViaturaFormData>(getInitialState());

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (viaturaToEdit) {
      // Garante que apenas os campos corretos sejam usados
      setFormData({
        id: viaturaToEdit.id,
        prefixo: viaturaToEdit.prefixo,
        ativa: viaturaToEdit.ativa,
        obm_id: viaturaToEdit.obm_id,
      });
    } else {
      setFormData(getInitialState());
    }
  }, [viaturaToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : (name === 'obm_id' ? (value ? Number(value) : null) : value),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    // O formulário agora é muito mais simples
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="prefixo">Prefixo</Label>
        <Input id="prefixo" name="prefixo" value={formData.prefixo} onChange={handleChange} required hasError={!!getError('prefixo')} />
        <FormError message={getError('prefixo')} />
      </div>
      
      <div>
        <Label htmlFor="obm_id">OBM</Label>
        <select 
          id="obm_id" 
          name="obm_id" 
          value={formData.obm_id || ''} 
          onChange={handleChange} 
          required 
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${getError('obm_id') ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
        >
          <option value="">Selecione uma OBM</option>
          {obms.map(obm => (
            <option key={obm.id} value={obm.id}>{obm.abreviatura} - {obm.nome}</option>
          ))}
        </select>
        <FormError message={getError('obm_id')} />
      </div>

      <div className="flex items-center">
        <input id="ativa" name="ativa" type="checkbox" checked={formData.ativa} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <Label htmlFor="ativa" className="ml-2 mb-0">Ativa</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default ViaturaForm;
