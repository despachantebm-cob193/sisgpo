import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Interfaces
interface Entity {
  id: number;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination?: PaginationState; // Paginação é opcional
}

interface UseCrudOptions {
  entityName: string;
  initialFilters?: Record<string, string>;
  itemsPerPage?: number;
  endpoint?: string; // Endpoint customizado
}

export function useCrud<T extends Entity>({
  entityName,
  initialFilters = {},
  itemsPerPage = 15,
  endpoint,
}: UseCrudOptions) {
  // Estados
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

  const apiEndpoint = endpoint || `/api/admin/${entityName}`;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...filters,
      });
      
      const url = endpoint ? apiEndpoint : `${apiEndpoint}?${params.toString()}`;
      
      const response = await api.get<ApiResponse<T> | T[]>(url);
      
      if (Array.isArray(response.data)) {
        setData(response.data);
        setPagination(null);
      } else if (response.data && 'data' in response.data) {
        setData(response.data.data);
        setPagination(response.data.pagination || null);
      }
    } catch (err) {
      toast.error(`Não foi possível carregar os dados de ${entityName}.`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, entityName, filters, apiEndpoint, endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Funções de UI
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

  // --- FUNÇÃO HANDLESAVE CORRIGIDA ---
  // A tipagem do 'itemData' foi ajustada para Partial<T> para ser compatível
  const handleSave = async (itemData: Partial<T> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const { id, ...payload } = itemData;
    const action = id ? 'atualizado' : 'criado';
    const entityLabel = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName;

    try {
      if (id) {
        await api.put(`${apiEndpoint}/${id}`, payload);
      } else {
        await api.post(apiEndpoint, payload);
      }
      toast.success(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || `Erro ao salvar ${entityLabel}.`;
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };
  // --- FIM DA CORREÇÃO ---

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    const entityLabel = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName;
    try {
      await api.delete(`${apiEndpoint}/${itemToDeleteId}`);
      toast.success(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} excluído com sucesso!`);
      if (data.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Erro ao excluir ${entityLabel}.`);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  return {
    data,
    isLoading,
    pagination,
    filters,
    isFormModalOpen,
    itemToEdit,
    isSaving,
    isConfirmModalOpen,
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