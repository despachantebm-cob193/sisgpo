import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import PlantaoForm from '../components/forms/PlantaoForm';
import Input from '../components/ui/Input'; // Importar o Input para os filtros

// ... (Interfaces permanecem as mesmas) ...
interface Plantao {
  id: number;
  data_plantao: string;
  observacoes: string;
  viatura_prefixo: string;
  obm_abreviatura: string;
}

interface Viatura {
  id: number;
  prefixo: string;
  obm_id: number;
}

interface Militar {
  id: number;
  nome_guerra: string;
  posto_graduacao: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState;
}

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

  // 1. Adicionar estados para os filtros de data
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
      });
      // Adiciona os filtros à query se eles estiverem preenchidos
      if (dataInicio) params.append('data_inicio', dataInicio);
      if (dataFim) params.append('data_fim', dataFim);
      
      const [plantoesRes, viaturasRes, militaresRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/viaturas?limit=500'),
        api.get<ApiResponse<Militar>>('/militares?limit=1000')
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
  }, [currentPage, dataInicio, dataFim]); // 2. Adicionar filtros como dependências

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // ... (handleOpenModal, handleCloseModal, handleSavePlantao, handleDeletePlantao, formatDate permanecem os mesmos) ...
  const handleOpenModal = async (plantao: Plantao | null = null) => {
    if (plantao) {
      try {
        const response = await api.get<PlantaoDetalhado>(`/plantoes/${plantao.id}`);
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPlantaoToEdit(null);
  };

  const handleSavePlantao = async (data: any) => {
    setIsSaving(true);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) {
        await api.put(`/plantoes/${data.id}`, data);
      } else {
        await api.post('/plantoes', data);
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

  const handleDeletePlantao = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plantão?')) {
      try {
        await api.delete(`/plantoes/${id}`);
        toast.success('Plantão excluído com sucesso!');
        if (plantoes.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchData();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || 'Erro ao excluir plantão.');
      }
    }
  };

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Escala de Plantão</h2>
          <p className="text-gray-600 mt-2">Gerencie as escalas diárias de serviço.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Lançar Novo Plantão
        </Button>
      </div>

      {/* 3. Adicionar os campos de filtro de data */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div className="col-span-1">
          <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">Data Início</label>
          <Input
            id="data_inicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>
        <div className="col-span-1">
          <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700">Data Fim</label>
          <Input
            id="data_fim"
            type="date"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
        <div className="col-span-1 flex items-end">
          <Button onClick={() => { setDataInicio(''); setDataFim(''); setCurrentPage(1); }} className="!w-full bg-gray-600 hover:bg-gray-700">
            Limpar Filtros
          </Button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* ... (o restante do JSX permanece o mesmo) ... */}
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-4">Carregando...</td></tr>
            ) : plantoes.length > 0 ? (
              plantoes.map((plantao) => (
                <tr key={plantao.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(plantao.data_plantao)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.viatura_prefixo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.obm_abreviatura}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(plantao)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeletePlantao(plantao.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={4} className="text-center py-4">Nenhum plantão encontrado para os filtros aplicados.</td></tr>
            )}
          </tbody>
        </table>
        
        {pagination && pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={plantaoToEdit ? 'Editar Plantão' : 'Lançar Novo Plantão'}
      >
        <PlantaoForm
          plantaoToEdit={plantaoToEdit}
          viaturas={viaturas}
          militares={militares}
          onSave={handleSavePlantao}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
