import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import api from '../../services/api';
import { Aeronave, EscalaAeronave, Militar } from '../../types/entities';

import Button from '../ui/Button';
import FormError from '../ui/FormError';
import Label from '../ui/Label';
import Input from '../ui/Input';

interface MilitarOption {
  value: number;
  label: string;
}

type EscalaAeronaveFormProps = {
  onSave: (data: EscalaAeronave) => void;
  initialData?: EscalaAeronave;
  isLoading?: boolean;
  onCancel?: () => void;
};

const loadMilitares = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
  if (inputValue.length < 2) {
    callback([]);
    return;
  }

  api
    .get('/api/admin/militares/search', { params: { term: inputValue } })
    .then((res) => {
      const rawData = Array.isArray(res.data) ? res.data : [];
      const options = rawData
        .map((item: any) => {
          if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
            return item as MilitarOption;
          }

          const id = item?.id ?? item?.militar_id;
          const posto = item?.posto_graduacao ?? '';
          const nomeGuerra =
            item?.nome_guerra && item.nome_guerra.trim().length > 0
              ? item.nome_guerra
              : item?.nome_completo ?? '';

          return {
            value: id,
            label: `${posto} ${nomeGuerra}`.trim(),
          } as MilitarOption;
        })
        .filter((option) => option.value && option.label);

      callback(options);
    })
    .catch(() => {
      callback([]);
    });
};

const formatMilitarOption = (militar?: Militar | null) => {
  if (!militar) return null;
  const nome =
    militar.nome_guerra && militar.nome_guerra.trim().length > 0
      ? militar.nome_guerra
      : militar.nome_completo;
  return {
    value: militar.id,
    label: `${militar.posto_graduacao} ${nome}`.trim(),
  };
};

const buildDefaultValues = (initialData?: EscalaAeronave) => {
  const aeronaveValue =
    initialData?.aeronave_id ?? initialData?.aeronave?.id ?? null;
  const aeronaveLabel =
    initialData?.aeronave?.prefixo ?? initialData?.aeronave_prefixo ?? '';

  return {
    data: initialData?.data
      ? new Date(initialData.data).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: initialData?.status ?? 'Em serviço',
    aeronave: aeronaveValue
      ? { value: aeronaveValue, label: aeronaveLabel }
      : null,
    primeiro_piloto: formatMilitarOption(initialData?.comandante ?? null),
    segundo_piloto: formatMilitarOption(initialData?.copiloto ?? null),
  };
};

const EscalaAeronaveForm = ({
  onSave,
  initialData,
  isLoading = false,
  onCancel,
}: EscalaAeronaveFormProps) => {
  const handleFormSubmit = (formData: any) => {
    const aeronaveOption = formData.aeronave;

    const payload = {
      data: formData.data,
      status: formData.status,
      aeronave_id: aeronaveOption?.value ?? initialData?.aeronave_id,
      aeronave_prefixo: aeronaveOption?.label ?? initialData?.aeronave?.prefixo,
      primeiro_piloto_id: formData.primeiro_piloto?.value ?? null,
      segundo_piloto_id: formData.segundo_piloto?.value ?? null,
    };

    onSave(payload);
  };

  const {
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: buildDefaultValues(initialData),
  });

  useEffect(() => {
    reset(buildDefaultValues(initialData));
  }, [initialData, reset]);

  const { data: aeronavesData, isLoading: isLoadingAeronaves } = useQuery<Aeronave[]>({
    queryKey: ['aeronaves'],
    queryFn: () => api.get('/api/admin/viaturas/aeronaves').then((res) => res.data.data),
  });

  const aeronaveOptions =
    aeronavesData?.map((a) => ({ value: a.id, label: a.prefixo })) ?? [];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="data">Data da Escala</Label>
        <Controller
          name="data"
          control={control}
          rules={{ required: 'A data da escala é obrigatória' }}
          render={({ field }) => (
            <Input id="data" type="date" {...field} value={field.value} onChange={field.onChange} />
          )}
        />
        {errors.data && <FormError message={errors.data.message as string} />}
      </div>

      <div>
        <Label htmlFor="aeronave_id">Prefixo</Label>
        <Controller
          name="aeronave"
          control={control}
          rules={{ required: 'O prefixo é obrigatório' }}
          render={({ field }) => (
            <Select
              {...field}
              id="aeronave_id"
              options={aeronaveOptions}
              value={field.value}
              onChange={(option) => field.onChange(option)}
              isLoading={isLoadingAeronaves}
              placeholder="Selecione o prefixo"
            />
          )}
        />
        {errors.aeronave && <FormError message={errors.aeronave.message as string} />}
      </div>

      <div>
        <Label htmlFor="primeiro_piloto">Comandante</Label>
        <Controller
          name="primeiro_piloto"
          control={control}
          rules={{ required: 'O comandante é obrigatório' }}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="primeiro_piloto"
              cacheOptions
              loadOptions={loadMilitares}
              placeholder="Digite o nome do comandante"
              isClearable
              defaultOptions
              value={field.value}
              onChange={(option) => field.onChange(option)}
            />
          )}
        />
        {errors.primeiro_piloto && (
          <FormError message={errors.primeiro_piloto.message as string} />
        )}
      </div>

      <div>
        <Label htmlFor="segundo_piloto">Copiloto</Label>
        <Controller
          name="segundo_piloto"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="segundo_piloto"
              cacheOptions
              loadOptions={loadMilitares}
              placeholder="Digite o nome do copiloto"
              isClearable
              defaultOptions
              value={field.value}
              onChange={(option) => field.onChange(option)}
            />
          )}
        />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              value={field.value}
              onChange={field.onChange}
            >
              <option value="Em serviço">Em serviço</option>
              <option value="Reserva">Reserva</option>
              <option value="Em manutenção">Em manutenção</option>
            </select>
          )}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
          >
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : initialData ? 'Atualizar' : 'Adicionar'}
        </Button>
      </div>
    </form>
  );
};

export default EscalaAeronaveForm;
