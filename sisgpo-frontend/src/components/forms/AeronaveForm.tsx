import React from 'react';
import { useForm } from 'react-hook-form';
import { Aeronave } from '../../types/entities';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

interface AeronaveFormProps {
  onSubmit: (data: Partial<Aeronave>) => void;
  initialData?: Aeronave;
  isSubmitting: boolean;
}

const AeronaveForm: React.FC<AeronaveFormProps> = ({ onSubmit, initialData, isSubmitting }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Aeronave>({
    defaultValues: initialData,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="prefixo">Prefixo</label>
        <Input id="prefixo" {...register('prefixo', { required: 'Prefixo é obrigatório' })} />
        {errors.prefixo && <FormError message={errors.prefixo.message} />}
      </div>
      <div>
        <label htmlFor="tipo_asa">Tipo de Asa</label>
        <Select id="tipo_asa" {...register('tipo_asa', { required: 'Tipo de asa é obrigatório' })}>
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