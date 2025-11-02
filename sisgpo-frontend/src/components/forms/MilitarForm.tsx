import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import Select from '../ui/Select';
import type { Militar, Obm, ValidationError } from '@/types/entities';

const TELEFONE_PATTERN_ATTR = '^\\(\\d{2}\\)\\s?\\d{4,5}-\\d{4}$';

export interface MilitarFormProps {
  initialData?: Militar | null;
  onSave: (militar: Omit<Militar, 'id'> & { id?: number }) => Promise<void>;
  onSuccess: () => void;
  isSaving: boolean;
  errors?: ValidationError[];
  obms: Obm[];
}

type MilitarFormState = {
  matricula: string;
  nome_completo: string;
  nome_guerra: string;
  posto_graduacao: string;
  obm_id: string; // Alterado de obm_nome para obm_id
  ativo: 'ativo' | 'inativo';
  telefone: string;
};

const formatTelefone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  const restante = digits.slice(2);

  if (digits.length <= 2) {
    return `(${digits}`;
  }

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

const getInitialState = (): MilitarFormState => ({
  matricula: '',
  nome_completo: '',
  nome_guerra: '',
  posto_graduacao: '',
  obm_id: '', // Alterado de obm_nome para obm_id
  ativo: 'ativo',
  telefone: '',
});

const mapInitialData = (data: Militar): MilitarFormState => ({
  matricula: data.matricula ?? '',
  nome_completo: data.nome_completo ?? '',
  nome_guerra: data.nome_guerra ?? '',
  posto_graduacao: data.posto_graduacao ?? '',
  obm_id: data.obm_id?.toString() ?? '', // Mapeia obm_id para string
  ativo: data.ativo ? 'ativo' : 'inativo',
  telefone: data.telefone ?? '',
});

const MilitarForm: React.FC<MilitarFormProps> = ({
  initialData,
  onSave,
  onSuccess,
  isSaving,
  errors = [],
  obms,
}) => {
  const [formData, setFormData] = useState<MilitarFormState>(getInitialState());

  useEffect(() => {
    if (initialData) {
      setFormData(mapInitialData(initialData));
    } else {
      setFormData(getInitialState());
    }
  }, [initialData]);

  const getError = (field: string) => errors.find((error) => error.field === field)?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'telefone') {
      const formatted = formatTelefone(value);
      setFormData((prev) => ({ ...prev, telefone: formatted }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const payload: Record<string, unknown> = {
      id: initialData?.id,
      matricula: formData.matricula.trim(),
      nome_completo: formData.nome_completo.trim(),
      posto_graduacao: formData.posto_graduacao.trim(),
      ativo: formData.ativo === 'ativo',
    };

    // --- CORREÇÃO APLICADA AQUI ---
    if (formData.obm_id) {
      const obmIdAsNumber = parseInt(formData.obm_id, 10);
      if (!isNaN(obmIdAsNumber)) {
        payload.obm_id = obmIdAsNumber;
      }
    } else if (initialData?.id) {
      payload.obm_id = null;
    }
    // --- FIM DA CORREÇÃO ---

    const nomeGuerra = formData.nome_guerra.trim();
    if (nomeGuerra) {
      payload.nome_guerra = nomeGuerra;
    } else if (initialData?.id && initialData?.nome_guerra && !nomeGuerra) {
      payload.nome_guerra = null;
    }

    const telefone = formData.telefone.trim();
    if (telefone) {
      payload.telefone = telefone;
    } else if (initialData?.id && initialData?.telefone && !telefone) {
      payload.telefone = null;
    }

    await onSave(payload as Omit<Militar, 'id'> & { id?: number });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="posto_graduacao">Posto/Graduação</Label>
          <Input
            id="posto_graduacao"
            name="posto_graduacao"
            value={formData.posto_graduacao}
            onChange={handleChange}
            required
            hasError={!!getError('posto_graduacao')}
          />
          <FormError message={getError('posto_graduacao')} />
        </div>
        <div>
          <Label htmlFor="nome_guerra">Nome de Guerra</Label>
          <Input
            id="nome_guerra"
            name="nome_guerra"
            value={formData.nome_guerra}
            onChange={handleChange}
            hasError={!!getError('nome_guerra')}
          />
          <FormError message={getError('nome_guerra')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nome_completo">Nome Completo</Label>
          <Input
            id="nome_completo"
            name="nome_completo"
            value={formData.nome_completo}
            onChange={handleChange}
            required
            hasError={!!getError('nome_completo')}
          />
          <FormError message={getError('nome_completo')} />
        </div>
        <div>
          <Label htmlFor="matricula">Matrícula</Label>
          <Input
            id="matricula"
            name="matricula"
            value={formData.matricula}
            onChange={handleChange}
            required
            hasError={!!getError('matricula')}
          />
          <FormError message={getError('matricula')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="obm_id">Lotação (OBM)</Label>
          <Select
            id="obm_id"
            name="obm_id"
            value={formData.obm_id}
            onChange={handleChange}
            hasError={!!getError('obm_id')}
          >
            <option value="">Nenhuma</option>
            {obms.map((obm) => (
              <option key={obm.id} value={obm.id}>
                {obm.abreviatura} - {obm.nome}
              </option>
            ))}
          </Select>
          <FormError message={getError('obm_id')} />
        </div>
        <div>
          <Label htmlFor="telefone">Telefone</Label>
          <Input
            id="telefone"
            name="telefone"
            inputMode="numeric"
            pattern={TELEFONE_PATTERN_ATTR}
            maxLength={15}
            title="Informe um telefone no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX"
            value={formData.telefone}
            onChange={handleChange}
            hasError={!!getError('telefone')}
          />
          <FormError message={getError('telefone')} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="ativo">Status</Label>
          <Select
            id="ativo"
            name="ativo"
            value={formData.ativo}
            onChange={handleChange}
            required
            hasError={!!getError('ativo')}
          >
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
          <FormError message={getError('ativo')} />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onSuccess} className="bg-searchbar hover:bg-searchbar">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default MilitarForm;

