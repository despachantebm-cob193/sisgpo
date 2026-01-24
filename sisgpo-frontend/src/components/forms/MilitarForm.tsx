import React, { useState, useEffect, FormEvent } from 'react';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import FormError from '../ui/FormError';
import Select from '../ui/Select';
import type { Militar, Obm, ValidationError } from '@/types/entities';
import { Camera, X } from 'lucide-react';
import api from '@/services/api';
import Spinner from '../ui/Spinner';
import { toast } from 'react-hot-toast';

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
  obm_id: string;
  ativo: 'ativo' | 'inativo';
  telefone: string;
  foto_url: string;
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
  obm_id: '',
  ativo: 'ativo',
  telefone: '',
  foto_url: '',
});

const mapInitialData = (data: Militar): MilitarFormState => ({
  matricula: data.matricula ?? '',
  nome_completo: data.nome_completo ?? '',
  nome_guerra: data.nome_guerra ?? '',
  posto_graduacao: data.posto_graduacao ?? '',
  obm_id: data.obm_id?.toString() ?? '',
  ativo: data.ativo ? 'ativo' : 'inativo',
  telefone: data.telefone ?? '',
  foto_url: data.foto_url ?? '',
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData(mapInitialData(initialData));
      if (initialData.foto_url) {
        setPreviewUrl(initialData.foto_url);
      }
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validação de tamanho (2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("A imagem deve ter no máximo 2MB.");
        return;
      }

      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormData((prev) => ({ ...prev, foto_url: '' })); // Limpa URL antiga para indicar novo upload
    }
  };

  const handleRemovePhoto = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData((prev) => ({ ...prev, foto_url: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    let finalFotoUrl = formData.foto_url;

    // Upload da foto se houver nova seleção
    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);

        const response = await api.post('/api/admin/upload/photo', uploadFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        finalFotoUrl = response.data.url;
      } catch (error) {
        console.error('Erro no upload:', error);
        toast.error('Erro ao fazer upload da foto.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    const payload: Record<string, unknown> = {
      id: initialData?.id,
      matricula: formData.matricula.trim(),
      nome_completo: formData.nome_completo.trim(),
      posto_graduacao: formData.posto_graduacao.trim(),
      ativo: formData.ativo === 'ativo',
      foto_url: finalFotoUrl || null
    };

    if (formData.obm_id) {
      const obmIdAsNumber = parseInt(formData.obm_id, 10);
      if (!isNaN(obmIdAsNumber)) {
        payload.obm_id = obmIdAsNumber;
      }
    } else if (initialData?.id) {
      payload.obm_id = null;
    }

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
      {/* Photo Upload Area */}
      <div className="flex justify-center mb-6">
        <div className="relative group">
          <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all duration-300 ${previewUrl ? 'border-cyan-500 bg-slate-900' : 'border-slate-600 hover:border-cyan-500/50 hover:bg-slate-800'}`}>
            {isUploading ? (
              <Spinner className="w-8 h-8 text-cyan-500" />
            ) : previewUrl ? (
              <img src={previewUrl} alt="Foto do Militar" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-2">
                <Camera className="w-8 h-8 text-slate-500 mx-auto mb-1 group-hover:text-cyan-400 transition-colors" />
                <span className="text-[10px] text-slate-500 font-mono uppercase group-hover:text-cyan-400">Adicionar Foto</span>
              </div>
            )}
          </div>

          {/* Hidden Input */}
          <input
            type="file"
            id="foto-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isSaving || isUploading}
          />

          {/* Actions */}
          {!isUploading && (
            <div className="absolute -bottom-2 -right-2 flex gap-2">
              <label
                htmlFor="foto-upload"
                className="bg-cyan-600 hover:bg-cyan-500 text-white p-2 rounded-full shadow-lg cursor-pointer transition-transform hover:scale-105"
                title="Alterar foto"
              >
                <Camera size={14} />
              </label>
              {previewUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105"
                  title="Remover foto"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
        <Button type="button" onClick={onSuccess} variant="danger">
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving || isUploading ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </form>
  );
};

export default MilitarForm;
