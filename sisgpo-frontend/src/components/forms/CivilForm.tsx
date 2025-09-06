import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

interface Civil {
  id?: number;
  nome_completo: string;
  apelido: string;
  ativo: boolean;
  obm_id: number | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface CivilFormProps {
  civilToEdit?: Civil | null;
  obms: Obm[];
  onSave: (civil: Omit<Civil, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const CivilForm: React.FC<CivilFormProps> = ({ civilToEdit, obms, onSave, onCancel, isLoading, errors = [] }) => {
  const getInitialState = (): Civil => ({
    nome_completo: '',
    apelido: '',
    ativo: true,
    obm_id: null,
  });

  const [formData, setFormData] = useState<Civil>(getInitialState());

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (civilToEdit) {
      setFormData(civilToEdit);
    } else {
      setFormData(getInitialState());
    }
  }, [civilToEdit]);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome_completo">Nome Completo</Label>
          <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required hasError={!!getError('nome_completo')} />
          <FormError message={getError('nome_completo')} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="apelido">Apelido</Label>
            <Input id="apelido" name="apelido" value={formData.apelido} onChange={handleChange} required hasError={!!getError('apelido')} />
            <FormError message={getError('apelido')} />
          </div>
          <div>
            <Label htmlFor="obm_id">OBM de Lotação</Label>
            <select id="obm_id" name="obm_id" value={formData.obm_id || ''} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-md shadow-sm ${getError('obm_id') ? 'border-red-500' : 'border-gray-300'}`}>
              <option value="">Selecione uma OBM</option>
              {obms.map(obm => (<option key={obm.id} value={obm.id}>{obm.abreviatura}</option>))}
            </select>
            <FormError message={getError('obm_id')} />
          </div>
        </div>
      </div>

      <div className="flex items-center">
        <input id="ativo" name="ativo" type="checkbox" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
        <Label htmlFor="ativo" className="ml-2 mb-0">Ativo</Label>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default CivilForm;
