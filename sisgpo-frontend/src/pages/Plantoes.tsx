// Arquivo: frontend/src/pages/Plantoes.tsx (CORRIGIDO)

import React, { useEffect, useState, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import api from '@/services/api';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PlantaoForm from '@/components/forms/PlantaoForm';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label';
import Spinner from '@/components/ui/Spinner';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Pagination from '@/components/ui/Pagination';
import { Edit, Trash2, CalendarPlus } from 'lucide-react';
import EscalaMedicoForm from '@/components/forms/EscalaMedicoForm'; // <-- CORREÇÃO 1: Caminho ajustado

// --- Interfaces ---
export interface Plantao { id: number; data_plantao: string; viatura_prefixo: string; obm_abreviatura: string; }
export interface Viatura { id: number; prefixo: string; obm_id: number; }
export interface PlantaoDetalhado { id: number; data_plantao: string; viatura_id: number; obm_id: number; observacoes: string; guarnicao: { militar_id: number; funcao: string; nome_guerra: string; posto_graduacao: string; telefone: string | null; }[]; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

// Nova interface para a escala de médicos
interface EscalaMedico {
  id: number;
  civil_id: number;
  nome_completo: string;
  funcao: string;
  entrada_servico: string;
  saida_servico: string;
  status_servico: string;
  observacoes: string | null;
}

export default function Plantoes() {
  const [activeTab, setActiveTab] = useState<'plantoes' | 'escalaMedicos'>('plantoes');
  
  // Estados para Plantões
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoadingPlantoes, setIsLoadingPlantoes] = useState(true);
  const [plantaoFilters, setPlantaoFilters] = useState({ data_inicio: '', data_fim: '' });
  const [plantaoPagination, setPlantaoPagination] = useState<PaginationState | null>(null);
  const [currentPlantaoPage, setCurrentPlantaoPage] = useState(1);
  const [isPlantaoModalOpen, setIsPlantaoModalOpen] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);
  const [isSavingPlantao, setIsSavingPlantao] = useState(false);
  const [plantaoToDeleteId, setPlantaoToDeleteId] = useState<number | null>(null);

  // Estados para Escala de Médicos
  const [escalaMedicos, setEscalaMedicos] = useState<EscalaMedico[]>([]);
  const [isLoadingEscala, setIsLoadingEscala] = useState(true);
  const [isEscalaModalOpen, setIsEscalaModalOpen] = useState(false);
  const [escalaToDeleteId, setEscalaToDeleteId] = useState<number | null>(null);
  const [isSavingEscala, setIsSavingEscala] = useState(false);

  // --- CORREÇÃO 2: Estados de confirmação de exclusão declarados ---
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // --- Fim da Correção 2 ---

  // --- Lógica de Busca de Dados ---
  const fetchPlantoes = useCallback(async () => {
    setIsLoadingPlantoes(true);
    try {
      const params = new URLSearchParams({ page: String(currentPlantaoPage), limit: '15', ...plantaoFilters });
      const [plantoesRes, viaturasRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/api/admin/viaturas?all=true'),
      ]);
      setPlantoes(plantoesRes.data.data);
      setPlantaoPagination(plantoesRes.data.pagination);
      setViaturas(viaturasRes.data.data);
    } catch (err) { toast.error('Não foi possível carregar os plantões.'); }
    finally { setIsLoadingPlantoes(false); }
  }, [plantaoFilters, currentPlantaoPage]);

  const fetchEscalaMedicos = useCallback(async () => {
    setIsLoadingEscala(true);
    try {
      const params = new URLSearchParams(plantaoFilters);
      const response = await api.get<EscalaMedico[]>(`/api/admin/escala-medicos?${params.toString()}`);
      setEscalaMedicos(response.data);
    } catch (err) { toast.error('Não foi possível carregar a escala de médicos.'); }
    finally { setIsLoadingEscala(false); }
  }, [plantaoFilters]);

  useEffect(() => {
    if (activeTab === 'plantoes') {
      fetchPlantoes();
    } else {
      fetchEscalaMedicos();
    }
  }, [activeTab, fetchPlantoes, fetchEscalaMedicos]);

  // --- Handlers de Plantões ---
  const handleOpenPlantaoModal = async (plantao: Plantao | null = null) => {
    if (plantao) {
      const response = await api.get<PlantaoDetalhado>(`/api/admin/plantoes/${plantao.id}`);
      setPlantaoToEdit(response.data);
    } else {
      setPlantaoToEdit(null);
    }
    setIsPlantaoModalOpen(true);
  };
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
  const handleDeletePlantao = (id: number) => {
    setPlantaoToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  // --- Handlers de Escala de Médicos ---
  const handleSaveEscala = async (data: any) => {
    setIsSavingEscala(true);
    try {
      await api.post('/api/admin/escala-medicos', data);
      toast.success('Registro de escala adicionado com sucesso!');
      setIsEscalaModalOpen(false);
      fetchEscalaMedicos();
    } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao salvar escala.'); }
    finally { setIsSavingEscala(false); }
  };
  const handleDeleteEscala = (id: number) => {
    setEscalaToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  // --- Handler de Exclusão Genérico ---
  const handleConfirmDelete = async () => {
    const id = plantaoToDeleteId || escalaToDeleteId;
    const url = plantaoToDeleteId ? `/api/admin/plantoes/${id}` : `/api/admin/escala-medicos/${id}`;
    const successMsg = plantaoToDeleteId ? 'Plantão excluído!' : 'Registro de escala excluído!';
    const errorMsg = plantaoToDeleteId ? 'Erro ao excluir plantão.' : 'Erro ao excluir registro de escala.';

    if (!id) return;
    setIsDeleting(true);
    try {
      await api.delete(url);
      toast.success(successMsg);
      if (plantaoToDeleteId) fetchPlantoes();
      if (escalaToDeleteId) fetchEscalaMedicos();
    } catch (err: any) { toast.error(err.response?.data?.message || errorMsg); }
    finally {
      setIsDeleting(false);
      setPlantaoToDeleteId(null);
      setEscalaToDeleteId(null);
      setIsConfirmModalOpen(false);
    }
  };

  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const formatDateTime = (isoString: string) => new Date(isoString).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Gerenciamento de Escalas</h2>
          <p className="text-gray-600 mt-2">Gerencie as escalas de viaturas e médicos.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenPlantaoModal()}><CalendarPlus className="w-4 h-4 mr-2" />Lançar Novo Plantão</Button>
          <Button onClick={() => setIsEscalaModalOpen(true)} className="bg-teal-600 hover:bg-teal-700"><CalendarPlus className="w-4 h-4 mr-2" />Adicionar Registro na Escala</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input id="data_inicio" type="date" value={plantaoFilters.data_inicio} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlantaoFilters(prev => ({...prev, data_inicio: e.target.value}))} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={plantaoFilters.data_fim} onChange={(e: ChangeEvent<HTMLInputElement>) => setPlantaoFilters(prev => ({...prev, data_fim: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setPlantaoFilters({ data_inicio: '', data_fim: '' })} className="!w-full bg-gray-600 hover:bg-gray-700">Limpar Filtros</Button>
        </div>
      </div>

      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            <button onClick={() => setActiveTab('plantoes')} className={`${activeTab === 'plantoes' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Plantões de Viaturas</button>
            <button onClick={() => setActiveTab('escalaMedicos')} className={`${activeTab === 'escalaMedicos' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Escala de Médicos</button>
          </nav>
        </div>

        {activeTab === 'plantoes' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingPlantoes ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {plantoes.map(p => (<tr key={p.id}>
                      <td className="px-6 py-4">{formatDate(p.data_plantao)}</td>
                      <td className="px-6 py-4">{p.viatura_prefixo}</td>
                      <td className="px-6 py-4">{p.obm_abreviatura}</td>
                      <td className="px-6 py-4 space-x-4"><button onClick={() => handleOpenPlantaoModal(p)} className="text-indigo-600"><Edit size={18}/></button><button onClick={() => handleDeletePlantao(p.id)} className="text-red-600"><Trash2 size={18}/></button></td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            )}
            {plantaoPagination && <Pagination currentPage={plantaoPagination.currentPage} totalPages={plantaoPagination.totalPages} onPageChange={setCurrentPlantaoPage} />}
          </div>
        )}

        {activeTab === 'escalaMedicos' && (
          <div className="bg-white shadow-md rounded-b-lg overflow-hidden">
            {isLoadingEscala ? <div className="text-center py-10"><Spinner /></div> : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entrada</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saída</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th></tr></thead>
                  <tbody className="divide-y divide-gray-200">
                    {escalaMedicos.map(e => (<tr key={e.id}>
                      <td className="px-6 py-4">{e.nome_completo}</td>
                      <td className="px-6 py-4">{formatDateTime(e.entrada_servico)}</td>
                      <td className="px-6 py-4">{formatDateTime(e.saida_servico)}</td>
                      <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${e.status_servico === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{e.status_servico}</span></td>
                      <td className="px-6 py-4"><button onClick={() => handleDeleteEscala(e.id)} className="text-red-600"><Trash2 size={18}/></button></td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={isPlantaoModalOpen} onClose={() => setIsPlantaoModalOpen(false)} title={plantaoToEdit ? 'Editar Plantão' : 'Lançar Novo Plantão'}>
        <PlantaoForm plantaoToEdit={plantaoToEdit} viaturas={viaturas} onSave={handleSavePlantao} onCancel={() => setIsPlantaoModalOpen(false)} isLoading={isSavingPlantao} />
      </Modal>
      <Modal isOpen={isEscalaModalOpen} onClose={() => setIsEscalaModalOpen(false)} title="Adicionar Registro na Escala de Médicos">
        <EscalaMedicoForm onSave={handleSaveEscala} onCancel={() => setIsEscalaModalOpen(false)} isLoading={isSavingEscala} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este registro?" isLoading={isDeleting} />
    </div>
  );
}
