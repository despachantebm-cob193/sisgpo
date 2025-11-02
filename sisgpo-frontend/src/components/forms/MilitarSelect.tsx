import React from 'react';
import AsyncSelect from 'react-select/async';
import api from '@/services/api';
import { Controller } from 'react-hook-form';

// Estrutura da opção que o react-select usará
export interface MilitarOption {
  value: number;
  label: string;
  militar: any; // Pode ser tipado com mais detalhes se necessário
}

interface MilitarSelectProps {
  control: any; // Control do react-hook-form
  name: string; // Nome do campo no formulário
  label: string;
  [key: string]: any; // Outras props que possam ser passadas
}

// Função que busca os dados na API
const loadMilitarOptions = async (inputValue: string): Promise<MilitarOption[]> => {
  if (inputValue.length < 2) return [];
  try {
    const response = await api.get<MilitarOption[]>('/api/admin/militares/search', {
      params: { term: inputValue },
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar militares:', error);
    return []; // Retorna um array vazio em caso de erro
  }
};

const MilitarSelect: React.FC<MilitarSelectProps> = ({ control, name, label, ...rest }) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-textSecondary mb-1">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <AsyncSelect
            {...field}
            id={name}
            instanceId={name} // Evita colisões de ID
            cacheOptions
            loadOptions={loadMilitarOptions}
            defaultOptions
            placeholder="Digite para buscar..."
            classNamePrefix="react-select"
            noOptionsMessage={({ inputValue }) => 
              inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum militar encontrado'
            }
            loadingMessage={() => 'Buscando...'}
            // Garante que o valor do formulário seja compatível com o react-select
            onChange={(option) => field.onChange(option ? option.value : null)}
            value={field.value ? { value: field.value, label: field.value } : null} // Adaptação para exibir valor inicial
          />
        )}
      />
    </div>
  );
};

export default MilitarSelect;
