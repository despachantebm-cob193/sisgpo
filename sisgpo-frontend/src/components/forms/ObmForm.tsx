// Arquivo: sisgpo-frontend/src/components/forms/ObmForm.tsx (COMPLETO E CORRIGIDO)

import React, { useState, useEffect, FormEvent } from 'react';
import CreatableSelect from 'react-select/creatable';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import { Obm, ObmOption } from '@/types/entities'; // Importando a interface Obm principal

// Interfaces originais
interface ObmFormData extends Omit<Obm, 'id' | 'obm_id'> {} // Omitindo também obm_id se existir na interface Obm

interface ValidationError {
  field: string;
  message: string;
}

interface ObmFormProps {
  obmToEdit?: Obm | null; // Usando a interface Obm importada
  obmOptions: ObmOption[]; // Lista compartilhada de opções do select
  onSave: (obm: ObmFormData & { id?: number }) => void; // Ajustado para ObmFormData
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const normalizeOptions = (options: ObmOption[]): ObmOption[] =>
  options.map((option) => ({
    value: option.value,
    label: option.label,
    cidade: option.cidade ?? '',
  }));

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, obmOptions, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<ObmFormData>({ // Usando ObmFormData
    nome: '',
    abreviatura: '', 
    cidade: '',
    telefone: '',
    crbm: '', // <-- ADICIONADO AQUI
  });

  // Estado interno para as opções do CreatableSelect
  const [internalOptions, setInternalOptions] = useState<ObmOption[]>(normalizeOptions(obmOptions));

  // Função para buscar erros
  const getError = (field: keyof ObmFormData | 'general') => errors.find(e => e.field === field)?.message;

  // Atualiza o formulário quando obmToEdit muda
  useEffect(() => {
    if (obmToEdit) {
      setFormData({
        nome: obmToEdit.nome || '',
        abreviatura: obmToEdit.abreviatura || '', 
        cidade: obmToEdit.cidade || '',
        telefone: obmToEdit.telefone || '',
        crbm: obmToEdit.crbm || '', // <-- ADICIONADO AQUI
      });
    } else {
      // Limpa o formulário para criação
      setFormData({ nome: '', abreviatura: '', cidade: '', telefone: '', crbm: '' }); 
    }
    // Atualiza as opções internas (pode ter mudado se outra OBM foi criada)
    setInternalOptions(normalizeOptions(obmOptions)); 
  }, [obmToEdit, obmOptions]);

  // Handler genérico para inputs normais
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name as keyof ObmFormData]: value }));
  };

  // Handler para o CreatableSelect (campo nome)
  const handleSelectChange = (selectedOption: ObmOption | null) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        nome: selectedOption.value, // Atualiza o nome
        // Se a opção selecionada tiver cidade, usa ela, senão mantém a anterior
        cidade: selectedOption.cidade || prev.cidade, 
      }));
    } else {
      // Se limpar a seleção, limpa nome e cidade
      setFormData(prev => ({ ...prev, nome: '', cidade: '' })); 
    }
  };

  // Handler para criar uma nova opção no CreatableSelect
  const handleCreateOption = (inputValue: string) => {
    // Cria a nova opção
    const newOption: ObmOption = { value: inputValue, label: `Criar: "${inputValue}"`, cidade: '' };
    // Adiciona às opções internas
    setInternalOptions(prev => [...prev, newOption]); 
    
    // Define o nome e limpa a cidade no formulário
    setFormData(prev => ({
      ...prev,
      nome: inputValue, 
      cidade: '', 
    }));
  };

  // Handler para submeter o formulário
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Envia os dados do formulário + o ID (se estiver editando)
    onSave({
        ...formData,
        id: obmToEdit?.id 
    });
  };

  // Determina o valor atual para o CreatableSelect
  const currentSelectValue = formData.nome 
    ? { value: formData.nome, label: formData.nome, cidade: formData.cidade || '' } 
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Campo Nome (CreatableSelect) */}
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
          // Desabilita a seleção/criação se estiver editando (nome não pode mudar?)
          isDisabled={!!obmToEdit} 
          styles={{ // Estilos para feedback de erro
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
        {getError('nome') && <FormError message={getError('nome')} />}
      </div>

      {/* Campo Abreviatura */}
      <div>
        <Label htmlFor="abreviatura">Abreviatura</Label>
        <Input
          id="abreviatura"
          name="abreviatura"
          value={formData.abreviatura}
          onChange={handleChange}
          required // Mantém required se for o caso
          hasError={!!getError('abreviatura')} // Passa o estado de erro
        />
        {getError('abreviatura') && <FormError message={getError('abreviatura')} />}
      </div>

      {/* --- ADICIONADO CAMPO CRBM --- */}
      <div>
        <Label htmlFor="crbm">CRBM (Ex: 1º CRBM)</Label>
        <Input
          id="crbm"
          name="crbm"
          value={formData.crbm || ''} // Usa '' se for null
          onChange={handleChange}
          hasError={!!getError('crbm')} // Passa o estado de erro
        />
        {/* Exibe erro específico para crbm */}
        {getError('crbm') && <FormError message={getError('crbm')} />} 
      </div>
      {/* --- FIM DA ADIÇÃO --- */}

      {/* Campo Cidade */}
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input
          id="cidade"
          name="cidade"
          value={formData.cidade || ''} // Usa '' se for null
          onChange={handleChange}
          hasError={!!getError('cidade')} // Passa o estado de erro
        />
        {getError('cidade') && <FormError message={getError('cidade')} />}
      </div>

      {/* Campo Telefone */}
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          name="telefone"
          value={formData.telefone || ''} // Usa '' se for null
          onChange={handleChange}
          hasError={!!getError('telefone')} // Passa o estado de erro
        />
        {getError('telefone') && <FormError message={getError('telefone')} />}
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4">
        {/* Botão Cancelar */}
        <Button 
          type="button" 
          onClick={onCancel} 
          // Ajustado para usar 'default' ou remover variant se não existir
          variant="default" 
          className="bg-gray-500 hover:bg-gray-600" // Mantém estilo customizado se necessário
          disabled={isLoading} // Desabilita se estiver carregando
        >
          Cancelar
        </Button>
        {/* Botão Salvar */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default ObmForm;






