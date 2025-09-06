// Arquivo: frontend/src/components/forms/MilitarForm.tsx (Versão Corrigida)

import React, { useState, useEffect, FormEvent } from 'react';
import AsyncSelect from 'react-select/async';
import toast from 'react-hot-toast';
import api from '../../services/api';

import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface ObmOption {
  value: number;
  label: string;
}
interface Militar {
  id?: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  ativo: boolean;
  obm_id: number | null;
}
interface ValidationError {
  field: string;
  message: string;
}
type MilitarFormData = Omit<Militar, 'id'> & { id?: number };

// --- CORREÇÃO APLICADA AQUI ---
// A propriedade 'obms' foi removida desta interface, pois não é mais necessária.
interface MilitarFormProps {
  militarToEdit?: Militar | null;
  onSave: (militar: MilitarFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}
// --- FIM DA CORREÇÃO ---

const MilitarForm: React.FC<MilitarFormProps> = ({ militarToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const getInitialState = (): Militar => ({
    matricula: '',
    nome_completo: '',
    nome_guerra: '',
    posto_graduacao: '',
    ativo: true,
    obm_id: null,
  });

  const [formData, setFormData] = useState<Militar>(getInitialState());
  const [defaultObmOption, setDefaultObmOption] = useState<ObmOption | null>(null);

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  const loadObmOptions = (inputValue: string, callback: (options: ObmOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) {
      return callback([]);
    }
    api.get(`/api/admin/obms/search?term=${inputValue}`)
      .then(response => callback(response.data))
      .catch(() => callback([]));
  };

  useEffect(() => {
    if (militarToEdit) {
      setFormData(militarToEdit);
      if (militarToEdit.obm_id) {
        // Esta lógica agora busca apenas a OBM específica, em vez de depender de uma lista pré-carregada.
        api.get(`/api/admin/obms?id=${militarToEdit.obm_id}&all=true`).then(res => {
          const obm = res.data.data[0];
          if (obm) {
            setDefaultObmOption({ value: obm.id, label: `${obm.abreviatura} - ${obm.nome}` });
          }
        }).catch(() => toast.error("Não foi possível carregar a OBM do militar."));
      }
    } else {
      setFormData(getInitialState());
      setDefaultObmOption(null);
    }
  }, [militarToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleObmChange = (selectedOption: ObmOption | null) => {
    setFormData(prev => ({ ...prev, obm_id: selectedOption ? selectedOption.value : null }));
    setDefaultObmOption(selectedOption);
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

      <div className="space-y-4">
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
            <Label htmlFor="obm_id">OBM de Lotação</Label>
            <AsyncSelect
              id="obm_id"
              cacheOptions
              defaultOptions
              loadOptions={loadObmOptions}
              value={defaultObmOption}
              onChange={handleObmChange}
              placeholder="Digite para buscar uma OBM..."
              noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? "Digite pelo menos 2 caracteres" : "Nenhuma OBM encontrada"}
            />
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

export default MilitarForm;
