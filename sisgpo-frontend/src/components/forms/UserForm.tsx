import { ChangeEvent, FormEvent, useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Label from '../ui/Label';
import FormError from '../ui/FormError';
import { UserRecord, FormState, ValidationErrors } from '../../types/entities';

const initialForm: FormState = {
  login: '',
  nome: '',
  nome_completo: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'user',
};

interface UserFormProps {
  editingUser: UserRecord | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function UserForm({ editingUser, onSave, onCancel }: UserFormProps) {
  const loginInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<FormState>(initialForm);
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        login: editingUser.login,
        nome: editingUser.nome ?? '',
        nome_completo: editingUser.nome_completo ?? '',
        email: editingUser.email ?? '',
        senha: '',
        confirmarSenha: '',
        perfil: editingUser.perfil,
      });
      requestAnimationFrame(() => loginInputRef.current?.focus());
    } else {
      setFormData(initialForm);
    }
  }, [editingUser]);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    const trimmedLogin = formData.login.trim();
    const trimmedNome = formData.nome.trim();
    const trimmedNomeCompleto = formData.nome_completo.trim();
    const trimmedEmail = formData.email.trim();

    const validationErrors: ValidationErrors = {};

    if (!trimmedNomeCompleto) {
      validationErrors.nome_completo = 'Informe o nome completo.';
    }

    if (!trimmedNome) {
      validationErrors.nome = 'Informe o nome.';
    }

    if (!trimmedEmail) {
      validationErrors.email = 'Informe o email.';
    }

    if (!trimmedLogin) {
      validationErrors.login = 'Informe o login.';
    }

    if (!editingUser) {
      if (!formData.senha) {
        validationErrors.senha = 'Informe a senha.';
      }

      if (!formData.confirmarSenha) {
        validationErrors.confirmarSenha = 'Confirme a senha.';
      }
    }

    if (formData.confirmarSenha && !formData.senha) {
      validationErrors.confirmarSenha = 'Informe a nova senha para confirmar.';
    } else if ((formData.senha || formData.confirmarSenha) && formData.senha !== formData.confirmarSenha) {
      validationErrors.confirmarSenha = 'As senhas devem ser iguais.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (editingUser) {
        const payload: Record<string, unknown> = {};

        if (trimmedLogin && trimmedLogin !== editingUser.login) {
          payload.login = trimmedLogin;
        }

        if (formData.perfil && formData.perfil !== editingUser.perfil) {
          payload.perfil = formData.perfil;
        }

        if (trimmedNome && trimmedNome !== (editingUser.nome ?? '')) {
          payload.nome = trimmedNome;
        }

        if (trimmedNomeCompleto && trimmedNomeCompleto !== (editingUser.nome_completo ?? '')) {
          payload.nome_completo = trimmedNomeCompleto;
        }

        if (trimmedEmail && trimmedEmail !== (editingUser.email ?? '')) {
          payload.email = trimmedEmail;
        }

        if (formData.senha) {
          payload.senha = formData.senha;
          payload.confirmarSenha = formData.confirmarSenha;
        }

        if (Object.keys(payload).length === 0) {
          toast.success('Nenhuma alteracao aplicada.');
          onSave();
          return;
        }

        await api.put(`/api/admin/users/${editingUser.id}`, payload);
        toast.success('Usuario atualizado com sucesso!');
      } else {
        await api.post('/api/admin/users', {
          login: trimmedLogin,
          senha: formData.senha,
          confirmarSenha: formData.confirmarSenha,
          perfil: formData.perfil,
          nome: trimmedNome,
          nome_completo: trimmedNomeCompleto,
          email: trimmedEmail,
        });
        toast.success('Usuario criado com sucesso!');
      }

      onSave();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        const validation = (err.response.data.errors as Array<{ field: string; message: string }>).reduce<ValidationErrors>((acc, item) => {
          acc[item.field] = item.message;
          return acc;
        }, {});
        setFormErrors(validation);
        toast.error('Verifique os campos destacados.');
      } else {
        const message = err.response?.data?.message || 'Ocorreu um erro ao salvar o usuario.';
        toast.error(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome_completo">Nome completo</Label>
        <Input
          id="nome_completo"
          name="nome_completo"
          value={formData.nome_completo}
          onChange={handleInputChange}
          placeholder="Digite o nome completo"
          required
        />
        {formErrors.nome_completo && <FormError message={formErrors.nome_completo} />}
      </div>

      <div>
        <Label htmlFor="nome">Nome</Label>
        <Input
          id="nome"
          name="nome"
          value={formData.nome}
          onChange={handleInputChange}
          placeholder="Digite o nome"
          required
        />
        {formErrors.nome && <FormError message={formErrors.nome} />}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="Digite o email"
          required
        />
        {formErrors.email && <FormError message={formErrors.email} />}
      </div>

      <div>
        <Label htmlFor="login">Login</Label>
        <Input
          ref={loginInputRef}
          id="login"
          name="login"
          value={formData.login}
          onChange={handleInputChange}
          placeholder="Digite o login"
          required
        />
        {formErrors.login && <FormError message={formErrors.login} />}
      </div>

      <div>
        <Label htmlFor="senha">Senha {editingUser && <span className="text-sm text-textSecondary">(opcional)</span>}</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          value={formData.senha}
          onChange={handleInputChange}
          placeholder={editingUser ? 'Informe uma nova senha (opcional)' : 'Informe a senha'}
          required={!editingUser}
        />
        {formErrors.senha && <FormError message={formErrors.senha} />}
      </div>

      <div>
        <Label htmlFor="confirmarSenha">Confirmar senha {editingUser && <span className="text-sm text-textSecondary">(preencha somente ao trocar a senha)</span>}</Label>
        <Input
          id="confirmarSenha"
          name="confirmarSenha"
          type="password"
          value={formData.confirmarSenha}
          onChange={handleInputChange}
          placeholder={editingUser ? 'Repita a nova senha' : 'Repita a senha'}
          required={!editingUser}
        />
        {formErrors.confirmarSenha && <FormError message={formErrors.confirmarSenha} />}
      </div>

      <div>
        <Label htmlFor="perfil">Perfil</Label>
        <select
          id="perfil"
          name="perfil"
          value={formData.perfil}
          onChange={handleInputChange}
          className="mt-1 block w-full rounded-md border border-borderDark/60 bg-cardSlate px-3 py-2 text-sm text-textSecondary shadow-sm focus:border-tagBlue focus:outline-none focus:ring-2 focus-visible:ring-tagBlue"
        >
          <option value="user">Usuario</option>
          <option value="admin">Administrador</option>
        </select>
        {formErrors.perfil && <FormError message={formErrors.perfil} />}
      </div>

      <div className="flex justify-end gap-4">
        <Button
            type="button"
            onClick={onCancel}
            variant="danger"
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
        <Button type="submit" disabled={isSubmitting} className="!bg-emerald-500 hover:!bg-emerald-600 text-white">
          {isSubmitting ? 'Salvando...' : editingUser ? 'Salvar alteracoes' : 'Criar usuario'}
        </Button>
      </div>
    </form>
  );
}


