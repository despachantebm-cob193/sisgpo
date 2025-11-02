// Arquivo: frontend/src/pages/Plantoes.tsx (VERSÃO FINAL RESPONSIVA)

import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';

// --- Componentes de UI ---
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { Edit, Trash2, CalendarPlus, Plane, Shield, Stethoscope, Car, User, Briefcase } from 'lucide-react';

// --- Formulários ---
import PlantaoForm from '@/components/forms/PlantaoForm';
import EscalaMedicoForm from '@/components/forms/EscalaMedicoForm';
import EscalaAeronaveForm from '@/components/forms/EscalaAeronaveForm';
import EscalaCodecForm from '@/components/forms/EscalaCodecForm';
import { useUiStore } from '@/store/uiStore';

// --- Interfaces ---
export interface GuarnicaoMembro {
  militar_id: number;
  funcao: string;
  nome_guerra: string | null;
  nome_completo: string | null;
  nome_exibicao: string;
  posto_graduacao: string | null;
  telefone: string | null;
  plantao_id?: number;
}

export interface Plantao {
  id: number;
  data_plantao: string;
  viatura_prefixo: string;
  obm_abreviatura: string;
  guarnicao: GuarnicaoMembro[];
}

export interface Viatura { id: number; prefixo: string; obm_id: number | null; }

export interface PlantaoDetalhado {
  id: number;
  data_plantao: string;
  viatura_id: number;
  obm_id: number | null;
  observacoes: string;
  guarnicao: GuarnicaoMembro[];
}
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }
interface EscalaMedico { id: number; civil_id: number; nome_completo: string; funcao: string; entrada_servico: string; saida_servico: string; status_servico: string; }
interface EscalaAeronave { id: number; data: string; aeronave_prefixo: string; status: string; primeiro_piloto: string; segundo_piloto: string; }
interface EscalaCodec { id: number; data: string; turno: 'Diurno' | 'Noturno'; ordem_plantonista: number; nome_plantonista: string; }

type ActiveTab = 'plantoes' | 'escalaMedicos' | 'escalaAeronaves' | 'escalaCodec';

// Componente para os botões das abas
const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) => (
  <button
    onClick={onClick}
    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-tagBlue text-textMain shadow-md'
        : 'bg-cardSlate text-textSecondary hover:bg-background'
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
  </button>
);


