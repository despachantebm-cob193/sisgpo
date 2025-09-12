// Arquivo: src/components/forms/EscalaAeronaveForm.tsx (VERSÃO FINAL CORRIGIDA)

import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import { SingleValue } from 'react-select';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import api from '@/services/api';

// Interfaces para tipagem
interface SelectOption {
  value: number;
  label: string;
}

interface FormData {
  data: string;
  aeronave_id: number | '';
  aeronave_prefixo: string;
  status: 'Ativa' | 'Inativa' | 'Manutenção';
  primeiro_piloto_id: number | '';
  segundo_piloto_id: number | '';
}

interface FormProps {
  onSave: (data: FormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EscalaAeronaveForm: React.FC<FormProps> = ({ onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    data: new Date().toISOString().split('T')[0],
    aeronave_id: '',
    aeronave_prefixo: '',
    status: 'Ativa',
    primeiro_piloto_id: '',
    segundo_piloto_id: '',
  });

  const [initialAeronaveOptions, setInitialAeronaveOptions] = useState<SelectOption[]>([]);

  useEffect(() => {
    api.get(`/api/admin/viaturas/aeronaves`)
      .then(res => {
        const options = res.data.data.map((a: any) => ({ value: a.id, label: a.prefixo }));
        setInitialAeronaveOptions(options);
      })
      .catch(() => {
        setInitialAeronaveOptions([]);
      });
  }, []);

  const loadAeronaveOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    api.get(`/api/admin/viaturas/aeronaves?term=${inputValue}`)
      .then(res => {
        const options = res.data.data.map((a: any) => ({ value: a.id, label: a.prefixo }));
        callback(options);
      })
      .catch(() => callback([]));
  };

  const loadPilotoOptions = (inputValue: string, callback: (options: SelectOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(res => callback(res.data))
      .catch(() => callback([]));
  };

  const handleAeronaveChange = (opt: SingleValue<SelectOption>) => {
    setFormData(prev => ({
      ...prev,
      aeronave_id: opt ? opt.value : '',
      aeronave_prefixo: opt ? opt.label : '',
    }));
  };

  const handlePilotoChange = (field: 'primeiro_piloto_id' | 'segundo_piloto_id', opt: SingleValue<SelectOption>) => {
    setFormData(prev => ({ ...prev, [field]: opt ? opt.value : '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="data">Data da Escala</Label>
          <Input id="data" type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="aeronave_id">Aeronave</Label>
          <AsyncSelect
            id="aeronave_id"
            cacheOptions
            loadOptions={loadAeronaveOptions}
            defaultOptions={initialAeronaveOptions}
            isClearable
            placeholder="Digite o prefixo (Ex: B-05)"
            onChange={handleAeronaveChange}
            noOptionsMessage={() => 'Nenhuma aeronave encontrada'}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primeiro_piloto_id">1º Piloto</Label>
          <AsyncSelect
            id="primeiro_piloto_id"
            loadOptions={loadPilotoOptions}
            // --- CORREÇÃO APLICADA ---
            // A propriedade 'defaultOptions' foi completamente removida daqui.
            isClearable
            placeholder="Buscar por nome ou matrícula..."
            onChange={(opt) => handlePilotoChange('primeiro_piloto_id', opt)}
          />
        </div>
        <div>
          <Label htmlFor="segundo_piloto_id">2º Piloto</Label>
          <AsyncSelect
            id="segundo_piloto_id"
            loadOptions={loadPilotoOptions}
            // --- CORREÇÃO APLICADA ---
            // A propriedade 'defaultOptions' foi completamente removida daqui.
            isClearable
            placeholder="Buscar por nome ou matrícula..."
            onChange={(opt) => handlePilotoChange('segundo_piloto_id', opt)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="status">Status</Label>
        <select id="status" value={formData.status} onChange={e => setFormData(p => ({ ...p, status: e.target.value as any }))} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm">
          <option value="Ativa">Ativa</option>
          <option value="Inativa">Inativa</option>
          <option value="Manutenção">Manutenção</option>
        </select>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar Escala'}</Button>
      </div>
    </form>
  );
};

export default EscalaAeronaveForm;
