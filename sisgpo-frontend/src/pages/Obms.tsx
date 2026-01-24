import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { Edit, Trash2, Trash, Plus, ChevronDown, Upload, Search, Building2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import { Obm, ObmOption } from '@/types/entities';
import api from '@/services/api';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

import Button from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import ObmForm from '@/components/forms/ObmForm';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import FileUpload from '@/components/ui/FileUpload';
import Input from '@/components/ui/Input';
import StatCard from '@/components/ui/StatCard';
import Select from '@/components/ui/Select';

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

const normalizeCrbm = (crbm: string | null | undefined): string => {
  if (!crbm) return 'CRBM não informado';
  return crbm
    .replace(/°/g, 'º')
    .replace(/CRMB/gi, 'CRBM')
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toUpperCase();
};

const normalizeCidade = (cidade: string | null | undefined): string => {
  if (!cidade) return 'Cidade não informada';
  return cidade
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s\u00A0]+/g, ' ')
    .trim()
    .toUpperCase();
};

export default function Obms() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

  const [obms, setObms] = useState<Obm[]>([]);
  const [obmOptions, setObmOptions] = useState<ObmOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', cidade: '', crbm: '' });
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
  const [openSiglasByCity, setOpenSiglasByCity] = useState<Record<string, Set<string>>>(() => ({}));
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [allObmsForFilters, setAllObmsForFilters] = useState<Obm[]>([]);

  const parentRef = useRef<HTMLDivElement>(null);
  const [scrollbarWidth, setScrollbarWidth] = useState(0);

  const rowVirtualizer = useVirtualizer({
    count: obms.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 65,
    overscan: 5,
  });

  useEffect(() => {
    const scrollElement = parentRef.current;
    if (!scrollElement) { setScrollbarWidth(0); return; }

    const updateScrollbarWidth = () => {
      const width = scrollElement.offsetWidth - scrollElement.clientWidth;
      setScrollbarWidth(width > 0 ? width : 0);
    };

    updateScrollbarWidth();
    const resizeObserver = new ResizeObserver(updateScrollbarWidth);
    resizeObserver.observe(scrollElement);

    return () => resizeObserver.disconnect();
  }, [obms.length]);

  useEffect(() => {
    const fetchAllForFilters = async () => {
      try {
        const response = await api.get('/api/admin/obms?limit=9999');
        setAllObmsForFilters(response.data.data);
      } catch { toast.error('Falha ao carregar opções de filtro.'); }
    };
    fetchAllForFilters();
  }, []);

  useEffect(() => { setPageTitle('Gerenciar OBMs'); }, [setPageTitle]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '1000', q: filters.q || '' });

      const [obmsRes, optionsRes, metadataRes] = await Promise.all([
        api.get<ApiResponse<Obm>>(`/api/admin/obms?${params.toString()}`),
        api.get('/api/admin/viaturas/distinct-obms'),
        api.get('/api/admin/metadata/viaturas_last_upload').catch(() => null),
      ]);

      setObms(obmsRes.data.data);
      setPagination(obmsRes.data.pagination);

      const options = Array.isArray(optionsRes.data) ? optionsRes.data.map((option: any) => ({
        value: option.value || option.obm || option.nome,
        label: option.label || option.value || option.obm,
        cidade: option.cidade ? String(option.cidade) : '',
      })) : [];
      setObmOptions(options);

      if (metadataRes && metadataRes.data?.value) {
        setLastUpload(new Date(metadataRes.data.value).toLocaleString('pt-BR'));
      } else { setLastUpload(null); }
    } catch (error) { toast.error('Não foi possível carregar os dados das OBMs.'); }
    finally { setIsLoading(false); }
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const groupedObms = useMemo(() => {
    return obms.reduce<Record<string, Record<string, Obm[]>>>((acc, obm) => {
      const crbmKey = normalizeCrbm(obm.crbm);
      const cidadeKey = obm.cidade?.trim() || 'Cidade não informada';
      if (!acc[crbmKey]) acc[crbmKey] = {};
      if (!acc[crbmKey][cidadeKey]) acc[crbmKey][cidadeKey] = [];
      acc[crbmKey][cidadeKey].push(obm);
      return acc;
    }, {});
  }, [obms]);

  const crbmEntries = useMemo(() =>
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
  const handleFilterChange = (value: string) => { setFilters(prev => ({ ...prev, q: value })); setCurrentPage(1); };

  const handleOpenFormModal = (item: Obm | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  // Toggle functions (kept simple)
  const toggleCrbm = (crbm: string) => setOpenCrbmKeys(prev => { const n = new Set(prev); n.has(crbm) ? n.delete(crbm) : n.add(crbm); return n; });
  const toggleCity = (crbm: string, cidade: string) => setOpenCitiesByCrbm(prev => { const cur = prev[crbm] || new Set(); const n = new Set(cur); n.has(cidade) ? n.delete(cidade) : n.add(cidade); return { ...prev, [crbm]: n }; });
  const toggleSigla = (crbm: string, cidade: string, sigla: string) => { const k = `${crbm}-${cidade}`; setOpenSiglasByCity(prev => { const cur = prev[k] || new Set(); const n = new Set(cur); n.has(sigla) ? n.delete(sigla) : n.add(sigla); return { ...prev, [k]: n }; }); };

  const handleSave = async (data: any) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = data.id ? 'atualizada' : 'criada';
    try {
      if (data.id) await api.put(`/api/admin/obms/${data.id}`, data);
      else await api.post('/api/admin/obms', data);
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response?.status === 400 && err.response.data?.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else { toast.error(err.response?.data?.message || 'Erro ao salvar OBM.'); }
    } finally { setIsSaving(false); }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/obms/${itemToDeleteId}`);
      toast.success('OBM excluída com sucesso!');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir OBM.'); }
    finally { setIsDeleting(false); handleCloseConfirmModal(); }
  };

  const handleConfirmDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await api.delete('/api/admin/obms');
      toast.success('Todas as OBMs foram removidas.');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir todas as OBMs.'); }
    finally { setIsDeletingAll(false); setIsConfirmDeleteAllModalOpen(false); }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await api.post('/api/admin/obms/upload-csv', formData);
      toast.success(response.data?.message || 'Arquivo processado com sucesso!');
      if (response.data?.errors?.length) toast.error(`Algumas linhas foram ignoradas.`);
      fetchData();
      setIsUploadModalOpen(false);
    } catch (error: any) { toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.'); }
    finally { setIsUploading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide font-mono hidden md:block">Gerenciamento de OBMs</h2>
          <p className="text-slate-400 text-sm mt-1">Organizações Bombeiro Militar do Estado de Goiás.</p>
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button onClick={() => setIsUploadModalOpen(true)} className="!bg-amber-500/10 !text-amber-400 border border-amber-500/50 hover:!bg-amber-500/20"><Upload className="w-4 h-4 mr-2" />Importar</Button>
            <Button onClick={() => setIsConfirmDeleteAllModalOpen(true)} disabled={obms.length === 0 || isDeletingAll} className="!bg-rose-500/10 !text-rose-400 border border-rose-500/50 hover:!bg-rose-500/20"><Trash className="w-4 h-4 mr-2" />Excluir Tudo</Button>
            <Button onClick={() => handleOpenFormModal()} variant="primary"><Plus className="w-4 h-4 mr-2" />Nova OBM</Button>
          </div>
        )}
      </div>

      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden">
        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-end mb-6 gap-6">
          <div className="relative group w-full md:w-auto flex-grow max-w-md">
            <input
              type="text"
              placeholder="Filtrar por nome, sigla..."
              value={filters.q}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0f141e] border border-slate-700/50 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_15px_rgba(34,211,238,0.2)] transition-all font-mono text-sm"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          </div>

          <div className="w-full md:w-auto min-w-[200px]">
            <StatCard
              title="Total de OBMs"
              value={isLoading ? '' : pagination?.totalRecords ?? 0}
              isLoading={isLoading}
              variant="transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-hidden rounded-lg border border-white/5 bg-black/20">
          <table className="min-w-full table-fixed" style={scrollbarWidth > 0 ? { width: `calc(100% - ${scrollbarWidth}px)` } : undefined}>
            <thead className="bg-white/5 decoration-clone">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: isAdmin ? '30%' : '40%' }}>Nome</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>Sigla</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>CRBM</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>Cidade</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '15%' }}>Telefone</th>
                {isAdmin && <th className="px-6 py-4 text-right text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5" style={{ width: '10%' }}>Ações</th>}
              </tr>
            </thead>
          </table>
          <div ref={parentRef} className="overflow-auto custom-scrollbar" style={{ height: '600px' }}>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
              {isLoading ? (
                <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10 text-cyan-500" /></div>
              ) : rowVirtualizer.getVirtualItems().length > 0 ? (
                rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const obm = obms[virtualRow.index];
                  return (
                    <div
                      key={obm.id}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '100%',
                        height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)`,
                        display: 'flex', alignItems: 'center',
                      }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group text-sm"
                    >
                      <div className="px-6 py-2 font-medium text-white break-words" style={{ width: isAdmin ? '30%' : '40%' }}>{obm.nome}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-cyan-400 font-mono font-bold" style={{ width: '15%' }}>{obm.abreviatura}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-slate-400" style={{ width: '15%' }}>{obm.crbm || 'N/A'}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-slate-400" style={{ width: '15%' }}>{obm.cidade || 'N/A'}</div>
                      <div className="px-6 py-2 whitespace-nowrap text-slate-400 font-mono" style={{ width: '15%' }}>{obm.telefone || 'N/A'}</div>
                      {isAdmin && (
                        <div className="px-6 py-2 whitespace-nowrap text-right space-x-2" style={{ width: '10%' }}>
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleOpenFormModal(obm)} className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all"><Edit className="w-4 h-4" /></button>
                            <button onClick={() => handleDeleteClick(obm.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="flex justify-center items-center h-full"><p className="text-slate-500 font-mono uppercase tracking-widest text-xs">Nenhuma OBM encontrada.</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Hierarchical View (Keep existing logic but styled) */}
        <div className="md:hidden space-y-4">
          {crbmEntries.map(({ crbm, total, cityEntries }) => {
            const isCrbmOpen = openCrbmKeys.has(crbm);
            return (
              <div key={crbm} className="bg-[#0e121b] border border-white/10 rounded-xl overflow-hidden shadow-lg">
                <button onClick={() => toggleCrbm(crbm)} className="w-full flex items-center justify-between p-4 bg-white/5">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-500">Comando Regional</p>
                    <h3 className="text-white font-bold">{crbm}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full">{total}</span>
                    <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isCrbmOpen ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                {isCrbmOpen && (
                  <div className="p-4 space-y-3 bg-black/20">
                    {cityEntries.map(([cidade, lista]) => (
                      <div key={cidade} className="border border-white/5 rounded-lg p-3">
                        <h4 className="text-slate-300 font-bold text-xs uppercase mb-2 flex items-center gap-2"><Building2 size={12} /> {cidade}</h4>
                        <div className="space-y-2 pl-2 border-l border-white/10">
                          {lista.map(obm => (
                            <div key={obm.id} className="flex justify-between items-center group">
                              <div>
                                <div className="text-white text-sm font-medium">{obm.nome}</div>
                                <div className="text-[10px] text-cyan-500 font-mono">{obm.abreviatura}</div>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-2">
                                  <button onClick={() => handleOpenFormModal(obm)} className="p-1.5 text-sky-500"><Edit size={14} /></button>
                                  <button onClick={() => handleDeleteClick(obm.id)} className="p-1.5 text-rose-500"><Trash2 size={14} /></button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="mt-4 border-t border-white/5 pt-4">
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm obmToEdit={itemToEdit} obmOptions={obmOptions} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>

      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta OBM?" isLoading={isDeleting} />
      <ConfirmationModal isOpen={isConfirmDeleteAllModalOpen} onClose={() => setIsConfirmDeleteAllModalOpen(false)} onConfirm={handleConfirmDeleteAll} title="Confirmar limpeza" message="Esta ação removerá TODAS as OBMs cadastradas. Deseja continuar?" isLoading={isDeletingAll} />

      <Modal isOpen={isUploadModalOpen} title="Atualizar via Planilha" onClose={() => setIsUploadModalOpen(false)}>
        <FileUpload title="Upload CSV" onUpload={handleUpload} isLoading={isUploading} acceptedFileTypes=".csv" lastUpload={lastUpload} />
        <div className="flex justify-end mt-4"><Button onClick={() => setIsUploadModalOpen(false)} variant="secondary">Cancelar</Button></div>
      </Modal>
    </div>
  );
}
