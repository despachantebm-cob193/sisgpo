import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Aeronave } from '../../types/entities';
import Select from '../ui/Select';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface AeronaveFormProps {
  onSubmit: (data: Partial<Aeronave>) => void;
  initialData?: Aeronave;
  isSubmitting: boolean;
}

interface ViaturaSimpleOption {
  id: number;
  prefixo: string;
  obm?: string | null;
}

interface ViaturaSimpleResponse {
  data: ViaturaSimpleOption[];
}

const OBM_CENTRO_OPERACOES_AEREAS = 'CENTRO DE OPERA\u00C7\u00D5ES A\u00C9REAS';

const AeronaveForm: React.FC<AeronaveFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const [prefixOptions, setPrefixOptions] = useState<string[]>([]);
  const [isLoadingPrefixes, setIsLoadingPrefixes] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Aeronave>({
    defaultValues: initialData,
  });

  useEffect(() => {
    let isMounted = true;

    const fetchPrefixOptions = async () => {
      setIsLoadingPrefixes(true);
      try {
        const response = await api.get<ViaturaSimpleResponse>('/api/admin/viaturas/simple', {
          params: { obm: OBM_CENTRO_OPERACOES_AEREAS },
        });

        const fetchedPrefixes = (response.data?.data || [])
          .map(viatura => viatura.prefixo)
          .filter((prefixo): prefixo is string => Boolean(prefixo));

        if (initialData?.prefixo && !fetchedPrefixes.includes(initialData.prefixo)) {
          fetchedPrefixes.push(initialData.prefixo);
        }

        fetchedPrefixes.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

        if (isMounted) {
          setPrefixOptions(fetchedPrefixes);
        }
      } catch (error) {
        if (isMounted) {
          setPrefixOptions(initialData?.prefixo ? [initialData.prefixo] : []);
        }
        toast.error('Nao foi possivel carregar os prefixos de viatura.');
      } finally {
        if (isMounted) {
          setIsLoadingPrefixes(false);
        }
      }
    };

    fetchPrefixOptions();
    return () => {
      isMounted = false;
    };
  }, [initialData?.prefixo]);

  const hasPrefixes = prefixOptions.length > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="prefixo">Prefixo</label>
        <Select
          id="prefixo"
          {...register('prefixo', { required: 'Prefixo e obrigatorio' })}
          disabled={isLoadingPrefixes || !hasPrefixes}
        >
          <option value="">
            {isLoadingPrefixes
              ? 'Carregando prefixos...'
              : hasPrefixes
                ? 'Selecione...'
                : 'Nenhum prefixo disponivel'}
          </option>
          {prefixOptions.map(prefix => (
            <option key={prefix} value={prefix}>
              {prefix}
            </option>
          ))}
        </Select>
        {errors.prefixo && <FormError message={errors.prefixo.message} />}
      </div>
      <div>
        <label htmlFor="tipo_asa">Tipo de Asa</label>
        <Select id="tipo_asa" {...register('tipo_asa', { required: 'Tipo de asa e obrigatoria' })}>
          <option value="">Selecione...</option>
          <option value="fixa">Fixa</option>
          <option value="rotativa">Rotativa</option>
        </Select>
        {errors.tipo_asa && <FormError message={errors.tipo_asa.message} />}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </Button>
    </form>
  );
};

export default AeronaveForm;
