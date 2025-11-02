import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';

// --- INTERFACE ATUALIZADA PARA A ESCALA DE SERVIÇO ---
interface EscalaServico {
  id?: number;
  nome_completo: string;
  funcao: string;
  entrada_servico: string; // Usaremos string para facilitar o controle do input datetime-local
  saida_servico: string;
  status_servico: 'Presente' | 'Ausente';
  observacoes: string;
  ativo: boolean; // Mantemos para desativar o registro se necessário
}

interface ValidationError {
  field: string;
  message: string;
}

interface CivilFormProps {
  civilToEdit?: EscalaServico | null;
  onSave: (data: Omit<EscalaServico, 'id'> & { id?: number }) => void;
  onCancel: () => void;
  isLoading: boolean;
  errors?: ValidationError[];
}

// Função para formatar a data para o input datetime-local
const formatDateTimeForInput = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  // Formato YYYY-MM-DDTHH:mm
  return date.toISOString().slice(0, 16);
};

const CivilForm: React.FC<CivilFormProps> = ({ civilToEdit, onSave, onCancel, isLoading, errors = [] }) => {
  const getInitialState = (): EscalaServico => ({
    nome_completo: '',
    funcao: '',
    entrada_servico: '',
    saida_servico: '',
    status_servico: 'Presente',
    observacoes: '',
    ativo: true,
  });

  const [formData, setFormData] = useState<EscalaServico>(getInitialState());

  const getError = (field: string) => errors.find(e => e.field === field)?.message;

  useEffect(() => {
    if (civilToEdit) {
      setFormData({
        ...civilToEdit,
        // Formata as datas para o formato que o input espera
        entrada_servico: formatDateTimeForInput(civilToEdit.entrada_servico),
        saida_servico: formatDateTimeForInput(civilToEdit.saida_servico),
      });
    } else {
      setFormData(getInitialState());
    }
  }, [civilToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="nome_completo">Nome do Médico</Label>
          <Input id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required hasError={!!getError('nome_completo')} />
          <FormError message={getError('nome_completo')} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="funcao">Função</Label>
            <Input id="funcao" name="funcao" value={formData.funcao} onChange={handleChange} required placeholder="Ex: Regulação COB" hasError={!!getError('funcao')} />
            <FormError message={getError('funcao')} />
          </div>
          <div>
            <Label htmlFor="status_servico">Status</Label>
            <select id="status_servico" name="status_servico" value={formData.status_servico} onChange={handleChange} required className={`w-full px-3 py-2 border rounded-md shadow-sm ${getError('status_servico') ? 'border-red-500' : 'border-borderDark/60'}`}>
              <option value="Presente">Presente</option>
              <option value="Ausente">Ausente</option>
            </select>
            <FormError message={getError('status_servico')} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <Label htmlFor="entrada_servico">Entrada do Serviço</Label>
                <Input id="entrada_servico" name="entrada_servico" type="datetime-local" value={formData.entrada_servico} onChange={handleChange} required hasError={!!getError('entrada_servico')} />
                <FormError message={getError('entrada_servico')} />
            </div>
            <div>
                <Label htmlFor="saida_servico">Saída do Serviço</Label>
                <Input id="saida_servico" name="saida_servico" type="datetime-local" value={formData.saida_servico} onChange={handleChange} required hasError={!!getError('saida_servico')} />
                <FormError message={getError('saida_servico')} />
            </div>
        </div>

        <div>
          <Label htmlFor="observacoes">Observações</Label>
          <textarea id="observacoes" name="observacoes" value={formData.observacoes} onChange={handleChange} rows={3} className="w-full px-3 py-2 border border-borderDark/60 rounded-md shadow-sm" placeholder="Ex: Troca de serviço com Dr. Ciclano..."></textarea>
          <FormError message={getError('observacoes')} />
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} className="bg-searchbar hover:bg-searchbar">Cancelar</Button>
        <Button type="submit" disabled={isLoading}>{isLoading ? 'Salvando...' : 'Salvar'}</Button>
      </div>
    </form>
  );
};

export default CivilForm;

