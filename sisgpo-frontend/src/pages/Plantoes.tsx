// Arquivo: frontend/src/pages/Plantoes.tsx

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import PlantaoForm from '../components/forms/PlantaoForm';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces
interface Plantao { id: number; data_plantao: string; viatura_prefixo: string; obm_abreviatura: string; }
interface Viatura { id: number; prefixo: string; obm_id: number; }
interface Militar { id: number; nome_guerra: string; posto_graduacao: string; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState; }
interface PlantaoDetalhado {
  id: number;
  data_plantao: string;
  viatura_id: number;
  obm_id: number;
  observacoes: string;
  guarnicao: { militar_id: number; funcao: string }[];
}

export default function Plantoes() {
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [plantaoToDeleteId, setPlantaoToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '15' });
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const [plantoesRes, viaturasRes, militaresRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/api/admin/viaturas?limit=1000'),
        api.get<ApiResponse<Militar>>('/api/admin/militares?limit=1000&ativo=true')
      ]);

      setPlantoes(plantoesRes.data.data);
      setPagination(plantoesRes.data.pagination);
      setViaturas(viaturasRes.data.data);
      setMilitares(militaresRes.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar os dados da página.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, dataInicio, dataFim]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);

  const handleOpenModal = async (plantao: Plantao | null = null) => {
    if (plantao) {
      try {
        const response = await api.get<PlantaoDetalhado>(`/api/admin/plantoes/${plantao.id}`);
        setPlantaoToEdit(response.data);
      } catch (error) {
        toast.error("Não foi possível carregar os detalhes do plantão.");
        return;
      }
    } else {
      setPlantaoToEdit(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setPlantaoToEdit(null); };

  const handleSavePlantao = async (data: any) => {
    setIsSaving(true);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) {
        await api.put(`/api/admin/plantoes/${data.id}`, data);
      } else {
        await api.post('/api/admin/plantoes', data);
      }
      toast.success(`Plantão ${action} com sucesso!`);
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao salvar o plantão.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => {
    setPlantaoToDeleteId(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!plantaoToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/plantoes/${plantaoToDeleteId}`);
      toast.success('Plantão excluído com sucesso!');
      if (plantoes.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir plantão.');
    } finally {
      setIsDeleting(false);
      setIsConfirmModalOpen(false);
      setPlantaoToDeleteId(null);
    }
  };

  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Escala de Plantão</h2>
          <p className="text-gray-600 mt-2">Gerencie as escalas diárias de serviço.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Lançar Novo Plantão</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input id="data_inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => { setDataInicio(''); setDataFim(''); setCurrentPage(1); }} className="!w-full bg-gray-600 hover:bg-gray-700">Limpar Filtros</Button>
        </div>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : plantoes.length > 0 ? (
              plantoes.map((plantao) => (
                <tr key={plantao.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(plantao.data_plantao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.viatura_prefixo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.obm_abreviatura}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => handleOpenModal(plantao)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteClick(plantao.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-4">Nenhum plantão encontrado.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={plantaoToEdit ? 'Editar Plantão' : 'Lançar Novo Plantão'}>
        <PlantaoForm plantaoToEdit={plantaoToEdit} viaturas={viaturas} militares={militares} onSave={handleSavePlantao} onCancel={handleCloseModal} isLoading={isSaving} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este plantão? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
