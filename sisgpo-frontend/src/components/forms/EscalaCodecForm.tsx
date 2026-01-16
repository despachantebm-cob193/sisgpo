// Arquivo: src/components/forms/EscalaCodecForm.tsx (VERSÃO CORRIGIDA)

import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { SingleValue } from 'react-select';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import { PlusCircle, XCircle } from 'lucide-react';
import api from '@/services/api';

// Interfaces para tipagem
interface MilitarOption {
  value: number;
  label: string;
}

interface Plantonista {
  militar_id: number | null;
  ordem: number;
}

interface FormData {
  data: string;
  diurno: Plantonista[];
  noturno: Plantonista[];
}

interface FormProps {
  onSave: (data: FormData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const EscalaCodecForm: React.FC<FormProps> = ({ onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState<FormData>({
    data: new Date().toISOString().split('T')[0],
    diurno: [{ militar_id: null, ordem: 1 }],
    noturno: [{ militar_id: null, ordem: 1 }],
  });

  // Função para carregar opções de militares da API
  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(res => callback(res.data))
      .catch(() => callback([]));
  };

  // Função para lidar com a mudança de um plantonista
  const handlePlantonistaChange = (turno: 'diurno' | 'noturno', index: number, selectedOption: SingleValue<MilitarOption>) => {
    const novosPlantonistas = [...formData[turno]];
    const newMilitarId = selectedOption ? selectedOption.value : null;

    // Check for duplicates within the same turno list
    const isDuplicate = novosPlantonistas.some((p, i) => i !== index && p.militar_id === newMilitarId && newMilitarId !== null);
    if (isDuplicate) {
      toast.error('Este militar já foi adicionado neste turno.');
      return; // Prevent updating state with duplicate
    }

    novosPlantonistas[index] = {
      ...novosPlantonistas[index],
      militar_id: newMilitarId,
    };
    setFormData(prev => ({ ...prev, [turno]: novosPlantonistas }));
  };

  // Funções para adicionar/remover plantonistas
  const adicionarPlantonista = (turno: 'diurno' | 'noturno') => {
    setFormData(prev => {
      const turnoAtual = prev[turno];
      const novaOrdem = turnoAtual.length > 0 ? Math.max(...turnoAtual.map(p => p.ordem)) + 1 : 1;
      return {
        ...prev,
        [turno]: [...turnoAtual, { militar_id: null, ordem: novaOrdem }],
      };
    });
  };

  const removerPlantonista = (turno: 'diurno' | 'noturno', index: number) => {
    setFormData(prev => ({
      ...prev,
      [turno]: prev[turno].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const allMilitarIds = new Set<number>();
    let hasDuplicates = false;

    // Check diurno for duplicates
    formData.diurno.forEach(p => {
      if (p.militar_id !== null) {
        if (allMilitarIds.has(p.militar_id)) {
          hasDuplicates = true;
        }
        allMilitarIds.add(p.militar_id);
      }
    });

    // Check noturno for duplicates
    formData.noturno.forEach(p => {
      if (p.militar_id !== null) {
        if (allMilitarIds.has(p.militar_id)) {
          hasDuplicates = true;
        }
        allMilitarIds.add(p.militar_id);
      }
    });

    if (hasDuplicates) {
      toast.error('O mesmo militar não pode ser escalado mais de uma vez no mesmo dia (incluindo ambos os turnos).');
      return;
    }

    onSave(formData);
  };

  // Função para renderizar a seção de um turno
  const renderTurnoSection = (turno: 'diurno' | 'noturno', titulo: string) => (
    <div className="space-y-2 p-4 border rounded-lg">
      <h4 className="font-semibold text-textSecondary">{titulo}</h4>
      {formData[turno].map((plantonista, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className="flex-grow">
            <AsyncSelect
              placeholder={`Buscar Plantonista ${index + 1}...`}
              cacheOptions
              loadOptions={loadMilitarOptions}
              defaultOptions
              isClearable
              onChange={(option) => handlePlantonistaChange(turno, index, option)}
              noOptionsMessage={() => 'Nenhum militar encontrado'}
              styles={{
                singleValue: (base) => ({ ...base, color: '#333333' }), // Dark Gray for selected text
                input: (base) => ({ ...base, color: '#333333' }), // Dark Gray for typing
                placeholder: (base) => ({ ...base, color: '#666666' }), // Lighter Gray for placeholder
                control: (base) => ({ ...base, backgroundColor: 'white', borderColor: '#cbd5e0' }),
                menu: (base) => ({ ...base, zIndex: 9999, color: '#333333' }) // Ensure dropdown text is also readable
              }}
            />
          </div>
          {formData[turno].length > 1 && (
            <button type="button" onClick={() => removerPlantonista(turno, index)} className="text-red-500 hover:text-red-700">
              <XCircle size={20} />
            </button>
          )}
        </div>
      ))}
      <Button type="button" onClick={() => adicionarPlantonista(turno)} variant="primary" className="!w-auto !py-1 !px-2 text-xs !bg-emerald-500 hover:!bg-emerald-600 text-white">
        <PlusCircle size={16} className="mr-1" /> Adicionar
      </Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 backdrop-blur-5 bg-cardSlate/50 p-4 rounded-lg">
      <div>
        <Label htmlFor="data">Data da Escala</Label>
        <Input id="data" type="date" value={formData.data} onChange={e => setFormData(p => ({ ...p, data: e.target.value }))} required />
      </div>

      {renderTurnoSection('diurno', 'Turno Diurno (07h às 19h)')}
      {renderTurnoSection('noturno', 'Turno Noturno (19h às 07h)')}

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} variant="danger">Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="!bg-blue-500 hover:!bg-blue-600 text-white">{isLoading ? 'Salvando...' : 'Salvar Escala'}</Button>
      </div>
    </form>
  );
};

export default EscalaCodecForm;

