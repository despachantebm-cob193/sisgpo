import React, { useState, useEffect, FormEvent } from 'react';
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
  ativa: boolean;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ViaturaFormProps {
  viaturaToEdit?: Viatura | null;
  onSave: (viatura: Omit<Viatura, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ViaturaForm: React.FC<ViaturaFormProps> = ({ viaturaToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Viatura>({
    prefixo: '',
    cidade: '',
    obm: '',
    ativa: true,
  });

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (viaturaToEdit) {
      setFormData(viaturaToEdit);
    } else {
      setFormData({ prefixo: '', cidade: '', obm: '', ativa: true });
    }
  }, [viaturaToEdit]);

  // --- CORREÇÃO PRINCIPAL AQUI ---
  // Adiciona a função para lidar com as mudanças nos inputs e no checkbox.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    // Para checkboxes, usamos a propriedade 'checked', para os outros, 'value'.
    const isCheckbox = type === 'checkbox';
    const finalValue = isCheckbox ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: finalValue,
    }));
  };
  // --- FIM DA CORREÇÃO ---

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="prefixo">Prefixo</Label>
        <Input id="prefixo" name="prefixo" value={formData.prefixo} onChange={handleChange} required hasError={!!getError('prefixo')} />
        <FormError message={getError('prefixo')} />
      </div>
      <div>
        <Label htmlFor="obm">OBM (Nome por extenso)</Label>
        <Input id="obm" name="obm" value={formData.obm || ''} onChange={handleChange} hasError={!!getError('obm')} />
        <FormError message={getError('obm')} />
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
