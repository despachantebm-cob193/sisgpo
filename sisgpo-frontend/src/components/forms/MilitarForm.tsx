// Arquivo: frontend/src/components/forms/MilitarForm.tsx

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

interface Militar {
  id?: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string;
  posto_graduacao: string;
  ativo: boolean;
  obm_id: number | null;
}

interface ValidationError {
  field: string;
  message: string;
}

type MilitarFormData = Omit<Militar, 'id'> & { id?: number };

interface MilitarFormProps {
  militarToEdit?: Militar | null;
  obms: Obm[];
  onSave: (militar: MilitarFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const MilitarForm: React.FC<MilitarFormProps> = ({ militarToEdit, obms, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Militar>({
    matricula: '',
    nome_completo: '',
    nome_guerra: '',
    posto_graduacao: '',
    ativo: true,
    obm_id: null,
  });

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (militarToEdit) {
      setFormData(militarToEdit);
    } else {
      setFormData({ matricula: '', nome_completo: '', nome_guerra: '', posto_graduacao: '', ativo: true, obm_id: null });
    }
  }, [militarToEdit]);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="matricula">Matrícula</Label>
          <Input id="matricula" name="matricula" value={formData.matricula} onChange={handleChange} required hasError={!!getError('matricula')} />
          <FormError message={getError('matricula')} />
        </div>
        <div>
          <Label htmlFor="posto_graduacao">Posto/Graduação</Label>
          <Input id="posto_graduacao" name="posto_graduacao" value={formData.posto_graduacao} onChange={handleChange} required hasError={!!getError('posto_graduacao')} />
          <FormError message={getError('posto_graduacao')} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="nome_completo">Nome Completo</Label>
          <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required hasError={!!getError('nome_completo')} />
          <FormError message={getError('nome_completo')} />
        </div>
        <div>
          <Label htmlFor="nome_guerra">Nome de Guerra</Label>
          <Input id="nome_guerra" name="nome_guerra" value={formData.nome_guerra} onChange={handleChange} required hasError={!!getError('nome_guerra')} />
          <FormError message={getError('nome_guerra')} />
        </div>
        <div>
          <Label htmlFor="obm_id">OBM</Label>
          <select id="obm_id" name="obm_id" value={formData.obm_id || ''} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${getError('obm_id') ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}>
            <option value="">Selecione uma OBM</option>
            {obms.map(obm => (
              <option key={obm.id} value={obm.id}>{obm.abreviatura}</option>
            ))}
          </select>
          <FormError message={getError('obm_id')} />
        </div>
      </div>
      <div className="flex items-center">
        <input id="ativo" name="ativo" type="checkbox" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <Label htmlFor="ativo" className="ml-2 mb-0">Ativo</Label>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default MilitarForm;
