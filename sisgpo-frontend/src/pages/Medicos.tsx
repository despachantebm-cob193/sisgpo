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
import { useAuthStore } from '@/store/authStore';

interface Medico { id: number; nome_completo: string; funcao: string; telefone: string | null; observacoes: string | null; ativo: boolean; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Medicos() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

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
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <Input type="text" placeholder="Filtrar por nome..." value={filters.nome_completo} onChange={handleFilterChange} className="max-w-xs w-full md:w-auto" />
        {isAdmin && <Button onClick={() => handleOpenFormModal()} variant="primary">Adicionar Médico</Button>}
      </div>

      <div className="bg-[#0a0d14]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

        <table className="min-w-full">
          <thead className="bg-white/5 decoration-clone">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Nome</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Função</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Telefone</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Observações</th>
              {isAdmin && <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Ações</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto text-cyan-500" /></td></tr>
            ) : medicos.length > 0 ? (
              medicos.map((medico) => (
                <tr key={medico.id} className="group border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white font-mono" data-label="Nome:">{medico.nome_completo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono uppercase tracking-wide" data-label="Função:">{medico.funcao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono" data-label="Telefone:">{formatarTelefone(medico.telefone)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono truncate max-w-xs" data-label="Obs:">{medico.observacoes || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4 mt-2 md:mt-0 text-center md:text-left opacity-0 group-hover:opacity-100 transition-opacity">
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenFormModal(medico)} className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all" title="Editar"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteClick(medico.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all" title="Excluir"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-10 text-slate-500 font-mono uppercase tracking-widest text-xs">Nenhum registro encontrado.</td></tr>
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