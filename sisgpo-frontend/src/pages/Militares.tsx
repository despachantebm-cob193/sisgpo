import React, { useState, useEffect, useMemo, useRef, memo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useVirtualizer } from '@tanstack/react-virtual';

import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useCrud } from '@/hooks/useCrud';
import api from '@/services/api';

import type { Militar, Obm } from '@/types/entities';

// Interfaces from Plantoes.tsx
interface GuarnicaoMembro {
  militar_id: number;
  funcao: string;
  nome_guerra: string | null;
  nome_completo: string | null;
  nome_exibicao: string;
  posto_graduacao: string | null;
  telefone: string | null;
  plantao_id?: number;
}

interface Plantao {
  id: number;
  data_plantao: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  viatura_prefixo: string;
  obm_abreviatura: string;
  guarnicao: GuarnicaoMembro[];
  // Campos opcionais para compatibilidade com respostas antigas da API
  data_inicio?: string | null;
  data_fim?: string | null;
}

import FileUpload from '@/components/ui/FileUpload';
import MilitarForm from '@/components/forms/MilitarForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import MilitarCard from '@/components/cards/MilitarCard';
import Pagination from '@/components/ui/Pagination';
import Select from '@/components/ui/Select';
import StatCard from '@/components/ui/StatCard';

import { Edit, Trash2, UserPlus, Search, Upload } from 'lucide-react';

