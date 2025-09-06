// Arquivo: frontend/src/pages/EscalaMedicos.tsx (Versão Otimizada com Paginação)

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import EscalaForm from '../components/forms/EscalaForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination'; // Importa o componente de paginação
import { Edit, Trash2 } from 'lucide-react';

// Interfaces
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
interface PaginationState {
  currentPage: number;
  totalPages: number;
}
interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState | null;
}

export default function EscalaMedicos() {
  const [registros, setRegistros] = useState<EscalaServico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modais e ações
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
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20', // Carrega 20 por vez
        ...filters,
      });
      // A rota da API ainda é /civis
      const response = await api.get<ApiResponse<EscalaServico>>(`/api/admin/civis?${params.toString()}`);
      setRegistros(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar os registros da escala.');
      setRegistros([]);
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

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
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
        onChange={handleFilterChange}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saída</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Observações</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : registros.length > 0 ? (
                registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{registro.nome_completo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{registro.funcao}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(registro.entrada_servico)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDateTime(registro.saida_servico)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${registro.status_servico === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {registro.status_servico}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs" title={registro.observacoes}>{registro.observacoes || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenFormModal(registro)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(registro.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500">Nenhum registro encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Registro de Escala' : 'Adicionar Registro na Escala'}>
        <EscalaForm civilToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro da escala? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
