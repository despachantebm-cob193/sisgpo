// Arquivo: frontend/src/pages/Profile.tsx (Completo)

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import ChangePasswordForm from '../components/forms/ChangePasswordForm';
import { useAuthStore } from '../store/authStore';

interface ChangePasswordData {
  senhaAtual: string;
  novaSenha: string;
  confirmarNovaSenha: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function Profile() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handlePasswordChange = async (data: ChangePasswordData) => {
    setIsLoading(true);
    setValidationErrors([]);
    try {
      const response = await api.put('/api/admin/user/change-password', data);
      toast.success(response.data.message || 'Senha alterada com sucesso!');
      // Limpar o formulário seria ideal aqui, mas o estado está no componente filho.
      // Para este caso, um reload ou reset do estado do form seria necessário.
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || 'Erro ao alterar a senha.';
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight text-gray-900">Perfil do Usuário</h2>
      <p className="text-gray-600 mt-2">
        Gerencie suas informações de perfil e segurança.
      </p>

      <div className="mt-8 max-w-xl">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 border-b pb-4">
            Alterar Senha
          </h3>
          <div className="mt-4">
            <ChangePasswordForm
              onSave={handlePasswordChange}
              isLoading={isLoading}
              errors={validationErrors}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
