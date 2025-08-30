import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError'; // Importar

// Interfaces
interface ValidationError {
  field: string;
  message: string;
}
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}
interface Viatura {
  id?: number;
  prefixo: string;
  placa: string;
  modelo: string | null;
  ano: number | null;
  tipo: string;
  ativa: boolean;
  obm_id: number | null;
}
type ViaturaFormData = Omit<Viatura, 'id'> & { id?: number };

interface ViaturaFormProps {
  viaturaToEdit?: Viatura | null;
  obms: Obm[];
  onSave: (viatura: ViaturaFormData) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[]; // Prop para erros
}

const ViaturaForm: React.FC<ViaturaFormProps> = ({ viaturaToEdit, obms, onSave, onCancel, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<Viatura>({
    prefixo: '',
    placa: '',
    modelo: null,
    ano: null,
    tipo: '',
    ativa: true,
    obm_id: null,
  });

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (viaturaToEdit) {
      setFormData(viaturaToEdit);
    } else {
      setFormData({ prefixo: '', placa: '', modelo: null, ano: null, tipo: '', ativa: true, obm_id: null });
    }
  }, [viaturaToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: isCheckbox ? checked : (name === 'ano' || name === 'obm_id' ? (value ? Number(value) : null) : value),
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="prefixo">Prefixo</Label>
          <Input id="prefixo" name="prefixo" value={formData.prefixo} onChange={handleChange} required hasError={!!getError('prefixo')} />
          <FormError message={getError('prefixo')} />
        </div>
        <div>
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" name="placa" value={formData.placa} onChange={handleChange} required hasError={!!getError('placa')} />
          <FormError message={getError('placa')} />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" name="modelo" value={formData.modelo || ''} onChange={handleChange} hasError={!!getError('modelo')} />
          <FormError message={getError('modelo')} />
        </div>
        <div>
          <Label htmlFor="ano">Ano</Label>
          <Input id="ano" name="ano" type="number" value={formData.ano || ''} onChange={handleChange} hasError={!!getError('ano')} />
          <FormError message={getError('ano')} />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Input id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required hasError={!!getError('tipo')} />
          <FormError message={getError('tipo')} />
        </div>
        <div>
          <Label htmlFor="obm_id">OBM</Label>
          <select id="obm_id" name="obm_id" value={formData.obm_id || ''} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm ${getError('obm_id') ? 'border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}>
            <option value="">Selecione uma OBM</option>
            {obms.map(obm => (
              <option key={obm.id} value={obm.id}>{obm.abreviatura} - {obm.nome}</option>
            ))}
          </select>
          <FormError message={getError('obm_id')} />
        </div>
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
