import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';

// Interface para OBM, usada no select
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

// Interface para os dados da Viatura que o formulário manipula
interface Viatura {
  id?: number;
  prefixo: string;
  placa: string;
  modelo: string | null; // Alinhado para aceitar null
  ano: number | null;    // Alinhado para aceitar null
  tipo: string;
  ativa: boolean;
  obm_id: number | null;
}

// Tipo para os dados que são enviados para a função onSave
type ViaturaFormData = Omit<Viatura, 'id'> & { id?: number };

interface ViaturaFormProps {
  viaturaToEdit?: Viatura | null;
  obms: Obm[];
  onSave: (viatura: ViaturaFormData) => void; // Espera o tipo correto
  onCancel: () => void;
  isLoading: boolean;
}

const ViaturaForm: React.FC<ViaturaFormProps> = ({ viaturaToEdit, obms, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<Viatura>({
    prefixo: '',
    placa: '',
    modelo: null, // Inicia como null
    ano: null,    // Inicia como null
    tipo: '',
    ativa: true,
    obm_id: null,
  });

  useEffect(() => {
    if (viaturaToEdit) {
      setFormData(viaturaToEdit);
    } else {
      // Reseta para o estado inicial limpo
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
          <Input id="prefixo" name="prefixo" value={formData.prefixo} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="placa">Placa</Label>
          <Input id="placa" name="placa" value={formData.placa} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="modelo">Modelo</Label>
          <Input id="modelo" name="modelo" value={formData.modelo || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="ano">Ano</Label>
          <Input id="ano" name="ano" type="number" value={formData.ano || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="tipo">Tipo</Label>
          <Input id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="obm_id">OBM</Label>
          <select id="obm_id" name="obm_id" value={formData.obm_id || ''} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
            <option value="">Selecione uma OBM</option>
            {obms.map(obm => (
              <option key={obm.id} value={obm.id}>{obm.abreviatura} - {obm.nome}</option>
            ))}
          </select>
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
