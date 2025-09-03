import React, { useState, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// Interfaces
interface ChangePasswordData {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface ChangePasswordFormProps {
  onSave: (data: ChangePasswordData) => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ onSave, isLoading, errors = [] }) => {
  const [formData, setFormData] = useState<ChangePasswordData>({
    senhaAtual: '',
    novaSenha: '',
    confirmarNovaSenha: '',
  });

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="senhaAtual">Senha Atual</Label>
        <Input
          id="senhaAtual"
          name="senhaAtual"
          type="password"
          value={formData.senhaAtual}
          onChange={handleChange}
          required
          hasError={!!getError('senhaAtual')}
        />
        <FormError message={getError('senhaAtual')} />
      </div>
      <div>
        <Label htmlFor="novaSenha">Nova Senha</Label>
        <Input
          id="novaSenha"
          name="novaSenha"
          type="password"
          value={formData.novaSenha}
          onChange={handleChange}
          required
          hasError={!!getError('novaSenha')}
        />
        <FormError message={getError('novaSenha')} />
      </div>
      <div>
        <Label htmlFor="confirmarNovaSenha">Confirmar Nova Senha</Label>
        <Input
          id="confirmarNovaSenha"
          name="confirmarNovaSenha"
          type="password"
          value={formData.confirmarNovaSenha}
          onChange={handleChange}
          required
          hasError={!!getError('confirmarNovaSenha')}
        />
        <FormError message={getError('confirmarNovaSenha')} />
      </div>
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading} className="!w-auto">
          {isLoading ? 'Salvando...' : 'Alterar Senha'}
        </Button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
