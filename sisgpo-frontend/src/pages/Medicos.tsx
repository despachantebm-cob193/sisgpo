import React, { useEffect, useState, useCallback, ChangeEvent, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Edit, Trash2, UserPlus, Search, Stethoscope } from 'lucide-react';

import api from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import MedicoForm from '@/components/forms/MedicoForm';
import StatCard from '@/components/ui/StatCard';
import Select from '@/components/ui/Select';
import { formatarTelefone } from '@/utils/formatters';

interface Medico {
  id: number;
  nome_completo: string;
  funcao: string;
  telefone: string | null;
  observacoes: string | null;
  ativo: boolean;
}

interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Medicos() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

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
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageTitle("Cadastro de Médicos");
  }, [setPageTitle]);

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

  const handleFilterChange = (value: string) => {
    setFilters({ nome_completo: value });
    setCurrentPage(1);
  };

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

  const rowVirtualizer = useVirtualizer({
    count: medicos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="space-y-6">

      {/* Top Section: Filters & Actions */}
      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Decorative Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <div className="relative group w-full md:w-auto flex-grow max-w-md">
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={filters.nome_completo}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f141e] border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="w-full md:w-auto min-w-[180px]">
              <StatCard
                title="Total de Médicos"
                value={isLoading ? '' : pagination?.totalRecords ?? 0}
                isLoading={isLoading}
                variant="transparent"
              />
            </div>
            {isAdmin && (
              <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto !bg-cyan-500/10 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/20 hover:!shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold h-full">
                <UserPlus className="w-4 h-4 mr-2" />
                Novo Médico
              </Button>
            )}
          </div>
        </div>

        {/* Table / List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Spinner className="w-10 h-10 text-cyan-500" />
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-lg border border-white/5 bg-black/20">
              <table className="min-w-full table-fixed">
                <thead className="bg-white/5 decoration-clone">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '30%' }}>Nome</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '20%' }}>Função</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>Telefone</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '20%' }}>Observações</th>
                    {isAdmin && <th className="px-6 py-4 text-right text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {medicos.length > 0 ? (
                    medicos.map((medico) => (
                      <tr key={medico.id} className="group border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white font-mono">{medico.nome_completo}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono uppercase tracking-wide">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                            <Stethoscope size={12} />
                            {medico.funcao}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono">{formatarTelefone(medico.telefone)}</td>
                        <td className="px-6 py-4 text-xs text-slate-500 font-mono truncate max-w-xs">{medico.observacoes || '-'}</td>
                        {isAdmin && (
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleOpenFormModal(medico)} className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteClick(medico.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all" title="Excluir">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan={5} className="text-center py-10 text-slate-500 font-mono uppercase tracking-widest text-xs">Nenhum registro encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
              {medicos.map((medico) => (
                <div key={medico.id} className="bg-[#0e121b] border border-white/10 p-4 rounded-xl shadow-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-bold font-mono text-sm">{medico.nome_completo}</h3>
                      <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/50 text-slate-400 border border-slate-700/50 uppercase tracking-wider">
                        {medico.funcao}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenFormModal(medico)} className="p-2 text-sky-500 bg-sky-500/10 rounded-lg"><Edit size={16} /></button>
                        <button onClick={() => handleDeleteClick(medico.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-xs text-slate-400 font-mono border-t border-white/5 pt-3">
                    <div className="flex justify-between">
                      <span className="uppercase tracking-widest text-slate-600">Telefone</span>
                      <span className="text-slate-300">{formatarTelefone(medico.telefone)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="uppercase tracking-widest text-slate-600">Obs</span>
                      <span className="text-slate-300 max-w-[60%] truncate">{medico.observacoes || '-'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-6 border-t border-white/5 pt-4">
                <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
              </div>
            )}
          </>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Médico' : 'Adicionar Médico'}>
        <MedicoForm medicoToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}