export default function Plantoes() {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle("Gerenciamento de Escalas");
  }, [setPageTitle]);

  const [activeTab, setActiveTab] = useState<ActiveTab>('plantoes');
  const [filters, setFilters] = useState({ data_inicio: '', data_fim: '' });
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoadingPlantoes, setIsLoadingPlantoes] = useState(true);
  const [plantaoPagination, setPlantaoPagination] = useState<PaginationState | null>(null);
  const [currentPlantaoPage, setCurrentPlantaoPage] = useState(1);
  const [isPlantaoModalOpen, setIsPlantaoModalOpen] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);
  const [isSavingPlantao, setIsSavingPlantao] = useState(false);
  const [escalaMedicos, setEscalaMedicos] = useState<EscalaMedico[]>([]);
  const [isLoadingEscalaMedicos, setIsLoadingEscalaMedicos] = useState(true);
  const [isEscalaMedicoModalOpen, setIsEscalaMedicoModalOpen] = useState(false);
  const [isSavingEscalaMedico, setIsSavingEscalaMedico] = useState(false);
  const [escalaAeronaves, setEscalaAeronaves] = useState<EscalaAeronave[]>([]);
  const [isLoadingAeronaves, setIsLoadingAeronaves] = useState(true);
  const [isAeronaveModalOpen, setIsAeronaveModalOpen] = useState(false);
  const [isSavingAeronave, setIsSavingAeronave] = useState(false);
  const [escalaCodec, setEscalaCodec] = useState<EscalaCodec[]>([]);
  const [isLoadingCodec, setIsLoadingCodec] = useState(true);
  const [isCodecModalOpen, setIsCodecModalOpen] = useState(false);
  const [isSavingCodec, setIsSavingCodec] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: number; type: ActiveTab } | null>(null);

  const handleEditClick = async (plantaoId: number) => {
    try {
      const response = await api.get<PlantaoDetalhado>(`/api/admin/plantoes/${plantaoId}`);
      setPlantaoToEdit(response.data);
      setIsPlantaoModalOpen(true);
    } catch (err) {
      toast.error('Não foi possível carregar os dados do plantão para edição.');
    }
  };

  const fetchViaturas = useCallback(async () => {
      try {
        // Assegura que o tipo esperado é um array de Viaturas
        const viaturasRes = await api.get<ApiResponse<Viatura>>('/api/admin/viaturas/simple');
        // Adiciona fallback para array vazio caso a resposta não venha como esperado
        setViaturas(viaturasRes.data.data || []);
      } catch (err) {
        toast.error('Não foi possível carregar a lista de viaturas.');
        setViaturas([]); // Garante que seja um array vazio em caso de erro
      }
    }, []);

  const fetchPlantoes = useCallback(async () => {
    setIsLoadingPlantoes(true);
    try {
      const filteredFilters = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== ''));
      const params = new URLSearchParams({ page: String(currentPlantaoPage), limit: '15', ...filteredFilters });
      const plantoesRes = await api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`);
      setPlantoes(plantoesRes.data.data);
      setPlantaoPagination(plantoesRes.data.pagination);

    } catch (err) { toast.error('Não foi possível carregar os plantões.'); }
    finally { setIsLoadingPlantoes(false); }
  }, [filters, currentPlantaoPage]);

  const fetchEscalaMedicos = useCallback(async () => {
    setIsLoadingEscalaMedicos(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get<ApiResponse<EscalaMedico>>(`/api/admin/escala-medicos?${params.toString()}`);
      setEscalaMedicos(response.data.data || []);
    } catch (err) { toast.error('Não foi possível carregar a escala de médicos.'); }
    finally { setIsLoadingEscalaMedicos(false); }
  }, [filters]);

  const fetchEscalaAeronaves = useCallback(async () => {
    setIsLoadingAeronaves(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get<EscalaAeronave[]>(`/api/admin/escala-aeronaves?${params.toString()}`);
      setEscalaAeronaves(response.data);
    } catch (err) { toast.error('Não foi possível carregar a escala de aeronaves.'); }
    finally { setIsLoadingAeronaves(false); }
  }, [filters]);

  const fetchEscalaCodec = useCallback(async () => {
    setIsLoadingCodec(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get<EscalaCodec[]>(`/api/admin/escala-codec?${params.toString()}`);
      setEscalaCodec(response.data);
    } catch (err) { toast.error('Não foi possível carregar a escala do CODEC.'); }
    finally { setIsLoadingCodec(false); }
  }, [filters]);

  useEffect(() => {
    fetchViaturas();
  }, [fetchViaturas]);

  useEffect(() => {
    switch (activeTab) {
      case 'plantoes': fetchPlantoes(); break;
      case 'escalaMedicos': fetchEscalaMedicos(); break;
      case 'escalaAeronaves': fetchEscalaAeronaves(); break;
      case 'escalaCodec': fetchEscalaCodec(); break;
    }
  }, [activeTab, fetchPlantoes, fetchEscalaMedicos, fetchEscalaAeronaves, fetchEscalaCodec]);

  const handleSavePlantao = async (data: any) => {
    setIsSavingPlantao(true);
    try {
      if (data.id) await api.put(`/api/admin/plantoes/${data.id}`, data);
      else await api.post('/api/admin/plantoes', data);
      toast.success('Plantão salvo com sucesso!');
      setIsPlantaoModalOpen(false);
      fetchPlantoes();
    } catch (err: any) {
      // Log para depuração
      if (err.response) {
        console.log('Dados da resposta de erro do servidor:', err.response.data);

        // ADICIONE ESTA LINHA para inspecionar o array de erros diretamente
        if (err.response.data.errors) {
          console.log('Detalhes dos erros de validação:', err.response.data.errors);
        }

      } else {
        console.error("Erro não relacionado a uma resposta do servidor:", err);
      }

      // Lógica aprimorada para exibir o erro
      let errorMessage = 'Erro ao salvar o plantão.';
      if (err.response && err.response.data) {
        const { data } = err.response;
        
        // Se houver um array de 'errors', concatena todas as mensagens
        if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
            errorMessage = data.errors.map((e: { msg: string }) => e.msg).join('; ');
        } 
        // Senão, usa a mensagem principal se ela existir
        else if (data.message) {
            errorMessage = data.message;
        }
      }
      toast.error(errorMessage);
    }
    finally { setIsSavingPlantao(false); }
  };

  const handleSaveEscalaMedico = async (data: any) => {
    setIsSavingEscalaMedico(true);
    try {
      await api.post('/api/admin/escala-medicos', data);
      toast.success('Registro de escala médica salvo com sucesso!');
      setIsEscalaMedicoModalOpen(false);
      fetchEscalaMedicos();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar escala.'); }
    finally { setIsSavingEscalaMedico(false); }
  };

  const handleSaveAeronave = async (data: any) => {
    setIsSavingAeronave(true);
    try {
      // A requisição POST é feita aqui
      await api.post('/api/admin/escala-aeronaves', data);
      
      toast.success('Escala de aeronave salva com sucesso!');
      setIsAeronaveModalOpen(false);
      fetchEscalaAeronaves(); // Atualiza a lista na tela

    } catch (error: any) {
      // --- Bloco de Captura de Erro Aprimorado ---

      // 1. Loga o erro detalhado no console para o desenvolvedor
      if (error.response) {
        console.error('Erro ao salvar escala de aeronave:', error.response.data);
      } else {
        console.error('Erro inesperado:', error);
      }

      // 2. Prepara uma mensagem clara para o usuário
      let errorMessage = 'Não foi possível salvar a escala.';
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        
        // Concatena múltiplos erros de validação, se o backend os enviar
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: { msg: string }) => e.msg).join('; ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }
      
      // 3. Exibe o erro para o usuário usando um toast
      toast.error(errorMessage);

    } finally {
      setIsSavingAeronave(false);
    }
  };

  const handleSaveCodec = async (data: any) => {
    setIsSavingCodec(true);
    try {
      await api.post('/api/admin/escala-codec', data);
      toast.success('Escala do CODEC salva com sucesso!');
      setIsCodecModalOpen(false);
      fetchEscalaCodec();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar escala.'); }
    finally { setIsSavingCodec(false); }
  };

  const handleDeleteClick = (id: number, type: ActiveTab) => {
    setItemToDelete({ id, type });
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      let url = `/api/admin/${itemToDelete.type}/${itemToDelete.id}`;
      if (itemToDelete.type === 'escalaAeronaves') url = `/api/admin/escala-aeronaves/${itemToDelete.id}`;
      else if (itemToDelete.type === 'escalaMedicos') url = `/api/admin/escala-medicos/${itemToDelete.id}`;
      else if (itemToDelete.type === 'escalaCodec') url = `/api/admin/escala-codec/${itemToDelete.id}`;
      
      await api.delete(url);
      toast.success('Registro excluído com sucesso!');
      
      switch (itemToDelete.type) {
        case 'plantoes': fetchPlantoes(); break;
        case 'escalaMedicos': fetchEscalaMedicos(); break;
        case 'escalaAeronaves': fetchEscalaAeronaves(); break;
        case 'escalaCodec': fetchEscalaCodec(); break;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir o registro.');
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      setItemToDelete(null);
    }
  };

  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formatDateTime = (isoString: string) => new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-textMain">Gerenciamento de Escalas</h2>
          <p className="text-textSecondary mt-2">Gerencie as escalas de viaturas, médicos, pilotos e plantonistas.</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button onClick={() => setIsPlantaoModalOpen(true)} className="bg-cardGreen hover:bg-cardGreen/80 text-textMain"><CalendarPlus className="w-4 h-4 mr-2" />Lançar Plantão VTR</Button>
          <Button onClick={() => setIsEscalaMedicoModalOpen(true)} className="bg-cardSlate hover:bg-cardSlate/80 text-textMain"><Stethoscope className="w-4 h-4 mr-2" />Escala Médicos</Button>
          <Button onClick={() => setIsAeronaveModalOpen(true)} className="bg-premiumOrange hover:bg-premiumOrange/80 text-textMain"><Plane className="w-4 h-4 mr-2" />Escala Pilotos</Button>
          <Button onClick={() => setIsCodecModalOpen(true)} className="bg-tagBlue hover:bg-tagBlue/80 text-textMain"><Shield className="w-4 h-4 mr-2" />Escala CODEC</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-searchbar rounded-lg border">
        <div>
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input id="data_inicio" type="date" value={filters.data_inicio} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters(prev => ({...prev, data_inicio: e.target.value}))} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={filters.data_fim} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters(prev => ({...prev, data_fim: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setFilters({ data_inicio: '', data_fim: '' })} className="w-full bg-searchbar hover:bg-searchbar/80 text-textMain">Limpar Filtros</Button>
        </div>
      </div>

      <div>
        {/* --- NAVEGAÇÃO DE ABAS COM BOTÕES --- */}
        <div className="p-2 bg-background rounded-lg mb-4">
          <div className="flex flex-col sm:flex-row gap-2">
            <TabButton active={activeTab === 'plantoes'} onClick={() => setActiveTab('plantoes')} icon={Car} label="Viaturas" />
            <TabButton active={activeTab === 'escalaMedicos'} onClick={() => setActiveTab('escalaMedicos')} icon={Stethoscope} label="Médicos" />
            <TabButton active={activeTab === 'escalaAeronaves'} onClick={() => setActiveTab('escalaAeronaves')} icon={Plane} label="Aeronaves" />
            <TabButton active={activeTab === 'escalaCodec'} onClick={() => setActiveTab('escalaCodec')} icon={Shield} label="Plantões (Supervisão/Defesa)" />
          </div>
        </div>

        {/* --- CONTEÚDO DAS ABAS COM TABELAS RESPONSIVAS --- */}
        {activeTab === 'plantoes' && (
          <div className="bg-cardSlate shadow-md rounded-lg overflow-hidden">
            {isLoadingPlantoes ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-searchbar hidden md:table-header-group">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Viatura</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Militar(es) Escalado(s)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Funcoes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">OBM</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderDark/60 md:divide-y-0">
                    {plantoes.map(p => (
                      <tr key={p.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Data:">{formatDate(p.data_plantao)}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Viatura:">{p.viatura_prefixo}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Militar(es) Escalado(s):">
                          {p.guarnicao.length
                            ? p.guarnicao.map(m => (m.nome_exibicao || m.nome_completo || '').trim()).filter(Boolean).join(', ')
                            : 'Sem militar escalado'}
                        </td>
                        <td className="block md:table-cell px-6 py-2 md-py-4" data-label="Funcoes:">
                          {p.guarnicao && p.guarnicao.length > 0
                            ? p.guarnicao.map(m => m.funcao).join(', ')
                            : 'Sem funcao definida'}
                        </td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="OBM:">{p.obm_abreviatura}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4 text-center space-x-4">
                          <button aria-label="Editar" onClick={() => handleEditClick(p.id)} className="text-tagBlue hover:text-tagBlue/80"><Edit size={18}/> Editar</button>
                          <button onClick={() => handleDeleteClick(p.id, 'plantoes')} className="text-spamRed hover:text-spamRed"><Trash2 size={18}/> Excluir</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {plantaoPagination && <Pagination currentPage={plantaoPagination.currentPage} totalPages={plantaoPagination.totalPages} onPageChange={setCurrentPlantaoPage} />}
          </div>
        )}

        {activeTab === 'escalaMedicos' && (
          <div className="bg-cardSlate shadow-md rounded-lg overflow-hidden">
            {isLoadingEscalaMedicos ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-searchbar hidden md:table-header-group">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Entrada</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Saída</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderDark/60 md:divide-y-0">
                    {escalaMedicos?.map(e => (
                      <tr key={e.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Nome:">{e.nome_completo}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Entrada:">{formatDateTime(e.entrada_servico)}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Saída:">{formatDateTime(e.saida_servico)}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Status:"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.status_servico === 'Presente' ? 'bg-cardGreen/20 text-cardGreen' : 'bg-premiumOrange/20 text-premiumOrange'}`}>{e.status_servico}</span></td>
                        <td className="block md:table-cell px-6 py-2 md:py-4 text-center"><button onClick={() => handleDeleteClick(e.id, 'escalaMedicos')} className="text-spamRed hover:text-spamRed"><Trash2 size={18}/> Excluir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaAeronaves' && (
          <div className="bg-cardSlate shadow-md rounded-lg overflow-hidden">
            {isLoadingAeronaves ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-searchbar hidden md:table-header-group">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Aeronave</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">1º Piloto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">2º Piloto</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Status</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderDark/60 md:divide-y-0">
                    {escalaAeronaves.map(e => (
                      <tr key={e.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Data:">{formatDate(e.data)}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Aeronave:">{e.aeronave_prefixo}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="1º Piloto:">{e.primeiro_piloto}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="2º Piloto:">{e.segundo_piloto}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Status:">{e.status}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4 text-center"><button onClick={() => handleDeleteClick(e.id, 'escalaAeronaves')} className="text-spamRed hover:text-spamRed"><Trash2 size={18}/> Excluir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaCodec' && (
          <div className="bg-cardSlate shadow-md rounded-lg overflow-hidden">
            {isLoadingCodec ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-searchbar hidden md:table-header-group">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Turno</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Plantonista</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase">Nome</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderDark/60 md:divide-y-0">
                    {escalaCodec.map(e => (
                      <tr key={e.id} className="block md:table-row border-b md:border-none p-4 md:p-0">
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Data:">{formatDate(e.data)}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Turno:">{e.turno}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Plantonista:">Plantonista {e.ordem_plantonista}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4" data-label="Nome:">{e.nome_plantonista}</td>
                        <td className="block md:table-cell px-6 py-2 md:py-4 text-center"><button onClick={() => handleDeleteClick(e.id, 'escalaCodec')} className="text-spamRed hover:text-spamRed"><Trash2 size={18}/> Excluir</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- Modais --- */}
      <Modal isOpen={isPlantaoModalOpen} onClose={() => setIsPlantaoModalOpen(false)} title="Lançar Plantão de Viatura">
        <PlantaoForm plantaoToEdit={plantaoToEdit} viaturas={viaturas} onSave={handleSavePlantao} onCancel={() => setIsPlantaoModalOpen(false)} isLoading={isSavingPlantao} />
      </Modal>
      <Modal isOpen={isEscalaMedicoModalOpen} onClose={() => setIsEscalaMedicoModalOpen(false)} title="Adicionar Registro na Escala de Médicos">
        <EscalaMedicoForm onSave={handleSaveEscalaMedico} onCancel={() => setIsEscalaMedicoModalOpen(false)} isLoading={isSavingEscalaMedico} />
      </Modal>
      <Modal isOpen={isAeronaveModalOpen} onClose={() => setIsAeronaveModalOpen(false)} title="Lançar Escala de Aeronave">
        <EscalaAeronaveForm onSave={handleSaveAeronave} onCancel={() => setIsAeronaveModalOpen(false)} isLoading={isSavingAeronave} />
      </Modal>
      <Modal isOpen={isCodecModalOpen} onClose={() => setIsCodecModalOpen(false)} title="Lançar Escala do CODEC">
        <EscalaCodecForm onSave={handleSaveCodec} onCancel={() => setIsCodecModalOpen(false)} isLoading={isSavingCodec} />
      </Modal>
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita."
        isLoading={isDeleting}
      />
    </div>
  );
}

