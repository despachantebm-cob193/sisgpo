// Arquivo: frontend/src/components/forms/MilitarForm.tsx (Corrigido para Desnormalização)

import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// 1. Interface 'Militar' atualizada para usar 'obm_nome'
interface Militar {
  id?: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  ativo: boolean;
  obm_nome: string | null; // <-- MUDANÇA PRINCIPAL
}

interface ValidationError {
  field: string;
  message: string;
}

// 2. O tipo de dados do formulário agora também usa 'obm_nome'
type MilitarFormData = Omit<Militar, 'id'> & { id?: number };

interface MilitarFormProps {
  militarToEdit?: Militar | null;
  onSave: (militar: MilitarFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const MilitarForm: React.FC<MilitarFormProps> = ({ militarToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  // 3. Estado inicial ajustado para 'obm_nome'
  const getInitialState = (): Militar => ({
    matricula: '',
    nome_completo: '',
    nome_guerra: '',
    posto_graduacao: '',
    ativo: true,
    obm_nome: '', // <-- MUDANÇA PRINCIPAL
  });

  const [formData, setFormData] = useState<Militar>(getInitialState());

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (militarToEdit) {
      setFormData(militarToEdit);
    } else {
      setFormData(getInitialState());
    }
  }, [militarToEdit]);

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
    <form onSubmit={handleSubmit} className="space-y-6">
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
      </div>
      <div>
        <Label htmlFor="nome_completo">Nome Completo</Label>
        <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required hasError={!!getError('nome_completo')} />
        <FormError message={getError('nome_completo')} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome_guerra">Nome de Guerra (Opcional)</Label>
          <Input id="nome_guerra" name="nome_guerra" value={formData.nome_guerra || ''} onChange={handleChange} hasError={!!getError('nome_guerra')} />
          <FormError message={getError('nome_guerra')} />
        </div>
        <div>
          {/* 4. O campo de select da OBM foi substituído por um input de texto simples */}
          <Label htmlFor="obm_nome">OBM (Nome por extenso)</Label>
          <Input id="obm_nome" name="obm_nome" value={formData.obm_nome || ''} onChange={handleChange} hasError={!!getError('obm_nome')} />
          <FormError message={getError('obm_nome')} />
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

export default MilitarForm;
