import React, { useState, useEffect, FormEvent } from 'react';
import api from '@/services/api';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface Viatura {
  id?: number;
  prefixo: string;
  cidade: string | null;
  obm: string | null;
  obm_abreviatura?: string | null;
  ativa: boolean;
}

interface ObmOption {
  id: number;
  nome: string;
  abreviatura: string;
}

interface ValidationError {
  field: string;
  message: string;
}

type ViaturaFormSubmit = Omit<Viatura, 'id'> & { id?: number; previousObm?: string | null };

interface ViaturaFormProps {
  viaturaToEdit?: Viatura | null;
  onSave: (viatura: ViaturaFormSubmit) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ViaturaForm: React.FC<ViaturaFormProps> = ({ viaturaToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Viatura>({
    prefixo: '',
    cidade: '',
    obm: '',
    obm_abreviatura: '',
    ativa: true,
  });
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoadingObms, setIsLoadingObms] = useState(false);
  const [obmFetchError, setObmFetchError] = useState<string | null>(null);

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (viaturaToEdit) {
      setFormData({
        id: viaturaToEdit.id,
        prefixo: viaturaToEdit.prefixo,
        cidade: viaturaToEdit.cidade ?? '',
        obm: viaturaToEdit.obm ?? '',
        obm_abreviatura: viaturaToEdit.obm_abreviatura ?? '',
        ativa: viaturaToEdit.ativa,
      });
    } else {
      setFormData({ prefixo: '', cidade: '', obm: '', obm_abreviatura: '', ativa: true });
    }
  }, [viaturaToEdit]);

  useEffect(() => {
    const loadObms = async () => {
      setIsLoadingObms(true);
      setObmFetchError(null);
      try {
        const response = await api.get('/api/admin/obms', { params: { limit: 500 } });
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        setObmOptions(items);
      } catch (error) {
        console.error('Falha ao carregar OBMs para o formulario de viaturas:', error);
        setObmFetchError('Nao foi possivel carregar a lista de OBMs. Verifique o cadastro na pagina OBMs.');
      } finally {
        setIsLoadingObms(false);
      }
    };

    loadObms();
  }, []);

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // Adiciona a função para lidar com as mudanças nos inputs e no checkbox.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    // Para checkboxes, usamos a propriedade 'checked', para os outros, 'value'.
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  const handleObmInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const matchedOption = obmOptions.find(
      (option) =>
        option.nome === value ||
        option.abreviatura === value ||
        `${option.abreviatura} - ${option.nome}` === value
    );

    setFormData((prev) => ({
      ...prev,
      obm: value,
      obm_abreviatura: matchedOption ? matchedOption.abreviatura : (prev.obm === value ? prev.obm_abreviatura : ''),
    }));
  };

  const handleObmSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const matchedOption = obmOptions.find((option) => String(option.id) === value);

    setFormData((prev) => ({
      ...prev,
      obm: matchedOption ? matchedOption.nome : '',
      obm_abreviatura: matchedOption ? matchedOption.abreviatura : '',
    }));
  };
  // --- FIM DA CORREÇÃO ---

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, previousObm: viaturaToEdit?.obm ?? null });
  };

  const selectedObmFromOptions = formData.obm
    ? obmOptions.find((option) => option.nome === formData.obm) ?? null
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="prefixo">Prefixo</Label>
        <Input id="prefixo" name="prefixo" value={formData.prefixo} onChange={handleChange} required hasError={!!getError('prefixo')} />
        <FormError message={getError('prefixo')} />
      </div>
      <div>
        <Label htmlFor="obm-select">OBM cadastrada</Label>
        <select
          id="obm-select"
          name="obm-select"
          value={selectedObmFromOptions ? String(selectedObmFromOptions.id) : ''}
          onChange={handleObmSelectChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          disabled={isLoadingObms || !!obmFetchError}
        >
          <option value="">{isLoadingObms ? 'Carregando OBMs...' : 'Selecione para preencher automaticamente'}</option>
          {obmOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.abreviatura ? `${option.abreviatura} - ${option.nome}` : option.nome}
            </option>
          ))}
        </select>
        {obmFetchError && <FormError message={obmFetchError} />}
      </div>
      <div>
        <Label htmlFor="obm">OBM (Nome por extenso)</Label>
        <Input
          id="obm"
          name="obm"
          value={formData.obm || ''}
          onChange={handleObmInputChange}
          list="obm-options"
          placeholder="Digite ou escolha uma OBM cadastrada"
          hasError={!!getError('obm')}
        />
        <datalist id="obm-options">
          {obmOptions.map((option) => (
            <option key={option.id} value={option.nome} label={option.abreviatura ? `${option.abreviatura} - ${option.nome}` : option.nome} />
          ))}
        </datalist>
        <FormError message={getError('obm')} />
      </div>
      <div>
        <Label htmlFor="obm_abreviatura">Sigla da OBM</Label>
        <Input
          id="obm_abreviatura"
          name="obm_abreviatura"
          value={formData.obm_abreviatura || ''}
          onChange={handleChange}
          placeholder="Digite a sigla ou selecione uma OBM para preencher automaticamente"
        />
      </div>
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" name="cidade" value={formData.cidade || ''} onChange={handleChange} hasError={!!getError('cidade')} />
        <FormError message={getError('cidade')} />
      </div>
      <div className="flex items-center">
        <input id="ativa" name="ativa" type="checkbox" checked={formData.ativa} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <Label htmlFor="ativa" className="ml-2 mb-0">Ativa</Label>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default ViaturaForm;
