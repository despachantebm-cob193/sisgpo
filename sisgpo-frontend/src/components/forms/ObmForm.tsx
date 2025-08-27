import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';

// CORREÇÃO 1: Usar um tipo mais preciso para os dados do formulário.
// Omit<Obm, 'id'> pega todos os campos de Obm, exceto 'id'.
// '& { id?: number }' adiciona de volta o 'id' como opcional.
// Isso representa perfeitamente um objeto que pode ser para criação (sem id) ou edição (com id).
type ObmFormData = Omit<Obm, 'id'> & { id?: number };

// Interface da OBM que o formulário manipula internamente
interface Obm {
  id?: number;
  nome: string;
  abreviatura: string;
  cidade: string | null; // CORREÇÃO 2: Alinhado com a página principal
  ativo: boolean;
}

interface ObmFormProps {
  obmToEdit?: Obm | null;
  onSave: (obm: ObmFormData) => void; // CORREÇÃO 3: A função onSave espera os dados do formulário
  onCancel: () => void;
  isLoading: boolean;
}

const ObmForm: React.FC<ObmFormProps> = ({ obmToEdit, onSave, onCancel, isLoading }) => {
  // CORREÇÃO 4: O estado inicial agora corresponde à interface corrigida.
  const [formData, setFormData] = useState<Obm>({
    nome: '',
    abreviatura: '',
    cidade: null, // Inicia como null
    ativo: true,
  });

  useEffect(() => {
    if (obmToEdit) {
      setFormData(obmToEdit);
    } else {
      setFormData({ nome: '', abreviatura: '', cidade: null, ativo: true });
    }
  }, [obmToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="nome">Nome da OBM</Label>
        <Input id="nome" name="nome" value={formData.nome} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="abreviatura">Abreviatura</Label>
        <Input id="abreviatura" name="abreviatura" value={formData.abreviatura} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="cidade">Cidade</Label>
        <Input id="cidade" name="cidade" value={formData.cidade || ''} onChange={handleChange} />
      </div>
      <div className="flex items-center">
        <input id="ativo" name="ativo" type="checkbox" checked={formData.ativo} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <Label htmlFor="ativo" className="ml-2 mb-0">Ativa</Label>
      </div>
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-gray-500 hover:bg-gray-600">
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default ObmForm;
