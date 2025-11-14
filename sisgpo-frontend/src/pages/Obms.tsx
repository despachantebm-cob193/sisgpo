import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, Trash, Plus, ChevronDown, Upload } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { Obm, ObmOption } from '@/types/entities';
import api from '@/services/api';
import { useUiStore } from '@/store/uiStore';

import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import ObmForm from '@/components/forms/ObmForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import FileUpload from '@/components/ui/FileUpload';
import Input from '@/components/ui/Input';

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState | null;
}

interface ApiErrorDetail {
  field: string;
  message: string;
}

export default function Obms() {
  const { setPageTitle } = useUiStore();

  const [obms, setObms] = useState<Obm[]>([]);
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [validationErrors, setValidationErrors] = useState<ApiErrorDetail[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConfirmDeleteAllModalOpen, setIsConfirmDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);
  const [openCrbmKeys, setOpenCrbmKeys] = useState<Set<string>>(() => new Set());
  const [openCitiesByCrbm, setOpenCitiesByCrbm] = useState<Record<string, Set<string>>>(() => ({}));
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const rowVirtualizer = useVirtualizer({
    count: obms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65, // Estimate row height
    overscan: 5,
  });

  useEffect(() => {
    const scrollElement = parentRef.current;

    if (!scrollElement) {
      setScrollbarWidth(0);
      return;
    }

    const updateScrollbarWidth = () => {
      const width = scrollElement.offsetWidth - scrollElement.clientWidth;
      setScrollbarWidth(width > 0 ? width : 0);
    };

    updateScrollbarWidth();

    let resizeObserver: ResizeObserver | null = null;
    let listeningWindowResize = false;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollbarWidth);
      resizeObserver.observe(scrollElement);
    } else if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateScrollbarWidth);
      listeningWindowResize = true;
    }

    return () => {
      resizeObserver?.disconnect();
      if (listeningWindowResize && typeof window !== 'undefined') {
        window.removeEventListener('resize', updateScrollbarWidth);
      }
    };
  }, [obms.length]);

  useEffect(() => {
    setPageTitle('Gerenciar OBMs');
  }, [setPageTitle]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '1000', ...filters });

      const [obmsRes, optionsRes, metadataRes] = await Promise.all([
        api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`),
        api.get('/api/admin/viaturas/distinct-obms'),
        api.get('/api/admin/metadata/viaturas_last_upload').catch(() => null),
      ]);

      setObms(obmsRes.data.data);
      setPagination(obmsRes.data.pagination);

      const options = Array.isArray(optionsRes.data)
        ? optionsRes.data.map((option: any) => ({
            value: option.value || option.obm || option.nome,
            label: option.label || option.value || option.obm,
            cidade: option.cidade ? String(option.cidade) : '',
          }))
        : [];
      setObmOptions(options);

      if (metadataRes && metadataRes.data?.value) {
        setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
      } else {
        setLastUpload(null);
      }
    } catch (error) {
      toast.error('Nao foi possivel carregar os dados das OBMs.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [filters, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const groupedObms = useMemo(() => {
    return obms.reduce<Record<string, Record<string, Obm[]>>>((acc, obm) => {
      const crbmKey = obm.crbm?.trim() || 'CRBM nao informado';
      const cidadeKey = obm.cidade?.trim() || 'Cidade nao informada';

      if (!acc[crbmKey]) {
        acc[crbmKey] = {};
      }
      if (!acc[crbmKey][cidadeKey]) {
        acc[crbmKey][cidadeKey] = [];
      }

      acc[crbmKey][cidadeKey].push(obm);
      return acc;
    }, {});
  }, [obms]);

  const crbmEntries = useMemo(
    () =>
      Object.entries(groupedObms)
        .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
        .map(([crbm, cities]) => ({
          crbm,
          total: Object.values(cities).reduce((sum, list) => sum + list.length, 0),
          cityEntries: Object.entries(cities).sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })),
        })),
    [groupedObms],
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ q: event.target.value });
    setCurrentPage(1);
  };

  const handleOpenFormModal = (item: Obm | null = null) => {
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

  const toggleCrbm = (crbm: string) => {
    setOpenCrbmKeys((prev) => {
      const next = new Set(prev);
      if (next.has(crbm)) {
        next.delete(crbm);
      } else {
        next.add(crbm);
      }
      return next;
    });
    setOpenCitiesByCrbm((prev) => {
      if (prev[crbm]) return prev;
      return { ...prev, [crbm]: new Set() };
    });
  };

  const toggleCity = (crbm: string, cidade: string) => {
    setOpenCitiesByCrbm((prev) => {
      const currentSet = prev[crbm] ?? new Set<string>();
      const nextSet = new Set(currentSet);
      if (nextSet.has(cidade)) {
        nextSet.delete(cidade);
      } else {
        nextSet.add(cidade);
      }
      return { ...prev, [crbm]: nextSet };
    });
  };

  const handleSave = async (data: Omit<Obm, 'id' | 'obm_id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    const { id, ...payload } = data;
    try {
      if (id) {
        await api.put(`/api/admin/obms/${id}`, payload);
      } else {
        await api.post('/api/admin/obms', payload);
      }
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulario.');
      } else {
        toast.error(err.response?.data?.message || 'Erro ao salvar OBM.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/obms/${itemToDeleteId}`);
      toast.success('OBM excluida com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir OBM.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.delete('/api/admin/obms');
      toast.success('Todas as OBMs foram removidas.');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir todas as OBMs.');
    } finally {
      setIsDeletingAll(false);
      setIsConfirmDeleteAllModalOpen(false);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/obms/upload-csv', formData);
      toast.success(response.data?.message || 'Arquivo processado com sucesso!');
      if (response.data?.errors?.length) {
        const preview = response.data.errors.slice(0, 3).join(' | ');
        const remaining = response.data.errors.length > 3 ? ` ... (+${response.data.errors.length - 3} linhas)` : '';
        toast.error(`Algumas linhas foram ignoradas: ${preview}${remaining}`);
        console.warn('Linhas ignoradas durante a importacao:', response.data.errors);
      }
      fetchData();
      setIsUploadModalOpen(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const obmOptionsNormalized: ObmOption[] = obmOptions.map((option) => ({
    value: option.value,
    label: option.label,
    cidade: option.cidade ?? '',
  }));

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-textMain">Gerenciar OBMs</h2>
          <p className="text-textSecondary mt-2">Adicione, edite ou remova organizacoes militares.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button onClick={() => setIsUploadModalOpen(true)} variant="warning">
            <Upload className="w-4 h-4 mr-2" />
            Upload / Atualizar
          </Button>
          <Button
            onClick={() => setIsConfirmDeleteAllModalOpen(true)}
            variant="danger"
            disabled={obms.length === 0 || isDeletingAll}
          >
            <Trash className="w-4 h-4 mr-2" />
            {isDeletingAll ? 'Excluindo...' : 'Excluir Todas as OBMs'}
          </Button>
          <Button onClick={() => handleOpenFormModal()} variant="primary">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Nova OBM
          </Button>
        </div>
      </div>

      <Input
        type="text"
        placeholder="Filtrar por nome, sigla, cidade ou CRBM..."
        value={filters.q}
        onChange={handleFilterChange}
        className="max-w-xs mb-4"
      />

      {!isLoading && pagination && (
        <div className="mb-4 text-lg font-semibold text-textMain">
          {pagination.totalRecords} {pagination.totalRecords === 1 ? 'OBM encontrada' : 'OBMs encontradas'}
        </div>
      )}

      <div className="space-y-6">
        <section className="rounded-lg border border-borderDark/60 bg-cardSlate/80 p-4 shadow-sm md:p-6 md:hidden">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-2xl font-semibold text-textMain">Visao hierarquica das OBMs</h3>
              <p className="text-sm text-textSecondary">CRBM &gt; cidade &gt; demais dados da unidade.</p>
            </div>
            <span className="text-sm font-semibold text-tagBlue">
              {obms.length} {obms.length === 1 ? 'registro ativo' : 'registros ativos'}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : crbmEntries.length === 0 ? (
            <p className="py-6 text-center text-textSecondary">Nenhuma OBM encontrada.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {crbmEntries.map(({ crbm, total, cityEntries }) => {
                const isCrbmOpen = openCrbmKeys.has(crbm);
                return (
                  <div key={crbm} className="rounded-lg border border-borderDark/50 bg-background/70 p-4 shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleCrbm(crbm)}
                      aria-expanded={isCrbmOpen}
                      className="flex w-full items-center justify-between gap-3 text-left"
                    >
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-textSecondary">CRBM</p>
                        <p className="text-xl font-bold text-textMain">{crbm}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="rounded-full bg-tagBlue/10 px-3 py-1 text-xs font-semibold text-tagBlue">
                          {total} {total === 1 ? 'registro' : 'registros'}
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-textSecondary transition-transform ${isCrbmOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </button>

                    {isCrbmOpen && (
                      <div className="mt-4 space-y-4">
                        {cityEntries.map(([cidade, lista]) => {
                          const isCityOpen = openCitiesByCrbm[crbm]?.has(cidade) ?? false;
                          return (
                            <div
                              key={`${crbm}-${cidade}`}
                              className="rounded-lg border border-tagBlue/40 bg-tagBlue/5 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]"
                            >
                              <button
                                type="button"
                                onClick={() => toggleCity(crbm, cidade)}
                                aria-expanded={isCityOpen}
                                className="flex w-full items-center justify-between gap-3 text-left"
                              >
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-textSecondary">
                                    Cidade
                                  </p>
                                  <p className="text-lg font-semibold text-textMain">{cidade}</p>
                                </div>
                                <ChevronDown
                                  className={`h-5 w-5 text-textSecondary transition-transform ${
                                    isCityOpen ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>

                              {isCityOpen && (
                                <div className="mt-3 space-y-3">
                                  {lista.map((obm) => (
                                    <article
                                      key={obm.id ?? `${obm.nome}-${cidade}`}
                                      className="rounded-md border border-borderDark/40 bg-cardSlate p-3 shadow-sm"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <h4 className="text-base font-semibold text-textMain">{obm.nome}</h4>
                                        <div className="flex flex-wrap items-center gap-2 text-xs text-textSecondary">
                                          <span className="font-semibold uppercase tracking-wide">
                                            {obm.abreviatura || 'Sigla nao informada'}
                                          </span>
                                          <span className="text-[10px] uppercase text-textSecondary/80">-</span>
                                          <span>{obm.crbm || 'CRBM nao informado'}</span>
                                        </div>
                                      </div>

                                      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-textSecondary">
                                        <div>
                                          <dt className="font-semibold uppercase text-[10px]">Telefone</dt>
                                          <dd className="text-sm text-textMain">{obm.telefone || 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="font-semibold uppercase text-[10px]">Identificador</dt>
                                          <dd className="text-sm text-textMain">{obm.obm_id ?? obm.id ?? 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="font-semibold uppercase text-[10px]">Cidade</dt>
                                          <dd className="text-sm text-textMain">{obm.cidade || 'N/A'}</dd>
                                        </div>
                                        <div>
                                          <dt className="font-semibold uppercase text-[10px]">Sincronizado</dt>
                                          <dd className="text-sm text-textMain">{obm.synced ? 'Sim' : 'Nao'}</dd>
                                        </div>
                                      </dl>

                                      <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                          onClick={() => handleOpenFormModal(obm)}
                                          className="inline-flex min-w-[120px] flex-1 items-center justify-center rounded border border-tagBlue/50 bg-tagBlue/10 px-3 py-1.5 text-sm font-medium text-tagBlue transition hover:bg-tagBlue/20"
                                        >
                                          <Edit className="mr-2 h-4 w-4" />
                                          Editar
                                        </button>
                                        {obm.id && (
                                          <button
                                            onClick={() => handleDeleteClick(obm.id!)}
                                            className="inline-flex min-w-[120px] flex-1 items-center justify-center rounded border border-rose-500 bg-spamRed/10 px-3 py-1.5 text-sm font-medium text-rose-400 transition hover:text-rose-300"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir
                                          </button>
                                        )}
                                      </div>
                                    </article>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>


        <div className="hidden md:block bg-cardSlate shadow-md rounded-lg overflow-hidden">
          <table
            className="min-w-full table-fixed"
            style={scrollbarWidth > 0 ? { width: `calc(100% - ${scrollbarWidth}px)` } : undefined}
          >
            <thead className="bg-searchbar">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase" style={{ width: '35%' }}>Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase" style={{ width: '15%' }}>Sigla</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase" style={{ width: '15%' }}>CRBM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase" style={{ width: '15%' }}>Cidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase" style={{ width: '15%' }}>Telefone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase" style={{ width: '10%' }}>Acoes</th>
              </tr>
            </thead>
          </table>
          <div ref={parentRef} className="overflow-auto" style={{ height: '600px' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {isLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner className="h-10 w-10" />
                </div>
              ) : rowVirtualizer.getVirtualItems().length > 0 ? (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const obm = obms[virtualRow.index];
                  return (
                    <div
                      key={obm.id}
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
                      <div className="px-6 py-2 text-sm font-medium text-textMain break-words" style={{ width: '35%' }}>{obm.nome}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-sm text-textSecondary" style={{ width: '15%' }}>{obm.abreviatura}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-sm text-textSecondary" style={{ width: '15%' }}>{obm.crbm || 'N/A'}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-sm text-textSecondary" style={{ width: '15%' }}>{obm.cidade || 'N/A'}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-sm text-textSecondary" style={{ width: '15%' }}>{obm.telefone || 'N/A'}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-center text-sm font-medium space-x-4" style={{ width: '10%' }}>
                        <button onClick={() => handleOpenFormModal(obm)} className="text-tagBlue hover:text-tagBlue/80" title="Editar">
                          <Edit className="w-5 h-5 inline-block" />
                        </button>
                        <button onClick={() => handleDeleteClick(obm.id)} className="text-spamRed hover:text-spamRed/80" title="Excluir">
                          <Trash2 className="w-5 h-5 inline-block" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-center items-center h-full">
                  <p className="text-textSecondary">Nenhuma OBM encontrada.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}
      >
        <ObmForm
          obmToEdit={itemToEdit}
          obmOptions={obmOptionsNormalized}
          onSave={handleSave}
          onCancel={handleCloseFormModal}
          isLoading={isSaving}
          errors={validationErrors}
        />
      </Modal>

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={handleCloseConfirmModal}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusao"
        message="Tem certeza que deseja excluir esta OBM?"
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={isConfirmDeleteAllModalOpen}
        onClose={() => setIsConfirmDeleteAllModalOpen(false)}
        onConfirm={handleConfirmDeleteAll}
        title="Confirmar limpeza"
        message="Esta acao removera todas as OBMs cadastradas. Deseja continuar?"
        isLoading={isDeletingAll}
      />

      <Modal
        isOpen={isUploadModalOpen}
        title="Atualizar Cidades/Telefones via Planilha"
        onClose={() => setIsUploadModalOpen(false)}
      >
        <FileUpload
          title="Atualizar Cidades/Telefones via Planilha"
          onUpload={handleUpload}
          isLoading={isUploading}
          acceptedFileTypes=".csv"
          lastUpload={lastUpload}
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