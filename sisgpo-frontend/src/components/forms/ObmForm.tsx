// Arquivo: frontend/src/components/forms/ObmForm.tsx

import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface Obm {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  telefone: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ObmFormProps {
  obmToEdit?: Obm | null;
  onSave: (obm: Omit<Obm, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Obm>({
    nome: '',
    abreviatura: '',
    cidade: '',
    telefone: '',
  });

  // Função para encontrar erro de um campo específico
  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (obmToEdit) {
      setFormData({
        id: obmToEdit.id,
        nome: obmToEdit.nome,
        abreviatura: obmToEdit.abreviatura,
        cidade: obmToEdit.cidade || '',
        telefone: obmToEdit.telefone || '',
      });
    } else {
      // Reseta para o estado inicial limpo ao criar um novo
      setFormData({ nome: '', abreviatura: '', cidade: '', telefone: '' });
    }
  }, [obmToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da OBM</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleChange}
          required
          hasError={!!getError('nome')}
        />
        <FormError message={getError('nome')} />
      </div>
      <div>
        <Label htmlFor="abreviatura">Abreviatura</Label>
        <Input
          id="abreviatura"
          name="abreviatura"
          value={formData.abreviatura}
          onChange={handleChange}
          required
          hasError={!!getError('abreviatura')}
        />
        <FormError message={getError('abreviatura')} />
      </div>
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input
          id="cidade"
          name="cidade"
          value={formData.cidade || ''}
          onChange={handleChange}
          hasError={!!getError('cidade')}
        />
        <FormError message={getError('cidade')} />
      </div>
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          value={formData.telefone || ''}
          onChange={handleChange}
          hasError={!!getError('telefone')}
        />
        <FormError message={getError('telefone')} />
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
