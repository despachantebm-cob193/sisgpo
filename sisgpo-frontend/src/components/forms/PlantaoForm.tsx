// Arquivo: frontend/src/components/forms/PlantaoForm.tsx (VERSÃO COM LAYOUT CORRIGIDO)

import React, { useState, useEffect, FormEvent, ChangeEvent, useCallback } from 'react';
import AsyncSelect from 'react-select/async';
import Input from '../ui/Input';
import Label from '../ui/Label';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import api from '../../services/api';

// Importando os tipos do arquivo da página para garantir consistência
import { Viatura, PlantaoDetalhado, GuarnicaoMembro } from '../../pages/Plantoes';

interface MilitarOption {
  value: number;
  label: string;
  militar: {
    id: number;
    posto_graduacao: string | null;
    nome_guerra: string | null;
    nome_completo: string | null;
    nome_exibicao: string;
    telefone: string | null;
  };
}

interface PlantaoFormData {
  id?: number;
  data_plantao: string;
  hora_inicio: string;
  hora_fim: string;
  viatura_id: number | '';
  obm_id: number | '' | null;
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}

interface PlantaoFormProps {
  plantaoToEdit?: PlantaoDetalhado | null;
  viaturas: Viatura[];
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

// Função de máscara para o telefone
const formatarTelefoneInput = (value: string): string => {
  if (!value) return '';
  const digitos = value.replace(/\D/g, '');
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6, 10)}`;
};

const formatarHorarioParaInput = (valor?: string | null): string => {
  if (!valor) return '';
  const [hora, minuto] = valor.split(':');
  if (!hora || !minuto) return '';
  return `${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}`;
};

const PlantaoForm: React.FC<PlantaoFormProps> = ({ plantaoToEdit, viaturas, onSave, onCancel, isLoading }) => {
  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: '#1E1E1E', // bg-searchbar
      borderColor: '#1F1F1F', // border-borderDark/60
      color: '#D3D3D3', // text-textMain
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#007AFF', // focus:border-tagBlue
      },
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: '#1E1E1E', // bg-searchbar
      borderColor: '#1F1F1F', // border-borderDark/60
    }),
    option: (provided: any, state: { isSelected: any; isFocused: any; }) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? '#39436F' // bg-cardBlue
        : state.isFocused
        ? '#39436F' // hover:bg-cardBlue
        : '#1E1E1E', // bg-searchbar
      color: '#D3D3D3', // text-textMain
      '&:active': {
        backgroundColor: '#39436F', // bg-cardBlue
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#D3D3D3', // text-textMain
    }),
    input: (provided: any) => ({
      ...provided,
      color: '#D3D3D3', // text-textMain
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9E9E9E', // text-textSecondary
    }),
  };

  const getInitialGuarnicaoMembro = (): GuarnicaoMembro => ({
    militar_id: null,
    nome_completo: '',
    nome_exibicao: 'Selecione um militar...',
    posto_graduacao: '',
    funcao: '',
    telefone: '',
  });

  const getInitialFormData = (): PlantaoFormData => ({
    data_plantao: new Date().toISOString().split('T')[0],
    hora_inicio: '',
    hora_fim: '',
    viatura_id: '',
    obm_id: '',
    observacoes: '',
    guarnicao: [getInitialGuarnicaoMembro()],
  });

  const [formData, setFormData] = useState<PlantaoFormData>(getInitialFormData());

  useEffect(() => {
    if (plantaoToEdit) {
      setFormData({
        id: plantaoToEdit.id,
        data_plantao: new Date(plantaoToEdit.data_plantao).toISOString().split('T')[0],
        hora_inicio: formatarHorarioParaInput(plantaoToEdit.hora_inicio),
        hora_fim: formatarHorarioParaInput(plantaoToEdit.hora_fim),
        viatura_id: plantaoToEdit.viatura_id,
        obm_id: plantaoToEdit.obm_id,
        observacoes: plantaoToEdit.observacoes,
        guarnicao: plantaoToEdit.guarnicao?.map(m => {
          const exibicao = (m.nome_exibicao || m.nome_completo || m.nome_guerra || '').trim();
          return {
            militar_id: m.militar_id,
            nome_completo: exibicao,
            nome_exibicao: exibicao,
            posto_graduacao: m.posto_graduacao ?? '',
            funcao: m.funcao,
            telefone: m.telefone ? formatarTelefoneInput(m.telefone) : '',
          };
        }) || [],
      });
    } else {
      setFormData(getInitialFormData());
    }
  }, [plantaoToEdit]);

  const loadMilitarOptions = (inputValue: string, callback: (options: MilitarOption[]) => void) => {
    if (!inputValue || inputValue.length < 2) return callback([]);
    api.get(`/api/admin/militares/search?term=${inputValue}`)
      .then(res => callback(res.data))
      .catch(() => callback([]));
  };

  const handleMilitarSelectChange = (index: number, selectedOption: MilitarOption | null) => {
    const novaGuarnicao = [...formData.guarnicao];
    if (selectedOption) {
      const exibicao = (selectedOption.militar.nome_exibicao || selectedOption.label || selectedOption.militar.nome_completo || selectedOption.militar.nome_guerra || '').trim();
      novaGuarnicao[index] = {
        ...novaGuarnicao[index],
        militar_id: selectedOption.value,
        nome_completo: exibicao,
        nome_exibicao: exibicao,
        posto_graduacao: selectedOption.militar.posto_graduacao ?? '',
        funcao: novaGuarnicao[index].funcao, // Manter função existente
        telefone: selectedOption.militar.telefone ? formatarTelefoneInput(selectedOption.militar.telefone) : '',
      };
    } else {
      novaGuarnicao[index] = getInitialGuarnicaoMembro();
    }
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const handleGuarnicaoInputChange = (index: number, field: 'funcao' | 'telefone', value: string) => {
    const novaGuarnicao = [...formData.guarnicao];
    if (field === 'telefone') {
      novaGuarnicao[index][field] = formatarTelefoneInput(value);
    } else {
      novaGuarnicao[index][field] = value;
    }
    setFormData(prev => ({ ...prev, guarnicao: novaGuarnicao }));
  };

  const adicionarMembro = () => setFormData(prev => ({ ...prev, guarnicao: [...prev.guarnicao, getInitialGuarnicaoMembro()] }));
  const removerMembro = (index: number) => {
    if (formData.guarnicao.length > 1) {
      setFormData(prev => ({ ...prev, guarnicao: prev.guarnicao.filter((_, i) => i !== index) }));
    }
  };

  const verificarPlantaoDuplicado = useCallback(
    async (dataPlantao: string, viaturaId: number, viaturaPrefixo?: string | null) => {
      try {
        const params = new URLSearchParams({
          data_inicio: dataPlantao,
          data_fim: dataPlantao,
          limit: '500',
          all: 'true',
        });
        const response = await api.get(`/api/admin/plantoes?${params.toString()}`);
        const lista =
          Array.isArray(response.data?.data) ? response.data.data : response.data?.data ? response.data.data : response.data;
        const normalizedPrefix = viaturaPrefixo?.trim().toUpperCase() || '';
        return Array.isArray(lista)
          ? lista.some((plantao: any) => {
              const prefix =
                plantao.viatura_prefixo ||
                plantao.prefixo ||
                plantao.viatura?.prefixo ||
                '';
              const normalized = prefix.trim().toUpperCase();
              const plantaoViaturaId = Number(
                plantao.viatura_id ??
                  plantao.viaturaId ??
                  plantao.viatura?.id
              );
              return (
                (normalizedPrefix && normalized === normalizedPrefix) ||
                (Number.isFinite(plantaoViaturaId) && plantaoViaturaId === viaturaId)
              );
            })
          : false;
      } catch (error) {
        console.error('Erro ao verificar plantão duplicado', error);
        return false;
      }
    },
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const guarnicaoValida = formData.guarnicao.every(m => m.militar_id && m.funcao);
    if (!guarnicaoValida) {
      toast.error('Verifique se todos os militares foram selecionados e se todas as funções foram preenchidas.');
      return;
    }
    const viaturaSelecionada = viaturas.find(v => v.id === formData.viatura_id);
    if (!viaturaSelecionada) {
      toast.error('Por favor, selecione uma viatura.');
      return;
    }

    const duplicate = await verificarPlantaoDuplicado(
      formData.data_plantao,
      Number(formData.viatura_id),
      viaturaSelecionada.prefixo
    );
    if (duplicate && !formData.id) {
      toast.error('Já existe um plantão para esta viatura nesta data.');
      return;
    }

    const obmIdFromState = typeof formData.obm_id === 'number' ? formData.obm_id : null;
    const obmId = viaturaSelecionada.obm_id ?? obmIdFromState;

    if (obmId === null || obmId === undefined) {
      toast.error('A viatura selecionada não está vinculada a uma OBM. Atualize o cadastro da viatura ou selecione outra antes de lançar o plantão.');
      return;
    }

    const payload = {
      ...formData,
      hora_inicio: formData.hora_inicio || null,
      hora_fim: formData.hora_fim || null,
      obm_id: obmId,
      guarnicao: formData.guarnicao.map(({ militar_id, funcao, telefone }) => ({
        militar_id,
        funcao,
        telefone: telefone.replace(/\D/g, ''),
      })),
    };
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção de Data e Viatura (permanece no topo) */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="data_plantao">Data do Plantão</Label>
          <Input id="data_plantao" type="date" value={formData.data_plantao} onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, data_plantao: e.target.value }))} required />
        </div>
        <div>
          <Label htmlFor="viatura_id">Viatura</Label>
          <select
            id="viatura_id"
            value={formData.viatura_id}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => {
              const { value } = e.target;
              if (!value) {
                setFormData(prev => ({ ...prev, viatura_id: '', obm_id: '' }));
                return;
              }

              const selectedId = Number(value);
              const viatura = viaturas.find(v => v.id === selectedId) || null;

              setFormData(prev => ({
                ...prev,
                viatura_id: selectedId,
                obm_id: viatura?.obm_id ?? null,
              }));
            }}
            required
            className="w-full px-3 py-2 border border-borderDark/60 rounded-md shadow-sm"
          >
            <option value="">Selecione uma viatura</option>
            {viaturas?.map(vtr => (<option key={vtr.id} value={vtr.id}>{vtr.prefixo}</option>))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="hora_inicio">Horario inicial</Label>
          <Input
            id="hora_inicio"
            type="time"
            value={formData.hora_inicio}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="hora_fim">Horario final</Label>
          <Input
            id="hora_fim"
            type="time"
            value={formData.hora_fim}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, hora_fim: e.target.value }))}
          />
        </div>
      </div>

      {/* Seção da Guarnição */}
      <div>
        <Label className="mb-2">Guarnição</Label>
        <div className="space-y-4">
          {formData.guarnicao.map((membro, index) => (
            <div key={index} className="p-4 border rounded-lg bg-searchbar relative">
              {/* --- LAYOUT VERTICAL PARA CADA MEMBRO --- */}
              <div className="space-y-4">
                {/* Linha 1: Busca Militar */}
                <div>
                  <Label htmlFor={`militar-select-${index}`}>Buscar Militar</Label>
                  <AsyncSelect
                    id={`militar-select-${index}`}
                    cacheOptions
                    loadOptions={loadMilitarOptions}
                    defaultOptions
                    isClearable
                    placeholder="Nome, guerra ou matrícula..."
                    value={membro.militar_id ? { value: membro.militar_id, label: membro.nome_exibicao } : null}
                    onChange={(option) => handleMilitarSelectChange(index, option as MilitarOption)}
                    noOptionsMessage={({ inputValue }) => inputValue.length < 2 ? 'Digite pelo menos 2 caracteres' : 'Nenhum militar encontrado'}
                    styles={customStyles}
                  />
                </div>

                {/* Linha 2: Telefone e Função */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`telefone-${index}`}>Telefone</Label>
                    <Input
                      id={`telefone-${index}`}
                      type="text"
                      placeholder="(XX) XXXX-XXXX"
                      value={membro.telefone ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => handleGuarnicaoInputChange(index, 'telefone', e.target.value)}
                      maxLength={14}
                      disabled={!membro.militar_id}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`funcao-${index}`}>Função</Label>
                    <Input id={`funcao-${index}`} type="text" placeholder="Ex: Motorista" value={membro.funcao} onChange={(e: ChangeEvent<HTMLInputElement>) => handleGuarnicaoInputChange(index, 'funcao', e.target.value)} required />
                  </div>
                </div>
              </div>
              {/* --- FIM DO LAYOUT VERTICAL --- */}

              {/* Botão de remover */}
              {formData.guarnicao.length > 1 && (
                <div className="absolute top-2 right-2">
                  <Button type="button" onClick={() => removerMembro(index)} className="!w-auto !p-2 bg-spamRed hover:bg-spamRed/80" title="Remover Militar">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <Button type="button" onClick={adicionarMembro} variant="primary" className="mt-3 !w-auto text-sm">Adicionar Militar à Guarnição</Button>
      </div>

      {/* Seção de Observações */}
      <div>
        <Label htmlFor="observacoes">Observações</Label>
        <textarea id="observacoes" value={formData.observacoes} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))} rows={3} className="w-full px-3 py-2 border border-borderDark/60 rounded-md shadow-sm" />
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-4 pt-4">
        <Button type="button" onClick={onCancel} variant="danger">Cancelar</Button>
        <Button type="submit" disabled={isLoading} className="bg-cardGreen hover:bg-cardGreen/80 text-textMain">{isLoading ? 'Salvando...' : 'Salvar Plantão'}</Button>
      </div>
    </form>
  );
};

export default PlantaoForm;
export { PlantaoForm };

