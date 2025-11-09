// Arquivo: frontend/src/pages/Viaturas.tsx (VERSÃO CORRIGIDA)

import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2, ChevronDown } from 'lucide-react';

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
  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());

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
  const handleToggleCard = (id: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        <h2 className="text-3xl font-bold tracking-tight text-textMain">Viaturas</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => handleOpenFormModal()} variant="primary" className="w-full md:w-auto">Adicionar Viatura</Button>
          <Button onClick={() => setIsClearConfirmModalOpen(true)} className="!bg-rose-500 hover:!bg-rose-600 w-full md:w-auto text-white">
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

      <div className="space-y-4">
        <div className="viaturas-detalhamento space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-10 w-10" />
            </div>
          ) : viaturas.length > 0 ? (
            viaturas.map((viatura) => {
              const hasSigla = Boolean(viatura.obm_abreviatura);
              const isExpanded = expandedCards.has(viatura.id);
              return (
                <div
                  key={viatura.id}
                  className={`rounded-lg border border-borderDark/60 p-4 shadow-sm transition ${
                    hasSigla ? 'bg-cardSlate' : 'bg-[#1f2433]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleCard(viatura.id)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div>
                      <p className="text-lg font-bold text-textMain">{viatura.prefixo}</p>
                      <p className={`text-sm font-semibold tracking-wide ${hasSigla ? 'text-tagBlue' : 'text-spamRed'}`}>
                        {viatura.obm_abreviatura || 'Sem sigla'}
                      </p>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-textSecondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="mt-4 space-y-3 text-sm text-textSecondary">
                      <div>
                        <p className="text-xs font-semibold uppercase">Sigla</p>
                        <p className={`${hasSigla ? '' : 'text-spamRed font-semibold'}`}>{viatura.obm_abreviatura || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase">Cidade</p>
                        <p>{viatura.cidade || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase">Status</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                            viatura.ativa
                              ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
                              : 'bg-spamRed/20 text-spamRed'
                          }`}
                        >
                          {viatura.ativa ? 'Ativa' : 'Inativa'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => handleOpenFormModal(viatura)}
                          className="inline-flex flex-1 items-center justify-center rounded bg-sky-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-sky-600"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteClick(viatura.id)}
                          className="inline-flex flex-1 items-center justify-center rounded bg-rose-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-rose-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-textSecondary">Nenhuma viatura encontrada.</p>
          )}
        </div>


        {pagination && (
          <div className="mt-4">
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
      <ConfirmationModal isOpen={isClearConfirmModalOpen} onClose={() => setIsClearConfirmModalOpen(false)} onConfirm={handleClearAllViaturas} title="Confirmar Limpeza Total" message="ATENÇÃO: Esta ação é irreversível e irá apagar TODAS as viaturas do banco de dados. Deseja continuar?" isLoading={isClearing} />
    </div>
  );
}

