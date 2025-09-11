// Arquivo: frontend/src/components/forms/EscalaMedicoForm.tsx (NOVO)

import React, { useState, FormEvent, ChangeEvent } from 'react';
import AsyncSelect from 'react-select/async';
import api from '@/services/api';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';

interface MedicoOption { value: number; label: string; }
interface EscalaData {
  civil_id: number | null;
  entrada_servico: string;
  saida_servico: string;
  status_servico: 'Presente' | 'Ausente';
  observacoes: string;
}

interface EscalaMedicoFormProps {
  onSave: (data: EscalaData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EscalaMedicoForm: React.FC<EscalaMedicoFormProps> = ({ onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<EscalaData>({
    civil_id: null,
    entrada_servico: '',
    saida_servico: '',
    status_servico: 'Presente',
    observacoes: '',
  });

  const loadMedicoOptions = (inputValue: string, callback: (options: MedicoOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/civis/search?term=${inputValue}`).then(res => callback(res.data)).catch(() => callback([]));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="civil_id">Médico</Label>
        <AsyncSelect
          id="civil_id"
          cacheOptions
          loadOptions={loadMedicoOptions}
          defaultOptions
          isClearable
          placeholder="Digite para buscar um médico..."
          onChange={(option) => setFormData(prev => ({ ...prev, civil_id: (option as MedicoOption)?.value || null }))}
          noOptionsMessage={() => 'Nenhum médico encontrado'}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="entrada_servico">Entrada do Serviço</Label>
          <Input id="entrada_servico" name="entrada_servico" type="datetime-local" value={formData.entrada_servico} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="saida_servico">Saída do Serviço</Label>
          <Input id="saida_servico" name="saida_servico" type="datetime-local" value={formData.saida_servico} onChange={handleChange} required />
        </div>
      </div>
      <div>
        <Label htmlFor="status_servico">Status</Label>
        <select id="status_servico" name="status_servico" value={formData.status_servico} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
          <option value="Presente">Presente</option>
          <option value="Ausente">Ausente</option>
        </select>
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default EscalaMedicoForm;
