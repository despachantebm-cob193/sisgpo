// Arquivo: frontend/src/hooks/useCrud.ts (Corrigido)

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

// ... (Interfaces não foram alteradas)
interface Entity {
  id: number;
}
interface PaginationState {
  currentPage: number;
  totalPages: number;
}
interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState;
}
interface UseCrudOptions {
  entityName: string;
  initialFilters?: Record<string, string>;
  itemsPerPage?: number;
}

export function useCrud<T extends Entity>({
  entityName,
  initialFilters = {},
  itemsPerPage = 10,
}: UseCrudOptions) {
  // --- Estados Genéricos (sem alterações) ---
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // --- Lógica de Busca (sem alterações na função em si) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...filters,
      });
      
      const response = await api.get<ApiResponse<T>>(`/api/admin/${entityName}?${params.toString()}`);
      
      setData(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error(`Não foi possível carregar os dados de ${entityName}.`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, entityName, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Funções de Manipulação (sem alterações) ---
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };
  const handleOpenFormModal = (item: T | null = null) => {
    setItemToEdit(item);
    setValidationErrors([]);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => { setIsFormModalOpen(false); setItemToEdit(null); };
  const handleDeleteClick = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setItemToDeleteId(null); };
  const handleSave = async (itemData: Omit<T, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = itemData.id ? 'atualizado' : 'criado';
    try {
      if (itemData.id) {
        await api.put(`/api/admin/${entityName}/${itemData.id}`, itemData);
      } else {
        await api.post(`/api/admin/${entityName}`, itemData);
      }
      toast.success(`${entityName.slice(0, -1)} ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || `Erro ao salvar.`;
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };
  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/${entityName}/${itemToDeleteId}`);
      toast.success(`${entityName.slice(0, -1)} excluído com sucesso!`);
      if (data.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Erro ao excluir.`);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  // --- Retorno do Hook (CORRIGIDO) ---
  return {
    data,
    isLoading,
    pagination,
    currentPage,
    filters,
    isFormModalOpen,
    itemToEdit,
    isSaving,
    isConfirmModalOpen,
    itemToDeleteId,
    isDeleting,
    validationErrors,
    fetchData, // <-- CORREÇÃO: Adicionando fetchData ao objeto de retorno
    handlePageChange,
    handleFilterChange,
    handleOpenFormModal,
    handleCloseFormModal,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleSave,
    handleConfirmDelete,
  };
}
