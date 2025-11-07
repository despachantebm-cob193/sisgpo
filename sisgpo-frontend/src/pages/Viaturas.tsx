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

import { useOfflineCRUD } from '../hooks/useOfflineCRUD';

// ... (imports)

export default function Viaturas() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Viaturas");
  }, [setPageTitle]);

  const { getAll, add, update, remove } = useOfflineCRUD<Viatura>('viaturas');
  const viaturas = getAll() || [];

  const [filters, setFilters] = useState({ prefixo: '' });
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

  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());

  // The fetchData and fetchLastUpload functions and their useEffect are removed here.

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFilters({ prefixo: e.target.value }); };
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

  const handleSave = async (data: Omit<Viatura, 'id'> & { id?: number }) => {
    setIsSaving(true);
    try {
      if (data.id) {
        await update(data.id, data);
        toast.success('Viatura atualizada com sucesso!');
      } else {
        await add(data);
        toast.success('Viatura criada com sucesso!');
      }
      handleCloseFormModal();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar a viatura.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await remove(itemToDeleteId);
      toast.success('Viatura excluída com sucesso!');
    } catch (err: any) { toast.error(err.message || 'Erro ao excluir a viatura.'); }
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
        <div className="md:hidden space-y-3">
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

        <div className="hidden md:block bg-cardSlate shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-searchbar">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Sigla</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderDark/60">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr
                  key={viatura.id}
                  className={`block md:table-row border-b md:border-none p-4 md:p-0 ${
                    viatura.obm_abreviatura ? '' : 'bg-[#1f2433] md:bg-premiumOrange/20'
                  }`}
                  title={viatura.obm_abreviatura ? undefined : 'Esta viatura ainda não está vinculada a uma sigla de OBM.'}
                >
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium text-textMain" data-label="Prefixo:">{viatura.prefixo}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 text-sm text-textSecondary" data-label="OBM:">{viatura.obm || 'N/A'}</td>
                  <td
                    className={`block md:table-cell px-6 py-2 md:py-4 text-sm ${
                      viatura.obm_abreviatura ? 'text-textSecondary' : 'text-spamRed font-semibold'
                    }`}
                    data-label="Sigla:"
                  >
                    {viatura.obm_abreviatura || 'N/A'}
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm text-textSecondary" data-label="Cidade:">{viatura.cidade || 'N/A'}</td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm" data-label="Status:">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40' : 'bg-spamRed/20 text-spamRed'}`}>
                      {viatura.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="block md:table-cell px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium space-x-4 mt-2 md:mt-0">
                    <button onClick={() => handleOpenFormModal(viatura)} className="inline-flex h-9 w-9 items-center justify-center rounded bg-sky-500 text-white shadow hover:bg-sky-600 transition disabled:opacity-60" title="Editar"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteClick(viatura.id)} className="inline-flex h-9 w-9 items-center justify-center rounded bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-60" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="text-center py-10 text-textSecondary">Nenhuma viatura encontrada.</td></tr>
            )}
          </tbody>
        </table>
        </div>
        {/* Pagination component removed */}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
      <ConfirmationModal isOpen={isClearConfirmModalOpen} onClose={() => setIsClearConfirmModalOpen(false)} onConfirm={handleClearAllViaturas} title="Confirmar Limpeza Total" message="ATENÇÃO: Esta ação é irreversível e irá apagar TODAS as viaturas do banco de dados. Deseja continuar?" isLoading={isClearing} />
    </div>
  );
}