// Memoized Row Component for performance
const MilitarRow = memo(({ militar, virtualRow, handleOpenFormModal, handleDeleteClick, getMilitarStatus, isAdmin }: { militar: Militar, virtualRow: any, handleOpenFormModal: (militar: Militar) => void, handleDeleteClick: (id: number) => void, getMilitarStatus: (militar: Militar) => { label: string; classes: string; }, isAdmin: boolean }) => {
  const status = getMilitarStatus(militar);
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
      className="border-b border-white/5 hover:bg-white/5 transition-colors group"
    >
      <div className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-300 font-bold" style={{ width: isAdmin ? '10%' : '10%' }}>
        {militar.posto_graduacao}
      </div>
      <div className="px-6 py-4 text-sm text-white font-medium tracking-wide" style={{ width: isAdmin ? '20%' : '25%' }}>{militar.nome_completo}</div>
      <div className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono uppercase" style={{ width: isAdmin ? '10%' : '12%' }}>
        {militar.nome_guerra || '-'}
      </div>
      <div className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-mono" style={{ width: isAdmin ? '10%' : '11%' }}>
        {militar.matricula}
      </div>
      <div className="px-6 py-4 text-xs text-slate-400 font-mono truncate" style={{ width: isAdmin ? '15%' : '19%' }}>{militar.obm_nome || 'N/A'}</div>
      <div className="px-6 py-4 text-sm" style={{ width: isAdmin ? '10%' : '11%' }}>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${status.classes}`}>
          {status.label}
        </span>
      </div>
      <div className="px-6 py-4 text-xs text-slate-500 font-mono" style={{ width: isAdmin ? '10%' : '12%' }}>
        {militar.telefone || '-'}
      </div>
      {isAdmin && (
        <div className="px-6 py-4 text-sm" style={{ width: '15%' }}>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleOpenFormModal(militar)}
              className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all"
              title="Editar"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => handleDeleteClick(militar.id)}
              className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all"
              title="Excluir"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});


export default function Militares() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

  const [isUploading, setIsUploading] = useState(false);
  const [obms, setObms] = useState<Obm[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [escaladosMilitares, setEscaladosMilitares] = useState<Set<number>>(new Set());

  const [postoGradFilter, setPostoGradFilter] = useState('');
  const [obmFilter, setObmFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [allMilitaresForFilters, setAllMilitaresForFilters] = useState<Militar[]>([]);

  const {
    data: militares,
    pagination,
    isLoading,
    isFormModalOpen,
    itemToEdit,
    isConfirmModalOpen,
    isSaving,
    isDeleting,
    validationErrors,
    handlePageChange,
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
    itemsPerPage: 50,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const getMilitarStatus = useCallback((militar: Militar) => {
    if (escaladosMilitares.has(militar.id)) {
      return {
        label: 'Escalado',
        classes: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
      };
    }
    if (militar.ativo) {
      return {
        label: 'Ativo',
        classes: 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40',
      };
    }
    return {
      label: 'Inativo',
      classes: 'bg-premiumOrange/20 text-premiumOrange',
    };
  }, [escaladosMilitares]);

  const sortedMilitares = useMemo(() => {
    if (!militares) return [];
    return [...militares]
      .filter(militar => {
        if (!statusFilter) return true;
        const status = getMilitarStatus(militar).label;
        return status === statusFilter;
      })
      .sort((a, b) =>
        (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'),
      );
  }, [militares, statusFilter, getMilitarStatus]);

  const rowVirtualizer = useVirtualizer({
    count: sortedMilitares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });

  const fetchEscalados = useCallback(async () => {
    try {
      // Busca plantões vigentes (data >= hoje) com limit alto para pegar todos
      const todayStr = new Date().toISOString().slice(0, 10);
      const response = await api.get(`/api/admin/plantoes?data_inicio=${todayStr}&limit=1000`);
      const plantoes: Plantao[] = response.data.data ?? [];
      const escalados = new Set<number>();

      plantoes.forEach((plantao) => {
        if (Array.isArray(plantao.guarnicao)) {
          plantao.guarnicao.forEach((membro) => {
            const idNum = Number(membro.militar_id);
            if (Number.isFinite(idNum) && idNum > 0) {
              escalados.add(idNum);
            }
          });
        }
      });
      setEscaladosMilitares(escalados);
    } catch {
      toast.error('Não foi possível carregar os dados de militares escalados.');
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchEscalados();
  }, [fetchData, fetchEscalados]);

  useEffect(() => {
    setPageTitle('Efetivo (Militares)');
  }, [setPageTitle]);

  useEffect(() => {
    const fetchAllForFilters = async () => {
      try {
        const response = await api.get('/api/admin/militares?limit=9999');
        setAllMilitaresForFilters(response.data.data);
      } catch {
        toast.error('Falha ao carregar opções de filtro.');
      }
    };
    fetchAllForFilters();
  }, []);

  const postosGraduacoes = useMemo(() => {
    const allPostos = allMilitaresForFilters.map(m => m.posto_graduacao).filter(Boolean);
    return [...new Set(allPostos)].sort();
  }, [allMilitaresForFilters]);

  const obmsForFilter = useMemo(() => {
    const allObms = allMilitaresForFilters.map(m => m.obm_nome).filter(Boolean);
    return [...new Set(allObms)].sort();
  }, [allMilitaresForFilters]);

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
    handleFilterChange('q', searchInput.value);
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/admin/militares/upload-csv', formData);
      const { message, failures, inserted, updated } = response.data || {};

      const summaryMessage = message || `Importação concluída. Inseridos: ${inserted ?? 0}, Atualizados: ${updated ?? 0}.`;
      toast.success(summaryMessage);

      if (Array.isArray(failures) && failures.length > 0) {
        const preview = failures
          .slice(0, 3)
          .map((failure: any) => {
            if (typeof failure === 'string') return failure;
            const linha = failure?.linha ? `Linha ${failure.linha}` : 'Linha desconhecida';
            const motivo = failure?.motivo || '';
            return motivo ? `${linha}: ${motivo}` : linha;
          })
          .join(' | ');
        const remaining = failures.length > 3 ? ` ... (+${failures.length - 3} linhas)` : '';
        toast.error(`Algumas linhas foram ignoradas: ${preview}${remaining}`);
        console.warn('Falhas ao importar militares:', failures);
      }

      await fetchData();
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
      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">

        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-6">
          <form onSubmit={handleSearch} className="flex-grow w-full md:w-auto">
            <div className="relative group">
              <input
                type="text"
                name="search"
                placeholder="Buscar por nome, matricula ou posto..."
                className="w-full pl-10 pr-4 py-2.5 bg-[#0f141e] border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
                onChange={(e) => handleFilterChange('q', e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
            </div>
          </form>
          <div className="flex gap-3 w-full md:w-auto">
            {isAdmin && (
              <>
                <Button onClick={() => setIsUploadModalOpen(true)} className="w-full md:w-auto !bg-amber-500/10 !border !border-amber-500/50 !text-amber-400 hover:!bg-amber-500/20 hover:!shadow-[0_0_15px_rgba(245,158,11,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold">
                  <Upload className="w-4 h-4 mr-2" />
                  Importar
                </Button>
                <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto !bg-cyan-500/10 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/20 hover:!shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Novo Militar
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-4 border-b border-white/5 pb-6">
          <div className="flex flex-wrap items-center gap-4">
            <Select
              value={postoGradFilter}
              onChange={(e) => {
                const value = e.target.value;
                setPostoGradFilter(value);
                handleFilterChange('posto_graduacao', value);
              }}
              className="w-full md:w-56"
            >
              <option value="">Filtrar por Posto/Grad...</option>
              {postosGraduacoes.map(posto => (
                <option key={posto} value={posto}>{posto}</option>
              ))}
            </Select>
            <Select
              value={obmFilter}
              onChange={(e) => {
                const value = e.target.value;
                setObmFilter(value);
                handleFilterChange('obm_nome', value);
              }}
              className="w-full md:w-56"
            >
              <option value="">Filtrar por OBM...</option>
              {obmsForFilter.map(obm => (
                <option key={obm} value={obm}>{obm}</option>
              ))}
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => {
                const value = e.target.value;
                setStatusFilter(value);
                handleFilterChange('escalado', value === 'Escalado' ? 'true' : '');
              }}
              className="w-full md:w-56"
            >
              <option value="">Filtrar por Status...</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Escalado">Escalado</option>
            </Select>
            <Button onClick={() => {
              setPostoGradFilter('');
              setObmFilter('');
              setStatusFilter('');
              handleFilterChange('posto_graduacao', '');
              handleFilterChange('obm_nome', '');
              handleFilterChange('q', '');
              handleFilterChange('escalado', '');
            }} className="!bg-slate-800 !text-slate-400 hover:!bg-slate-700 hover:!text-slate-200 border border-slate-700 w-full md:w-auto font-mono text-xs uppercase tracking-wider">
              Limpar
            </Button>
          </div>
          <div className="w-full md:w-auto min-w-[200px]">
            <StatCard
              title="Total de Militares"
              value={isLoading ? '' : pagination?.totalRecords ?? 0}
              isLoading={isLoading}
              variant="highlight"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <Spinner className="w-10 h-10 text-cyan-500" />
          </div>
        )}

        {!isLoading && (
          <>
            <div className="hidden md:block overflow-hidden rounded-lg border border-white/5 bg-black/20">
              <table className="min-w-full table-fixed">
                <thead className="bg-white/5 decoration-clone">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '10%' : '10%' }}>
                      Posto/Grad.
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '20%' : '25%' }}>
                      Nome Completo
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '10%' : '12%' }}>
                      Nome de Guerra
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '10%' : '11%' }}>
                      Matricula
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '15%' : '19%' }}>
                      Lotacao (OBM)
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '10%' : '11%' }}>
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '10%' : '12%' }}>
                      Telefone
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-4 text-right text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>
                        Acoes
                      </th>
                    )}
                  </tr>
                </thead>
              </table>
              <div ref={parentRef} className="overflow-auto custom-scrollbar" style={{ height: '600px' }}>
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
                        getMilitarStatus={getMilitarStatus}
                        isAdmin={isAdmin}
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
                  getMilitarStatus={getMilitarStatus}
                  isAdmin={isAdmin}
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
        title="Confirmar Exclusão"
        message="Tem certeza de que deseja excluir este militar? Esta ação não pode ser desfeita."
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
          title="Importar/Atualizar Militares via Planilha"
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
