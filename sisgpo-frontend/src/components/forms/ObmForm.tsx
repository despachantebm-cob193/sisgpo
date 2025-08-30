import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface ValidationError {
  field: string;
  message: string;
}
interface Obm {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  ativo: boolean;
}
type ObmFormData = Omit<Obm, 'id'> & { id?: number };

interface ObmFormProps {
  obmToEdit?: Obm | null;
  onSave: (obm: ObmFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Obm>({
    nome: '',
    abreviatura: '',
    cidade: null,
    ativo: true,
  });

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (obmToEdit) {
      setFormData(obmToEdit);
    } else {
      setFormData({ nome: '', abreviatura: '', cidade: null, ativo: true });
    }
  }, [obmToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da OBM</Label>
        <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required hasError={!!getError('nome')} />
        <FormError message={getError('nome')} />
      </div>
      <div>
        <Label htmlFor="abreviatura">Abreviatura</Label>
        <Input id="abreviatura" name="abreviatura" value={formData.abreviatura} onChange={handleChange} required hasError={!!getError('abreviatura')} />
        <FormError message={getError('abreviatura')} />
      </div>
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" name="cidade" value={formData.cidade || ''} onChange={handleChange} hasError={!!getError('cidade')} />
        <FormError message={getError('cidade')} />
      </div>
      <div className="flex items-center">
        <input id="ativo" name="ativo" type="checkbox" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <Label htmlFor="ativo" className="ml-2 mb-0">Ativa</Label>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default ObmForm;
