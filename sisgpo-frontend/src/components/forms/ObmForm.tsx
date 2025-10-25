// Arquivo: sisgpo-frontend/src/components/forms/ObmForm.tsx (CORRIGIDO)

import React, { useState, useEffect, FormEvent } from 'react';
import CreatableSelect from 'react-select/creatable';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import { ObmOption } from '../../pages/Obms'; // Importando a interface da página

// Interfaces
interface Obm {
  id?: number;
  nome: string;
  abreviatura: string; // <-- 1. CORREÇÃO (era 'sigla')
  cidade: string | null;
  telefone: string | null;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ObmFormProps {
  obmToEdit?: Obm | null;
  obmOptions: ObmOption[];
  onSave: (obm: Omit<Obm, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, obmOptions, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Omit<Obm, 'id'>>({ // Removido 'id' do estado inicial
    nome: '',
    abreviatura: '', // <-- 2. CORREÇÃO (era 'sigla')
    cidade: '',
    telefone: '',
  });

  const [internalOptions, setInternalOptions] = useState<ObmOption[]>(obmOptions);

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (obmToEdit) {
      setFormData({
        // id: obmToEdit.id, // O 'id' não faz parte do 'formData'
        nome: obmToEdit.nome,
        abreviatura: obmToEdit.abreviatura, // <-- 3. CORREÇÃO (era 'sigla')
        cidade: obmToEdit.cidade || '',
        telefone: obmToEdit.telefone || '',
      });
    } else {
      setFormData({ nome: '', abreviatura: '', cidade: '', telefone: '' }); // <-- 4. CORREÇÃO (era 'sigla')
    }
    setInternalOptions(obmOptions);
  }, [obmToEdit, obmOptions]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (selectedOption: ObmOption | null) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        nome: selectedOption.value,
        cidade: selectedOption.cidade || prev.cidade,
      }));
    } else {
      setFormData(prev => ({ ...prev, nome: '', cidade: '' }));
    }
  };

  const handleCreateOption = (inputValue: string) => {
    const newOption: ObmOption = { value: inputValue, label: inputValue, cidade: '' };
    setInternalOptions(prev => [...prev, newOption]);
    
    setFormData(prev => ({
      ...prev,
      nome: inputValue,
      cidade: '', 
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({
        ...formData,
        id: obmToEdit?.id // Adiciona o ID aqui, somente ao salvar
    });
  };

  const currentSelectValue = formData.nome ? { value: formData.nome, label: formData.nome, cidade: formData.cidade || '' } : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da OBM</Label>
        <CreatableSelect
          id="nome"
          isClearable
          options={internalOptions} 
          value={currentSelectValue}
          onChange={handleSelectChange}
          onCreateOption={handleCreateOption}
          placeholder="Selecione ou digite para criar uma OBM"
          formatCreateLabel={(inputValue) => `Criar nova OBM: "${inputValue}"`}
          isDisabled={!!obmToEdit} // Desativa o Select se estiver editando
          styles={{
            control: (base, state) => ({
              ...base,
              borderColor: getError('nome') ? '#EF4444' : (state.isFocused ? '#6366F1' : '#D1D5DB'),
              boxShadow: state.isFocused ? '0 0 0 1px #6366F1' : 'none',
              '&:hover': {
                borderColor: state.isFocused ? '#6366F1' : '#9CA3AF',
              }
            })
          }}
        />
        <FormError message={getError('nome')} />
      </div>
      <div>
        {/* --- 5. CORREÇÃO (Mapeamento de 'sigla' para 'abreviatura') --- */}
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