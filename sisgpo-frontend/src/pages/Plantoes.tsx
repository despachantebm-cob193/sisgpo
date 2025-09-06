// Arquivo: frontend/src/pages/Plantoes.tsx (Versão Otimizada com Paginação)

import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PlantaoForm from '../components/forms/PlantaoForm';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Pagination from '../components/ui/Pagination';
import { Edit, Trash2 } from 'lucide-react';

// Interfaces
interface Plantao { id: number; data_plantao: string; viatura_prefixo: string; obm_abreviatura: string; }
interface Viatura { id: number; prefixo: string; obm_id: number; }
interface Militar { id: number; nome_guerra: string; posto_graduacao: string; }
interface PlantaoDetalhado { id: number; data_plantao: string; viatura_id: number; obm_id: number; observacoes: string; guarnicao: { militar_id: number; funcao: string }[]; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState | null; }

export default function Plantoes() {
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ data_inicio: '', data_fim: '' });
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados para modais e ações
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '20',
        ...filters,
      });
      
      // A busca de viaturas e militares continua sendo completa, pois são para preencher selects no formulário.
      const [plantoesRes, viaturasRes, militaresRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/api/admin/viaturas?all=true'),
        api.get<ApiResponse<Militar>>('/api/admin/militares?all=true&ativo=true')
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
  }, [filters, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (field: 'data_inicio' | 'data_fim', value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1);
  };

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
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

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
      toast.error(err.response?.data?.message || 'Erro ao salvar o plantão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/plantoes/${itemToDeleteId}`);
      toast.success('Plantão excluído com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir plantão.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
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
          <Input id="data_inicio" type="date" value={filters.data_inicio} onChange={(e) => handleFilterChange('data_inicio', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={filters.data_fim} onChange={(e) => handleFilterChange('data_fim', e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => { setFilters({ data_inicio: '', data_fim: '' }); setCurrentPage(1); }} className="!w-full bg-gray-600 hover:bg-gray-700">Limpar Filtros</Button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {isLoading ? (
                <tr><td colSpan={4} className="text-center py-10"><Spinner className="h-10 w-10 mx-auto" /></td></tr>
              ) : plantoes.length > 0 ? (
                plantoes.map((plantao) => (
                  <tr key={plantao.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(plantao.data_plantao)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.viatura_prefixo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.obm_abreviatura}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenModal(plantao)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(plantao.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="text-center py-10 text-gray-500">Nenhum plantão encontrado para os filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={plantaoToEdit ? 'Editar Plantão' : 'Lançar Novo Plantão'}>
        <PlantaoForm plantaoToEdit={plantaoToEdit} viaturas={viaturas} militares={militares} onSave={handleSavePlantao} onCancel={handleCloseModal} isLoading={isSaving} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este plantão?" isLoading={isDeleting} />
    </div>
  );
}
