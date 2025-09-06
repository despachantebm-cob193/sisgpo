import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useVirtualizer } from '@tanstack/react-virtual';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import CivilForm from '../components/forms/EscalaForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Edit, Trash2 } from 'lucide-react';

// --- INTERFACE ATUALIZADA PARA A ESCALA DE SERVIÇO ---
interface EscalaServico {
  id: number;
  nome_completo: string;
  funcao: string;
  entrada_servico: string;
  saida_servico: string;
  status_servico: 'Presente' | 'Ausente';
  observacoes: string;
  ativo: boolean;
}

interface ApiResponse<T> {
  data: T[];
}

export default function EscalaMedicos() { // Nome do componente atualizado para clareza
  const [registros, setRegistros] = useState<EscalaServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<EscalaServico | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const response = await api.get<ApiResponse<EscalaServico>>(`/api/admin/civis?${params.toString()}`);
      setRegistros(response.data.data || []);
    } catch (err) {
      toast.error('Não foi possível carregar os registros da escala.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: registros.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58, // Manter uma estimativa base
    overscan: 10,
  });

  const handleOpenFormModal = (item: EscalaServico | null = null) => {
    setItemToEdit(item);
    setValidationErrors([]);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) {
        await api.put(`/api/admin/civis/${data.id}`, data);
      } else {
        await api.post('/api/admin/civis', data);
      }
      toast.success(`Registro de escala ${action} com sucesso!`);
      handleCloseFormModal();
      await fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        const firstErrorMessage = err.response.data.errors[0]?.message || 'Corrija os erros.';
        toast.error(firstErrorMessage);
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar o registro.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/civis/${itemToDeleteId}`);
      toast.success('Registro excluído!');
      await fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir o registro.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  // Função para formatar data e hora para exibição
  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const gridTemplateColumns = "1.5fr 1fr 1fr 1fr 1fr 1.5fr 0.5fr";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Escala de Serviço (Médicos)</h2>
          <p className="text-gray-600 mt-2">Gerencie a escala de serviço dos médicos reguladores e tripulantes.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Registro</Button>
      </div>
      <Input
        type="text"
        placeholder="Filtrar por nome..."
        value={filters.nome_completo}
        onChange={(e) => setFilters({ nome_completo: e.target.value })}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div style={{ display: 'grid', gridTemplateColumns }} className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saída</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        <div ref={parentRef} className="overflow-y-auto" style={{ height: '70vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const registro = registros[virtualItem.index];
                if (!registro) return null;
                return (
                  <div
                    key={registro.id}
                    data-index={virtualItem.index}
                    style={{
                      position: 'absolute', top: 0, left: 0, width: '100%',
                      height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)`,
                      display: 'grid', gridTemplateColumns,
                    }}
                    className="items-center border-b border-gray-200"
                  >
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registro.nome_completo}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.funcao}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(registro.entrada_servico)}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(registro.saida_servico)}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${registro.status_servico === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {registro.status_servico}
                      </span>
                    </div>
                    <div className="px-6 py-4 text-sm text-gray-500 truncate" title={registro.observacoes}>{registro.observacoes || '-'}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenFormModal(registro)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(registro.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Registro de Escala' : 'Adicionar Registro na Escala'}>
        <CivilForm civilToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro da escala? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
