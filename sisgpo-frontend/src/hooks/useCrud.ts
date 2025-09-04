// Arquivo: frontend/src/hooks/useCrud.ts

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Interfaces genéricas que servem para qualquer entidade
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

// O hook customizado
export function useCrud<T extends Entity>({
  entityName,
  initialFilters = {},
  itemsPerPage = 10,
}: UseCrudOptions) {
  // Estados genéricos
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);

  // Estados para modais e ações
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<T | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Função de busca de dados
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

  // Funções de manipulação de estado
  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1); // Reseta para a primeira página ao aplicar um filtro
  };

  const handleOpenFormModal = (item: T | null = null) => {
    setItemToEdit(item);
    setValidationErrors([]);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setItemToEdit(null);
  };

  const handleDeleteClick = (id: number) => {
    setItemToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleCloseConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setItemToDeleteId(null);
  };

  // Funções de CRUD
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
      fetchData(); // Recarrega os dados após salvar
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
      // Se for o último item de uma página, volta para a página anterior
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

  // Retorna todos os estados e funções para serem usados no componente
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
    fetchData,
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
