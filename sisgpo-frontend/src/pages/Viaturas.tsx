import React, { useState, ChangeEvent, useEffect, useCallback, useRef, useMemo } from 'react';
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
import StatCard from '../components/ui/StatCard'; // Import StatCard
import Select from '../components/ui/Select';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import type { Plantao } from './Plantoes';

interface Viatura {
  id: number;
  prefixo: string;
  cidade: string | null;
  obm: string | null;
  obm_abreviatura: string | null;
  ativa: boolean;
}
interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Viaturas() {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', obm: '', cidade: '' });
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
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [impactAck, setImpactAck] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(() => new Set());
  const [empenhadasViaturas, setEmpenhadasViaturas] = useState<Set<string>>(new Set());
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [allViaturasForFilters, setAllViaturasForFilters] = useState<Viatura[]>([]);
  const [obmFilter, setObmFilter] = useState('');
  const [cidadeFilter, setCidadeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [previewData, setPreviewData] = useState<{
    totalViaturas: number;
    totalRelatedPlantoes: number;
    totalViaturaVinculos: number;
    totalMilitarVinculos: number;
  } | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const getViaturaStatus = useCallback((viatura: Viatura) => {
    const prefix = viatura.prefixo?.toUpperCase() ?? '';
    if (prefix && empenhadasViaturas.has(prefix)) {
      return {
        label: 'EMPENHADO',
        classes: 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/40',
      };
    }
    if (viatura.ativa) {
      return {
        label: 'ATIVA',
        classes: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40',
      };
    }
    return {
      label: 'INATIVA',
      classes: 'bg-spamRed/20 text-spamRed',
    };
  }, [empenhadasViaturas]);

  const filteredViaturas = useMemo(() => {
    if (!statusFilter) return viaturas;
    return viaturas.filter(v => getViaturaStatus(v).label === statusFilter);
  }, [viaturas, statusFilter, getViaturaStatus]);

  const empenhadasCount = useMemo(() => {
    return viaturas.filter(v => v.prefixo && empenhadasViaturas.has(v.prefixo.toUpperCase())).length;
  }, [viaturas, empenhadasViaturas]);
  // Virtualização removida: listagem usa mapeamento direto

  useEffect(() => {
    setPageTitle("Viaturas");
  }, [setPageTitle]);

  useEffect(() => {
    if (isImpactModalOpen) {
      const fetchPreview = async () => {
        try {
          const response = await api.get('/api/admin/viaturas/clear-all/preview');
          setPreviewData(response.data);
        } catch (err) {
          toast.error('Não foi possível carregar o preview da limpeza.');
          setIsImpactModalOpen(false); // Close modal if preview fails
        }
      };
      fetchPreview();
    } else {
      setPreviewData(null); // Clear preview data when modal closes
      setConfirmText(''); // Clear confirm text
    }
  }, [isImpactModalOpen]);

  useEffect(() => {
    const fetchAllForFilters = async () => {
      try {
      const response = await api.get('/api/admin/viaturas?limit=9999');
      setAllViaturasForFilters(response.data.data);
    } catch {
      toast.error('Falha ao carregar opções de filtro.');
      }
    };
    fetchAllForFilters();
  }, []);

  const obms = useMemo(() => {
    const allObms = allViaturasForFilters.map(v => v.obm).filter(Boolean);
    return [...new Set(allObms)].sort();
  }, [allViaturasForFilters]);

  const cidades = useMemo(() => {
    const allCidades = allViaturasForFilters.map(v => v.cidade).filter(Boolean);
    return [...new Set(allCidades)].sort();
  }, [allViaturasForFilters]);


  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '1000', ...filters });
      const response = await api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) { toast.error('Não foi possível carregar as viaturas.'); }
    finally { setIsLoading(false); }
  }, [filters, currentPage]);

  const fetchEmpenhadas = useCallback(async () => {
    try {
      const engaged = new Set<string>();
      let page = 1;
      const limit = 100;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      while (true) {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const response = await api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`);
        const plantoes = response.data.data ?? [];
        plantoes.forEach((plantao) => {
          const normalizedPrefix = plantao.viatura_prefixo?.trim().toUpperCase();
          if (!normalizedPrefix) {
            return;
          }
          const plantaoDate = new Date(plantao.data_plantao);
          plantaoDate.setHours(0, 0, 0, 0);
          if (Number.isNaN(plantaoDate.getTime())) {
            return;
          }
          if (plantaoDate >= today) {
            engaged.add(normalizedPrefix);
          }
        });
        const paginationInfo = response.data.pagination;
        if (!paginationInfo || paginationInfo.currentPage >= paginationInfo.totalPages) {
          break;
        }
        page += 1;
      }
      setEmpenhadasViaturas(engaged);
    } catch {
      setEmpenhadasViaturas(new Set());
    }
  }, []);

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
      if (error.response && error.response.status === 404) {
        setLastUpload(null);
      } else {
        console.error("Falha ao buscar metadados de upload:", error);
      }
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
    await fetchEmpenhadas();
  }, [fetchData, fetchEmpenhadas]);

  useEffect(() => { refreshData(); fetchLastUpload(); }, [refreshData, fetchLastUpload]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  };
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
      fetchLastUpload();
      setIsUploadModalOpen(false);
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao enviar arquivo.'); }
    finally { setIsUploading(false); }
  };

  const handleClearAllViaturas = async () => {
    setIsClearing(true);
    try {
      await api.delete('/api/admin/viaturas/clear-all?confirm=1', {
        headers: {
          'X-Confirm-Purge': 'VIATURAS',
        },
      });
      toast.success('Tabela de viaturas limpa com sucesso!');
      await refreshData();
      fetchLastUpload();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao limpar a tabela de viaturas.'); }
    finally { setIsClearing(false); setIsClearConfirmModalOpen(false); }
  };

  
  // Removido: duplicaÃ§Ã£o de getViaturaStatus, empenhadasCount e filteredViaturas

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-textMain">Viaturas</h2>
        {isAdmin && (
          <div className="flex gap-2 w-full md:w-auto">
            <Button onClick={() => setIsUploadModalOpen(true)} variant="warning" className="w-full md:w-auto">
              <Upload className="w-4 h-4 mr-2" />
              Importar Viaturas
            </Button>
            <Button onClick={() => handleOpenFormModal()} variant="primary" className="w-full md:w-auto">Adicionar Viatura</Button>
            <Button onClick={() => { setImpactAck(false); setIsImpactModalOpen(true); }} className="!bg-rose-500 hover:!bg-rose-600 w-full md:w-auto text-white">
              <Trash2 className="w-4 h-4 mr-2" /> Limpar Tabela
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Total de Viaturas"
          value={isLoading ? '' : pagination?.totalRecords ?? 0}
          isLoading={isLoading}
          variant="transparent"
        />
        <StatCard
          title="Viaturas Empenhadas"
          value={isLoading ? '' : empenhadasCount}
          isLoading={isLoading}
          description="Viaturas atualmente empenhadas em plantões futuros ou presentes."
          variant="transparent"
        />
      </div>

      {/* Barra de filtros posicionada abaixo dos cards */}
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-white/10 backdrop-blur-[2px] border border-white/20 p-4 rounded-lg">
        <Input
          type="text"
          placeholder="Filtrar por prefixo, cidade, obm..."
          value={filters.q}
          onChange={(e) => handleFilterChange('q', e.target.value)}
          className="w-full md:w-72"
        />
        <Select
          value={obmFilter}
          onChange={(e) => {
            setObmFilter(e.target.value);
            handleFilterChange('obm', e.target.value);
          }}
          className="w-full md:w-56"
        >
          <option value="">Filtrar por OBM...</option>
          {obms.map(obm => (
            <option key={obm} value={obm}>{obm}</option>
          ))}
        </Select>
        <Select
          value={cidadeFilter}
          onChange={(e) => {
            setCidadeFilter(e.target.value);
            handleFilterChange('cidade', e.target.value);
          }}
          className="w-full md:w-56"
        >
          <option value="">Filtrar por Cidade...</option>
          {cidades.map(cidade => (
            <option key={cidade} value={cidade}>{cidade}</option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-56"
        >
          <option value="">Filtrar por Status...</option>
          <option value="ATIVA">Ativa</option>
          <option value="INATIVA">Inativa</option>
          <option value="EMPENHADO">Empenhado</option>
        </Select>
        <Button onClick={() => {
          setObmFilter('');
          setCidadeFilter('');
          setStatusFilter('');
          handleFilterChange('obm', '');
          handleFilterChange('cidade', '');
          handleFilterChange('q', '');
        }} variant="secondary" className="w-full md:w-auto">
          Limpar Filtros
        </Button>
      </div>

      <div className="space-y-4">
        {/* Card View for Mobile */}
        <div className="viaturas-detalhamento space-y-3 md:hidden">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner className="h-10 w-10" />
            </div>
          ) : filteredViaturas.length > 0 ? (
            filteredViaturas.map((viatura) => {
              const hasSigla = Boolean(viatura.obm_abreviatura);
              const isExpanded = expandedCards.has(viatura.id);
              const status = getViaturaStatus(viatura);
              return (
                <div
                  key={viatura.id}
                  className={`rounded-lg border border-white/20 p-4 shadow-sm transition bg-white/10 backdrop-blur-[2px]`}
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
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.classes}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      {isAdmin && (
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
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <p className="py-6 text-center text-textSecondary">Nenhuma viatura encontrada.</p>
          )}
        </div>

        {/* Table View for Desktop */}
        <div className="hidden md:block bg-white/10 backdrop-blur-[2px] border border-white/20 rounded-lg shadow-sm">
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner className="h-10 w-10" />
            </div>
          ) : filteredViaturas.length > 0 ? (
            <table className="min-w-full divide-y divide-borderDark/60">
              <thead className="bg-background/40">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Prefixo</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">OBM</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Cidade</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">Status</th>
                  <th scope="col" className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderDark/60">
                {filteredViaturas.map((viatura) => {
                  const status = getViaturaStatus(viatura);
                  return (
                    <tr key={viatura.id} className="hover:bg-background/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textMain">{viatura.prefixo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{viatura.obm_abreviatura || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">{viatura.cidade || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${status.classes}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        {isAdmin && (
                          <>
                            <Button onClick={() => handleOpenFormModal(viatura)} variant="icon" size="sm" className="text-sky-500 hover:text-sky-400">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => handleDeleteClick(viatura.id)} variant="icon" size="sm" className="text-rose-500 hover:text-rose-400">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="py-10 text-center text-textSecondary">Nenhuma viatura encontrada.</p>
          )}
        </div>


        {pagination && (
          <div className="mt-4">
            <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
          </div>
        )}
      </div>

      {/* Modal de Impacto antes da confirmação final */}
      <Modal
        isOpen={isImpactModalOpen}
        onClose={() => setIsImpactModalOpen(false)}
        title="Atenção: Exclusão de Viaturas e Dados Relacionados"
      >
        <div className="space-y-4 text-textSecondary">
          <p>Esta ação removerá permanentemente todos os registros da tabela de Viaturas.</p>
          {previewData ? (
            <div className="bg-cardSlate p-4 rounded-md border border-borderDark/60">
              <h3 className="font-semibold text-textMain mb-2">Impacto da Operação:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Serão removidas: <span className="font-bold text-rose-400">{previewData.totalViaturas}</span> viaturas.</li>
                <li>Serão afetados: <span className="font-bold text-rose-400">{previewData.totalRelatedPlantoes}</span> plantões futuros/presentes.</li>
                <li>Serão removidos: <span className="font-bold text-rose-400">{previewData.totalViaturaVinculos}</span> vínculos de viaturas em plantões.</li>
                <li>Serão removidos: <span className="font-bold text-rose-400">{previewData.totalMilitarVinculos}</span> vínculos de militares em plantões.</li>
              </ul>
            </div>
          ) : (
            <div className="flex justify-center py-4"><Spinner /></div>
          )}
          <p>Esta operação é irreversível. Para confirmar, digite "APAGAR VIATURAS" no campo abaixo.</p>
          <Input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Digite APAGAR VIATURAS"
            className="w-full"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={impactAck}
              onChange={(e) => setImpactAck(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm">Entendo as consequências e desejo continuar</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setIsImpactModalOpen(false)}>Cancelar</Button>
            <Button
              className="!bg-rose-500 hover:!bg-rose-600 text-white disabled:opacity-60"
              disabled={!impactAck || confirmText !== 'APAGAR VIATURAS'}
              onClick={() => { setIsImpactModalOpen(false); setIsClearConfirmModalOpen(true); }}
            >
              Continuar
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
      <ConfirmationModal isOpen={isClearConfirmModalOpen} onClose={() => setIsClearConfirmModalOpen(false)} onConfirm={handleClearAllViaturas} title="Confirmar Limpeza Total" message="ATENÇÃO: Esta ação é irreversível e irá apagar TODAS as viaturas do banco de dados. Deseja continuar?" isLoading={isClearing} />
      
      <Modal
        isOpen={isUploadModalOpen}
        title="Importar/Atualizar Viaturas"
        onClose={() => setIsUploadModalOpen(false)}
      >
        <FileUpload
          title="Importar/Atualizar Viaturas"
          onUpload={handleUpload}
          isLoading={isUploading}
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





