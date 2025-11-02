// Arquivo: frontend/src/pages/Medicos.tsx

import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import { Edit, Trash2 } from 'lucide-react';
import MedicoForm from '../components/forms/MedicoForm';
import { formatarTelefone } from '../utils/formatters';
import { useUiStore } from '@/store/uiStore';

interface Medico { id: number; nome_completo: string; funcao: string; telefone: string | null; observacoes: string | null; ativo: boolean; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Medicos() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Cadastro de Médicos");
  }, [setPageTitle]);

  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Medico | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '20', ...filters });
      const response = await api.get<ApiResponse<Medico>>(`/api/admin/medicos?${params.toString()}`);
      setMedicos(response.data.data || []);
      setPagination(response.data.pagination);
    } catch (err) { toast.error('Não foi possível carregar o cadastro de médicos.'); }
    finally { setIsLoading(false); }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (e: ChangeEvent<HTMLInputElement>) => { setFilters({ nome_completo: e.target.value }); setCurrentPage(1); };
  const handleOpenFormModal = (item: Medico | null = null) => { setItemToEdit(item); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSave = async (data: any) => {
    setIsSaving(true);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) await api.put(`/api/admin/medicos/${data.id}`, data);
      else await api.post('/api/admin/medicos', data);
      toast.success(`Médico ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar o registro.'); }
    finally { setIsSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/medicos/${itemToDeleteId}`);
      toast.success('Registro excluído!');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir o registro.'); }
    finally { setIsDeleting(false); handleCloseConfirmModal(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-textMain">Cadastro de Médicos</h2>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Médico</Button>
      </div>
      <Input type="text" placeholder="Filtrar por nome..." value={filters.nome_completo} onChange={handleFilterChange} className="max-w-xs mb-4" />

      <div className="bg-cardSlate shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-searchbar hidden md:table-header-group">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Função</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Observações</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/60 md:divide-y-0">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
            ) : medicos.length > 0 ? (
              medicos.map((medico) => (
                <tr key={medico.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium text-textMain" data-label="Nome:">{medico.nome_completo}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-textSecondary" data-label="Função:">{medico.funcao}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-textSecondary" data-label="Telefone:">{formatarTelefone(medico.telefone)}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 text-sm text-textSecondary truncate max-w-xs" data-label="Obs:">{medico.observacoes || '-'}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium space-x-4 mt-2 md:mt-0 text-center md:text-left">
                    <button onClick={() => handleOpenFormModal(medico)} className="text-tagBlue hover:text-tagBlue/80" title="Editar"><Edit className="w-5 h-5 inline-block" /></button>
                    <button onClick={() => handleDeleteClick(medico.id)} className="text-spamRed hover:text-spamRed/80" title="Excluir"><Trash2 className="w-5 h-5 inline-block" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-textSecondary">Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Médico' : 'Adicionar Médico'}>
        <MedicoForm medicoToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
