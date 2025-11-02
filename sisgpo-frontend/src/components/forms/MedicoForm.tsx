import React, { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';

interface Medico {
  id?: number;
  nome_completo: string;
  funcao: string;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface MedicoFormProps {
  medicoToEdit?: Medico | null;
  onSave: (data: Medico) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const TELEFONE_PATTERN_ATTR = '^\\(\\d{2}\\)\\s?\\d{4,5}-\\d{4}$';

const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const restante = digits.slice(2);

  if (digits.length <= 6) {
    return `(${ddd}) ${restante}`;
  }

  if (digits.length <= 10) {
    const parte1 = restante.slice(0, 4);
    const parte2 = restante.slice(4);
    return `(${ddd}) ${parte1}${parte2 ? `-${parte2}` : ''}`;
  }

  const parte1 = restante.slice(0, 5);
  const parte2 = restante.slice(5);
  return `(${ddd}) ${parte1}-${parte2}`;
};

const MedicoForm: React.FC<MedicoFormProps> = ({ medicoToEdit, onSave, onCancel, isLoading }) => {
  const getInitialState = (): Medico => ({
    nome_completo: '',
    funcao: 'Médico Regulador',
    telefone: '',
    observacoes: '',
    ativo: true,
  });

  const [formData, setFormData] = useState<Medico>(getInitialState());

  useEffect(() => {
    if (medicoToEdit) {
      setFormData(medicoToEdit);
    } else {
      setFormData(getInitialState());
    }
  }, [medicoToEdit]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      setFormData((prev) => ({ ...prev, telefone: formatTelefone(value) }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome_completo">Nome Completo</Label>
        <Input
          id="nome_completo"
          name="nome_completo"
          value={formData.nome_completo}
          onChange={handleChange}
          required
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="funcao">Função</Label>
          <Input id="funcao" name="funcao" value={formData.funcao} onChange={handleChange} required />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            value={formData.telefone || ''}
            onChange={handleChange}
            inputMode="numeric"
            pattern={TELEFONE_PATTERN_ATTR}
            maxLength={15}
            title="Informe um telefone no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea
          id="observacoes"
          name="observacoes"
          value={formData.observacoes || ''}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-borderDark/60 rounded-md shadow-sm"
        />
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-searchbar hover:bg-searchbar">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default MedicoForm;

