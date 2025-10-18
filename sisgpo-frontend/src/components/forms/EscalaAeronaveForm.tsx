import { useQuery } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import api from '../../services/api';
import { Aeronave, EscalaAeronave, Militar } from '../../types/entities';

import Button from '../ui/Button';
import FormError from '../ui/FormError';
import Label from '../ui/Label';


type EscalaAeronaveFormProps = {
  onSubmit: (data: EscalaAeronave) => void;
  initialData?: EscalaAeronave;
  isSubmitting: boolean;
};

const EscalaAeronaveForm = ({
  onSubmit,
  initialData,
  isSubmitting,
}: EscalaAeronaveFormProps) => {
  const {
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EscalaAeronave>({
    defaultValues: initialData || {
      em_servico: true,
    },
  });

  const { data: aeronavesData, isLoading: isLoadingAeronaves } = useQuery<Aeronave[]>({
    queryKey: ['aeronaves'],
    queryFn: () => api.get('/api/admin/viaturas/aeronaves').then(res => res.data.data),
  });

  const loadMilitares = (inputValue: string, callback: (options: any[]) => void) => {
    api.get('/admin/militares', { params: { 'por-pagina': 10, nome: inputValue } })
      .then(res => {
        const options = res.data.data.map((militar: Militar) => ({
          value: militar.id,
          label: `${militar.posto_graduacao} ${militar.nome_guerra}`,
        }));
        callback(options);
      });
  };

  const defaultMilitarOptions = (militares: Militar[] | undefined) => {
    if (!militares) return [];
    return militares.map(militar => ({
      value: militar.id,
      label: `${militar.posto_graduacao} ${militar.nome_guerra}`,
    }));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="aeronave_id">Prefixo</Label>
        <Controller
          name="aeronave_id"
          control={control}
          rules={{ required: 'O prefixo Ã© obrigatÃ³rio' }}
          render={({ field }) => (
            <Select
              {...field}
              id="aeronave_id"
              options={aeronavesData?.map(a => ({ value: a.id, label: a.prefixo })) || []}
              value={
                aeronavesData?.map(a => ({ value: a.id, label: a.prefixo })).find(
                  option => option.value === field.value,
                ) || null
              }
              onChange={option => field.onChange(option?.value)}
              isLoading={isLoadingAeronaves}
              placeholder="Selecione o prefixo"
            />
          )}
        />
        {errors.aeronave_id && (
          <FormError message={errors.aeronave_id.message} />
        )}
      </div>

      <div>
        <Label htmlFor="comandante_id">Comandante</Label>
        <Controller
          name="comandante_id"
          control={control}
          rules={{ required: 'O comandante Ã© obrigatÃ³rio' }}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="comandante_id"
              loadOptions={loadMilitares}
              defaultOptions={defaultMilitarOptions(initialData?.comandante ? [initialData.comandante] : [])}
              value={field.value && initialData?.comandante ? { value: initialData.comandante.id, label: `${initialData.comandante.posto_graduacao} ${initialData.comandante.nome_guerra}` } : null}
              onChange={(option: any) => field.onChange(option.value)}
              placeholder="Digite o nome do comandante"
              isClearable
            />
          )}
        />
        {errors.comandante_id && (
          <FormError message={errors.comandante_id.message} />
        )}
      </div>
      
      <div>
        <Label htmlFor="copiloto_id">Copiloto</Label>
        <Controller
          name="copiloto_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="copiloto_id"
              loadOptions={loadMilitares}
              defaultOptions={defaultMilitarOptions(initialData?.copiloto ? [initialData.copiloto] : [])}
              value={field.value && initialData?.copiloto ? { value: initialData.copiloto.id, label: `${initialData.copiloto.posto_graduacao} ${initialData.copiloto.nome_guerra}` } : null}
              onChange={(option: any) => field.onChange(option.value)}
              placeholder="Digite o nome do copiloto"
              isClearable
            />
          )}
        />
      </div>

      <div>
        <Label htmlFor="tripulante_id">Tripulante</Label>
        <Controller
          name="tripulante_id"
          control={control}
          render={({ field }) => (
            <AsyncSelect
              {...field}
              id="tripulante_id"
              loadOptions={loadMilitares}
              defaultOptions={defaultMilitarOptions(initialData?.tripulante ? [initialData.tripulante] : [])}
              value={field.value && initialData?.tripulante ? { value: initialData.tripulante.id, label: `${initialData.tripulante.posto_graduacao} ${initialData.tripulante.nome_guerra}` } : null}
              onChange={(option: any) => field.onChange(option.value)}
              placeholder="Digite o nome do tripulante"
              isClearable
            />
          )}
        />
      </div>
      
      <div className="flex items-center">
        <Controller
          name="em_servico"
          control={control}
          render={({ field }) => (
            <input
              id="em_servico"
              type="checkbox"
              onChange={field.onChange}
              onBlur={field.onBlur}
              checked={field.value}
              name={field.name}
              ref={field.ref}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
          )}
        />
        <Label htmlFor="em_servico" className="ml-2 block text-sm text-gray-900">
          Em serviÃ§o
        </Label>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : (initialData ? 'Atualizar' : 'Adicionar')}
        </Button>
      </div>
    </form>
  );
};

export default EscalaAeronaveForm;
