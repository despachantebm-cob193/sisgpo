import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

// Interfaces genéricas
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
  itemsPerPage = 15,
}: UseCrudOptions) {
  // Estados (sem alteração)
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

  // Funções de busca e controle de UI (sem alteração)
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
  const handleSave = async (itemData: Omit<T, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = itemData.id ? 'atualizado' : 'criado';
    const entityLabel = entityName.endsWith('s') ? entityName.slice(0, -1) : entityName;

    // Cria uma cópia "limpa" do objeto de dados para enviar à API.
    // Isso remove campos como 'id', 'created_at', 'updated_at' que não devem ser enviados no corpo da requisição PUT.
    const { id, ...payload } = itemData;

    try {
      if (id) {
        // Envia o payload limpo para a rota de atualização.
        await api.put(`/api/admin/${entityName}/${id}`, payload);
      } else {
        // Para criação, o payload já está correto.
        await api.post(`/api/admin/${entityName}`, payload);
      }
      toast.success(`${entityLabel.charAt(0).toUpperCase() + entityLabel.slice(1)} ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      // O tratamento de erro já está correto para exibir as mensagens de validação.
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
      await api.delete(`/api/admin/${entityName}/${itemToDeleteId}`);
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
