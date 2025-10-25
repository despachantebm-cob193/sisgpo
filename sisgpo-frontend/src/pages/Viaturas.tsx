// Arquivo: frontend/src/pages/Viaturas.tsx (VERSÃO CORRIGIDA)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2 } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import FileUpload from '../components/ui/FileUpload';
import { useUiStore } from '@/store/uiStore';

interface Viatura {
  id: number;
  prefixo: string;
  cidade: string | null;
  obm: string | null;
  obm_abreviatura: string | null;
  ativa: boolean;
}
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Viaturas() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Viaturas");
  }, [setPageTitle]);

  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ prefixo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Viatura | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [isClearConfirmModalOpen, setIsClearConfirmModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20', ...filters });
      const response = await api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) { toast.error('Não foi possível carregar as viaturas.'); }
    finally { setIsLoading(false); }
  }, [filters, currentPage]);

  // --- INÍCIO DA CORREÇÃO ---
  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/metadata/viaturas_last_upload');
      const value = response?.data?.value;
      if (!value) {
        setLastUpload(null);
        return;
      }
      const parsedDate = new Date(value);
      if (Number.isNaN(parsedDate.getTime())) {
        console.warn('Valor de upload inválido recebido:', value);
        setLastUpload(null);
        return;
      }
      setLastUpload(parsedDate.toLocaleString('pt-BR'));
    } catch (error: any) {
      // Se o erro for 404 (Não Encontrado), é um cenário esperado.
      // Apenas definimos como nulo e não mostramos um toast de erro.
      if (error.response && error.response.status === 404) {
        setLastUpload(null);
      } else {
        // Para outros erros (como falha de rede), podemos opcionalmente logar.
        console.error("Falha ao buscar metadados de upload:", error);
      }
    }
  }, []);
  // --- FIM DA CORREÇÃO ---

  useEffect(() => { fetchData(); fetchLastUpload(); }, [fetchData, fetchLastUpload]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilters({ prefixo: e.target.value }); setCurrentPage(1); };
  const handleOpenFormModal = (item: Viatura | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: Omit<Viatura, 'id'> & { id?: number; previousObm?: string | null }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    const { id, previousObm, ...payload } = data;
    let applyToDuplicates = false;
    let duplicateCount = 0;

    if (id && previousObm && payload.obm && previousObm !== payload.obm) {
      try {
        const response = await api.get('/api/admin/viaturas/duplicates/count', {
          params: { obm: previousObm, exclude_id: id },
        });
        const duplicates = Number(response.data?.count ?? 0);
        duplicateCount = duplicates;
        if (duplicates > 0) {
          const confirmBulk = window.confirm(
            `Encontramos ${duplicates} outra(s) viatura(s) com o mesmo valor de OBM (${previousObm}). Deseja aplicar esta mesma correção em todas elas?`
          );
          applyToDuplicates = confirmBulk;
        }
      } catch (countError) {
        console.error('Falha ao verificar duplicidades de OBM antes de atualizar viaturas:', countError);
        toast.error('Não foi possível verificar outras viaturas com a mesma OBM. Atualizando apenas esta viatura.');
      }
    }

    try {
      if (id) {
        await api.put(`/api/admin/viaturas/${id}`, {
          ...payload,
          previous_obm: previousObm ?? null,
          applyToDuplicates,
        });
      } else {
        await api.post('/api/admin/viaturas', payload);
      }
      if (applyToDuplicates && duplicateCount > 0) {
        toast.success(`Viatura ${action} com sucesso! ${duplicateCount} registro(s) adicional(is) tambem foram atualizados.`);
      } else {
        toast.success(`Viatura ${action} com sucesso!`);
      }
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error(err.response.data.errors[0]?.message || 'Por favor, corrija os erros.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar a viatura.');
      }
    } finally { setIsSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/viaturas/${itemToDeleteId}`);
      toast.success('Viatura excluída com sucesso!');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir a viatura.'); }
    finally { setIsDeleting(false); handleCloseConfirmModal(); }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/viaturas/upload-csv', formData);
      toast.success(response.data.message || 'Arquivo enviado com sucesso!');
      fetchData();
      fetchLastUpload();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao enviar arquivo.'); }
    finally { setIsUploading(false); }
  };

  const handleClearAllViaturas = async () => {
    setIsClearing(true);
    try {
      await api.delete('/api/admin/viaturas/clear-all');
      toast.success('Tabela de viaturas limpa com sucesso!');
      fetchData();
      fetchLastUpload();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao limpar a tabela de viaturas.'); }
    finally { setIsClearing(false); setIsClearConfirmModalOpen(false); }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Viaturas</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto">Adicionar Viatura</Button>
          <Button onClick={() => setIsClearConfirmModalOpen(true)} className="!bg-red-700 hover:!bg-red-800 w-full md:w-auto">
            <Trash2 className="w-4 h-4 mr-2" /> Limpar Tabela
          </Button>
        </div>
      </div>
      
      <FileUpload
        title="Importar/Atualizar Viaturas"
        onUpload={handleUpload}
        isLoading={isUploading}
        lastUpload={lastUpload}
      />

      <Input type="text" placeholder="Filtrar por prefixo..." value={filters.prefixo} onChange={handleFilterChange} className="w-full md:max-w-xs mb-4" />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 hidden md:table-header-group">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sigla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr
                  key={viatura.id}
                  className={`block md:table-row border-b md:border-none p-4 md:p-0 ${
                    viatura.obm_abreviatura ? '' : 'bg-yellow-50 md:bg-yellow-100'
                  }`}
                  title={viatura.obm_abreviatura ? undefined : 'Esta viatura ainda não está vinculada a uma sigla de OBM.'}
                >
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium text-gray-900" data-label="Prefixo:">{viatura.prefixo}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 text-sm text-gray-500" data-label="OBM:">{viatura.obm || 'N/A'}</td>
                  <td
                    className={`block md:table-cell px-6 py-2 md:py-4 text-sm ${
                      viatura.obm_abreviatura ? 'text-gray-500' : 'text-red-600 font-semibold'
                    }`}
                    data-label="Sigla:"
                  >
                    {viatura.obm_abreviatura || 'N/A'}
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-gray-500" data-label="Cidade:">{viatura.cidade || 'N/A'}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm" data-label="Status:">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viatura.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium space-x-4 mt-2 md:mt-0">
                    <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteClick(viatura.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Nenhuma viatura encontrada.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
      <ConfirmationModal isOpen={isClearConfirmModalOpen} onClose={() => setIsClearConfirmModalOpen(false)} onConfirm={handleClearAllViaturas} title="Confirmar Limpeza Total" message="ATENÇÃO: Esta ação é irreversível e irá apagar TODAS as viaturas do banco de dados. Deseja continuar?" isLoading={isClearing} />
    </div>
  );
}
