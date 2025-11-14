import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useUiStore } from '@/store/uiStore';
import { useCrud } from '@/hooks/useCrud';
import api from '@/services/api';

import type { Militar, Obm } from '@/types/entities';

import FileUpload from '@/components/ui/FileUpload';
import MilitarForm from '@/components/forms/MilitarForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import MilitarCard from '@/components/cards/MilitarCard';
import Pagination from '@/components/ui/Pagination';

import { Edit, Trash2, UserPlus, Search, Upload } from 'lucide-react';

// Memoized Row Component for performance
const MilitarRow = memo(({ militar, virtualRow, handleOpenFormModal, handleDeleteClick }: { militar: Militar, virtualRow: any, handleOpenFormModal: (militar: Militar) => void, handleDeleteClick: (id: number) => void }) => {
  return (
    <div
      key={militar.id}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: `${virtualRow.size}px`,
        transform: `translateY(${virtualRow.start}px)`,
        display: 'flex',
        alignItems: 'center',
      }}
      className="border-b border-borderDark/60"
    >
      <div className="px-6 py-4 whitespace-nowrap text-sm text-textMain" style={{ width: '10%' }}>
        {militar.posto_graduacao}
      </div>
      <div className="px-6 py-4 text-sm text-textMain" style={{ width: '20%' }}>{militar.nome_completo}</div>
      <div className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary" style={{ width: '10%' }}>
        {militar.nome_guerra || 'Nao informado'}
      </div>
      <div className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary" style={{ width: '10%' }}>
        {militar.matricula}
      </div>
      <div className="px-6 py-4 text-sm text-textSecondary" style={{ width: '15%' }}>{militar.obm_nome || 'N/A'}</div>
      <div className="px-6 py-4 text-sm" style={{ width: '10%' }}>
        <span
          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
            militar.ativo
              ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
              : 'bg-premiumOrange/20 text-premiumOrange'
          }`}
        >
          {militar.ativo ? 'Ativo' : 'Inativo'}
        </span>
      </div>
      <div className="px-6 py-4 text-sm text-textSecondary" style={{ width: '10%' }}>
        {militar.telefone || 'Nao informado'}
      </div>
      <div className="px-6 py-4 text-sm" style={{ width: '15%' }}>
        <div className="flex items-center justify-end gap-4">
          <button
            onClick={() => handleOpenFormModal(militar)}
            className="inline-flex h-9 w-9 items-center justify-center rounded bg-sky-500 text-white shadow hover:bg-sky-600 transition disabled:opacity-60"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => handleDeleteClick(militar.id)}
            className="inline-flex h-9 w-9 items-center justify-center rounded bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-60"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
});


export default function Militares() {
  const { setPageTitle } = useUiStore();
  const [isUploading, setIsUploading] = useState(false);
  const [obms, setObms] = useState<Obm[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const {
    data: militares,
    pagination, // get pagination state
    isLoading,
    isFormModalOpen,
    itemToEdit,
    isConfirmModalOpen,
    isSaving,
    isDeleting,
    validationErrors,
    handlePageChange, // get page change handler
    handleFilterChange,
    handleOpenFormModal,
    handleCloseFormModal,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleSave,
    handleConfirmDelete,
    fetchData,
  } = useCrud<Militar>({
    entityName: 'militares',
    itemsPerPage: 50, // Restore pagination
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const sortedMilitares = useMemo(() => {
    if (!militares) return [];
    return [...militares].sort((a, b) =>
      (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'),
    );
  }, [militares]);

  const rowVirtualizer = useVirtualizer({
    count: sortedMilitares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // Estimate row height
    overscan: 5,
  });

  useEffect(() => {
    setPageTitle('Efetivo (Militares)');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchObms = async () => {
      try {
        const response = await api.get('/api/admin/obms?limit=500');
        setObms(response.data.data);
      } catch {
        toast.error('Falha ao carregar OBMs.');
      }
    };
    fetchObms();
  }, []);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const searchInput = e.currentTarget.elements.namedItem('search') as HTMLInputElement;
    handleFilterChange('nome_completo', searchInput.value);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/api/admin/militares/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Arquivo enviado com sucesso! A atualizacao sera processada em segundo plano.');
      fetchData();
      setIsUploadModalOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Falha no upload do arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      <div className="bg-cardSlate p-6 rounded-lg shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
          <form onSubmit={handleSearch} className="flex-grow w-full md:w-auto">
            <div className="relative">
              <input
                type="text"
                name="search"
                placeholder="Buscar por nome, matricula ou posto..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus-visible:ring-tagBlue"
                onChange={(e) => handleFilterChange('nome_completo', e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary" />
            </div>
          </form>
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => setIsUploadModalOpen(true)} variant="warning" className="w-full md:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Importar Militares
            </Button>
            <Button onClick={() => handleOpenFormModal()} variant="primary" className="w-full md:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Adicionar Militar
            </Button>
          </div>
        </div>

        {isLoading && <Spinner />}

        {!isLoading && (
          <>
            <div className="hidden md:block">
              <table className="min-w-full table-fixed">
                <thead className="bg-searchbar">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '10%' }}>
                      Posto/Grad.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '20%' }}>
                      Nome Completo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '10%' }}>
                      Nome de Guerra
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '10%' }}>
                      Matricula
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '15%' }}>
                      Lotacao (OBM)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '10%' }}>
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '10%' }}>
                      Telefone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider" style={{ width: '15%' }}>
                      Acoes
                    </th>
                  </tr>
                </thead>
              </table>
              <div ref={parentRef} className="overflow-auto" style={{ height: '600px' }}>
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const militar = sortedMilitares[virtualRow.index];
                    return (
                      <MilitarRow
                        key={militar.id}
                        militar={militar}
                        virtualRow={virtualRow}
                        handleOpenFormModal={handleOpenFormModal}
                        handleDeleteClick={handleDeleteClick}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-4 md:hidden">
              {sortedMilitares.map((militar) => (
                <MilitarCard
                  key={militar.id}
                  militar={militar}
                  isExpanded={expandedCards.has(militar.id)}
                  onToggle={() => handleToggleCard(militar.id)}
                  onEdit={() => handleOpenFormModal(militar)}
                  onDelete={() => handleDeleteClick(militar.id)}
                />
              ))}
            </div>
            
            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        title={itemToEdit ? 'Editar Militar' : 'Adicionar Militar'}
        onClose={handleCloseFormModal}
      >
        <MilitarForm
          initialData={itemToEdit}
          onSuccess={handleCloseFormModal}
          obms={obms}
          isSaving={isSaving}
          errors={validationErrors}
          onSave={handleSave}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        title="Confirmar Exclusao"
        message="Tem certeza de que deseja excluir este militar? Esta acao nao pode ser desfeita."
        onConfirm={handleConfirmDelete}
        onClose={handleCloseConfirmModal}
        isLoading={isDeleting}
      />

      <Modal
        isOpen={isUploadModalOpen}
        title="Importar/Atualizar Militares via Planilha"
        onClose={() => setIsUploadModalOpen(false)}
      >
        <FileUpload
          onUpload={handleFileUpload}
          isLoading={isUploading}
        />
        <div className="flex justify-end mt-4">
          <Button onClick={() => setIsUploadModalOpen(false)} variant="secondary">
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
