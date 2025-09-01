import React, { useState, useEffect, FormEvent, useMemo } from 'react';
import Select from 'react-select';
import toast from 'react-hot-toast';

import api from '../../services/api';
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
interface Contato {
  obm_local: string;
  secao_departamento: string;
  telefone: string;
}
interface ValidationError {
  field: string;
  message: string;
}
type ObmFormData = Omit<Obm, 'id'> & { id?: number };
interface ObmFormProps {
  obmToEdit?: Obm | null;
  onSave: (obm: ObmFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}
interface SelectOption {
  value: string;
  label: string;
}

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Obm>({
    nome: '',
    abreviatura: '',
    cidade: null,
    telefone: null,
  });

  const [opcoesBase, setOpcoesBase] = useState<SelectOption[]>([]);
  const [listaContatos, setListaContatos] = useState<Contato[]>([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const [resNomes, resContatos] = await Promise.all([
          api.get<string[]>('/api/admin/contatos/obms-unicas'),
          api.get<{ data: Contato[] }>('/api/admin/contatos')
        ]);
        
        const nomes = resNomes.data || [];
        setOpcoesBase(nomes.map(nome => ({ value: nome, label: nome })));
        setListaContatos(resContatos.data.data || []);
      } catch (error) {
        toast.error('Não foi possível carregar as opções de OBMs.');
      }
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (obmToEdit) {
      setFormData(obmToEdit);
    } else {
      setFormData({ nome: '', abreviatura: '', cidade: null, telefone: null });
    }
  }, [obmToEdit]);

  const opcoesCompletas = useMemo(() => {
    const todasOpcoes = [...opcoesBase];
    if (formData.nome && !opcoesBase.some(opt => opt.value === formData.nome)) {
      todasOpcoes.unshift({ value: formData.nome, label: formData.nome });
    }
    return todasOpcoes;
  }, [opcoesBase, formData.nome]);

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA DE PREENCHIMENTO AUTOMÁTICO CORRIGIDA ---
  const handleNomeChange = (selectedOption: SelectOption | null) => {
    if (selectedOption) {
      const nomeSelecionado = selectedOption.value;
      const contatoCorrespondente = listaContatos.find(c => c.obm_local === nomeSelecionado);

      setFormData(prev => ({
        ...prev, // <<<--- A CORREÇÃO ESTÁ AQUI: Preserva todos os campos antigos, incluindo o ID
        nome: nomeSelecionado,
        abreviatura: contatoCorrespondente?.secao_departamento || '',
        telefone: contatoCorrespondente?.telefone || '',
        // Mantém a cidade que já existia, pois ela não vem da lista de contatos
        cidade: prev.cidade || '',
      }));
    } else {
      // Limpa o formulário, mas preserva o ID se estivermos editando
      setFormData(prev => ({
        id: prev.id, // Preserva o ID
        nome: '',
        abreviatura: '',
        cidade: null,
        telefone: null,
      }));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.nome.trim()) {
      toast.error('O nome da OBM é obrigatório.');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da OBM (pesquisável)</Label>
        <Select
          id="nome"
          name="nome"
          options={opcoesCompletas}
          value={opcoesCompletas.find(option => option.value === formData.nome) || null}
          onChange={handleNomeChange}
          isClearable
          placeholder="Digite para buscar ou selecionar uma OBM..."
          noOptionsMessage={() => 'Nenhuma OBM encontrada'}
          styles={{
            control: (base, state) => ({
              ...base,
              borderColor: getError('nome') ? 'rgb(239 68 68)' : state.isFocused ? 'rgb(99 102 241)' : 'rgb(209 213 219)',
              boxShadow: state.isFocused ? '0 0 0 1px rgb(99 102 241)' : 'none',
              '&:hover': {
                borderColor: state.isFocused ? 'rgb(99 102 241)' : 'rgb(156 163 175)',
              }
            }),
          }}
        />
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
      <div>
        <Label htmlFor="telefone">Telefone</Label>
        <Input id="telefone" name="telefone" value={formData.telefone || ''} onChange={handleChange} hasError={!!getError('telefone')} />
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
