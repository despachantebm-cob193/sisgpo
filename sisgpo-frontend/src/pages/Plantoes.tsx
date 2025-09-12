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
import { Edit, Trash2, CalendarPlus, Plane, Shield, Stethoscope } from 'lucide-react';

// --- Formulários ---
import PlantaoForm from '@/components/forms/PlantaoForm';
import EscalaMedicoForm from '@/components/forms/EscalaMedicoForm';
import EscalaAeronaveForm from '@/components/forms/EscalaAeronaveForm';
import EscalaCodecForm from '@/components/forms/EscalaCodecForm';

// --- Interfaces ---
export interface Plantao { id: number; data_plantao: string; viatura_prefixo: string; obm_abreviatura: string; }
export interface Viatura { id: number; prefixo: string; obm_id: number; }
export interface PlantaoDetalhado { id: number; data_plantao: string; viatura_id: number; obm_id: number; observacoes: string; guarnicao: { militar_id: number; funcao: string; nome_guerra: string; posto_graduacao: string; telefone: string | null; }[]; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }
interface EscalaMedico { id: number; civil_id: number; nome_completo: string; funcao: string; entrada_servico: string; saida_servico: string; status_servico: string; }
interface EscalaAeronave { id: number; data: string; aeronave_prefixo: string; status: string; primeiro_piloto: string; segundo_piloto: string; }
interface EscalaCodec { id: number; data: string; turno: 'Diurno' | 'Noturno'; ordem_plantonista: number; nome_plantonista: string; }

type ActiveTab = 'plantoes' | 'escalaMedicos' | 'escalaAeronaves' | 'escalaCodec';

