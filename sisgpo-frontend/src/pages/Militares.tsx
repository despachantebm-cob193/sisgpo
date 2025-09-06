// Arquivo: frontend/src/pages/Militares.tsx (Versão Otimizada com Paginação)

import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useVirtualizer } from '@tanstack/react-virtual';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination'; // Importa o novo componente
import { Edit, Trash2 } from 'lucide-react';

// Interfaces
interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string | null;
  posto_graduacao: string;
  ativo: boolean;
  obm_id: number | null;
  obm_abreviatura?: string;
}
interface PaginationState {
  currentPage: number;
  totalPages: number;
}
interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState | null;
}

export default function Militares() {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modais e ações (sem alteração)
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Militar | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Remove o 'all=true' e adiciona os parâmetros de paginação
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '50', // Carrega 50 por vez, pode ser ajustado
        ...filters,
      });
      const response = await api.get<ApiResponse<Militar>>(`/api/admin/militares?${params.toString()}`);
      
      setMilitares(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar os dados dos militares.');
      setMilitares([]);
      setPagination(null);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ nome_completo: e.target.value });
    setCurrentPage(1); // Reseta para a primeira página ao filtrar
  };

  // Funções de controle de modal e CRUD (sem alteração na lógica interna)
  const handleOpenFormModal = (item: Militar | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) {
        await api.put(`/api/admin/militares/${data.id}`, data);
      } else {
        await api.post('/api/admin/militares', data);
      }
      toast.success(`Militar ${action} com sucesso!`);
      handleCloseFormModal();
      await fetchData(); 
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error(err.response.data.errors[0]?.message || 'Corrija os erros.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/militares/${itemToDeleteId}`);
      toast.success('Militar excluído!');
      await fetchData(); 
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  const gridTemplateColumns = "1.5fr 1.5fr 1fr 1fr 1fr 0.5fr";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Efetivo (Militares)</h2>
          <p className="text-gray-600 mt-2">Gerencie o efetivo de militares da corporação.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Militar</Button>
      </div>
      <Input
        type="text"
        placeholder="Filtrar por nome..."
        value={filters.nome_completo}
        onChange={handleFilterChange}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div style={{ display: 'grid', gridTemplateColumns }} className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Completo</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome de Guerra</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto/Grad.</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        <div className="overflow-y-auto" style={{ height: '65vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : militares.length > 0 ? (
            militares.map(militar => (
              <div
                key={militar.id}
                style={{ display: 'grid', gridTemplateColumns }}
                className="items-center border-b border-gray-200"
              >
                <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{militar.nome_completo}</div>
                <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.nome_guerra || 'N/A'}</div>
                <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.posto_graduacao}</div>
                <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.matricula}</div>
                <div className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {militar.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                  <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => handleDeleteClick(militar.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center h-full"><p className="text-gray-500">Nenhum militar encontrado.</p></div>
          )}
        </div>
        
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm militarToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este militar? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
