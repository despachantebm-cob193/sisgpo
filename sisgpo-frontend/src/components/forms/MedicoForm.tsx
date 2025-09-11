// Arquivo: frontend/src/components/forms/MedicoForm.tsx (NOVO)

import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';

interface Medico {
  id?: number;
  nome_completo: string;
  funcao: string;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface MedicoFormProps {
  medicoToEdit?: Medico | null;
  onSave: (data: Medico) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const MedicoForm: React.FC<MedicoFormProps> = ({ medicoToEdit, onSave, onCancel, isLoading }) => {
  const getInitialState = (): Medico => ({
    nome_completo: '',
    funcao: 'Médico Regulador',
    telefone: '',
    observacoes: '',
    ativo: true,
  });

  const [formData, setFormData] = useState<Medico>(getInitialState());

  useEffect(() => {
    if (medicoToEdit) {
      setFormData(medicoToEdit);
    } else {
      setFormData(getInitialState());
    }
  }, [medicoToEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        <Label htmlFor="nome_completo">Nome Completo</Label>
        <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="funcao">Função</Label>
          <Input id="funcao" name="funcao" value={formData.funcao} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" value={formData.telefone || ''} onChange={handleChange} />
        </div>
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea id="observacoes" name="observacoes" value={formData.observacoes || ''} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default MedicoForm;