export default function Plantoes() {
  // ... (todo o código de hooks e handlers permanece o mesmo) ...
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

  const fetchPlantoes = useCallback(async () => {
    setIsLoadingPlantoes(true);
    try {
      const params = new URLSearchParams({ page: String(currentPlantaoPage), limit: '15', ...filters });
      const [plantoesRes, viaturasRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/api/admin/viaturas?all=true'),
      ]);
      setPlantoes(plantoesRes.data.data);
      setPlantaoPagination(plantoesRes.data.pagination);
      setViaturas(viaturasRes.data.data);
    } catch (err) { toast.error('Não foi possível carregar os plantões.'); }
    finally { setIsLoadingPlantoes(false); }
  }, [filters, currentPlantaoPage]);

  const fetchEscalaMedicos = useCallback(async () => {
    setIsLoadingEscalaMedicos(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await api.get<EscalaMedico[]>(`/api/admin/escala-medicos?${params.toString()}`);
      setEscalaMedicos(response.data);
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
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar plantão.'); }
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
      await api.post('/api/admin/escala-aeronaves', data);
      toast.success('Escala de aeronave salva com sucesso!');
      setIsAeronaveModalOpen(false);
      fetchEscalaAeronaves();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar escala.'); }
    finally { setIsSavingAeronave(false); }
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
      {/* --- CABEÇALHO CORRIGIDO --- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciamento de Escalas</h2>
          <p className="text-gray-600 mt-2">Gerencie as escalas de viaturas, médicos, pilotos e plantonistas.</p>
        </div>
        {/* Adicionado flex-wrap para quebrar a linha em telas pequenas */}
        <div className="flex flex-wrap gap-2 justify-center md:justify-end">
          <Button onClick={() => setIsPlantaoModalOpen(true)}><CalendarPlus className="w-4 h-4 mr-2" />Lançar Plantão VTR</Button>
          <Button onClick={() => setIsEscalaMedicoModalOpen(true)} className="bg-teal-600 hover:bg-teal-700"><Stethoscope className="w-4 h-4 mr-2" />Escala Médicos</Button>
          <Button onClick={() => setIsAeronaveModalOpen(true)} className="bg-sky-600 hover:bg-sky-700"><Plane className="w-4 h-4 mr-2" />Escala Pilotos</Button>
          <Button onClick={() => setIsCodecModalOpen(true)} className="bg-purple-600 hover:bg-purple-700"><Shield className="w-4 h-4 mr-2" />Escala CODEC</Button>
        </div>
      </div>

      {/* --- FILTROS CORRIGIDOS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input id="data_inicio" type="date" value={filters.data_inicio} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters(prev => ({...prev, data_inicio: e.target.value}))} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={filters.data_fim} onChange={(e: ChangeEvent<HTMLInputElement>) => setFilters(prev => ({...prev, data_fim: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setFilters({ data_inicio: '', data_fim: '' })} className="w-full bg-gray-600 hover:bg-gray-700">Limpar Filtros</Button>
        </div>
      </div>

      <div>
        {/* --- NAVEGAÇÃO DE ABAS CORRIGIDA --- */}
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('plantoes')} className={`${activeTab === 'plantoes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Plantões de Viaturas</button>
            <button onClick={() => setActiveTab('escalaMedicos')} className={`${activeTab === 'escalaMedicos' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Escala de Médicos</button>
            <button onClick={() => setActiveTab('escalaAeronaves')} className={`${activeTab === 'escalaAeronaves' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Escala de Aeronaves</button>
            <button onClick={() => setActiveTab('escalaCodec')} className={`${activeTab === 'escalaCodec' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Escala do CODEC</button>
          </nav>
        </div>

        {/* --- CONTEÚDO DAS ABAS (JÁ RESPONSIVO) --- */}
        {activeTab === 'plantoes' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingPlantoes ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {plantoes.map(p => (<tr key={p.id}><td className="px-6 py-4">{formatDate(p.data_plantao)}</td><td className="px-6 py-4">{p.viatura_prefixo}</td><td className="px-6 py-4">{p.obm_abreviatura}</td><td className="px-6 py-4 space-x-4"><button onClick={() => {}} className="text-indigo-600"><Edit size={18}/></button><button onClick={() => handleDeleteClick(p.id, 'plantoes')} className="text-red-600"><Trash2 size={18}/></button></td></tr>))}
                  </tbody>
                </table>
              </div>
            )}
            {plantaoPagination && <Pagination currentPage={plantaoPagination.currentPage} totalPages={plantaoPagination.totalPages} onPageChange={setCurrentPlantaoPage} />}
          </div>
        )}

        {activeTab === 'escalaMedicos' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingEscalaMedicos ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saída</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {escalaMedicos.map(e => (<tr key={e.id}><td className="px-6 py-4">{e.nome_completo}</td><td className="px-6 py-4">{formatDateTime(e.entrada_servico)}</td><td className="px-6 py-4">{formatDateTime(e.saida_servico)}</td><td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.status_servico === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status_servico}</span></td><td className="px-6 py-4"><button onClick={() => handleDeleteClick(e.id, 'escalaMedicos')} className="text-red-600"><Trash2 size={18}/></button></td></tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaAeronaves' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingAeronaves ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aeronave</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">1º Piloto</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">2º Piloto</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {escalaAeronaves.map(e => (<tr key={e.id}><td className="px-6 py-4">{formatDate(e.data)}</td><td className="px-6 py-4">{e.aeronave_prefixo}</td><td className="px-6 py-4">{e.primeiro_piloto}</td><td className="px-6 py-4">{e.segundo_piloto}</td><td className="px-6 py-4">{e.status}</td><td className="px-6 py-4"><button onClick={() => handleDeleteClick(e.id, 'escalaAeronaves')} className="text-red-600"><Trash2 size={18}/></button></td></tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escalaCodec' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingCodec ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turno</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plantonista</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {escalaCodec.map(e => (<tr key={e.id}><td className="px-6 py-4">{formatDate(e.data)}</td><td className="px-6 py-4">{e.turno}</td><td className="px-6 py-4">Plantonista {e.ordem_plantonista}</td><td className="px-6 py-4">{e.nome_plantonista}</td><td className="px-6 py-4"><button onClick={() => handleDeleteClick(e.id, 'escalaCodec')} className="text-red-600"><Trash2 size={18}/></button></td></tr>))}
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
