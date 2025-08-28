import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import Pagination from '../components/ui/Pagination'; // Importe o componente
import Input from '../components/ui/Input'; // Importe o Input

// Interfaces (a de PaginationState foi adicionada)
interface Viatura {
  id: number;
  prefixo: string;
  placa: string;
  modelo: string | null;
  ano: number | null;
  tipo: string;
  ativa: boolean;
  obm_id: number | null;
}

interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: PaginationState;
}

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para paginação e filtros
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroPrefixo, setFiltroPrefixo] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viaturaToEdit, setViaturaToEdit] = useState<Viatura | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Função de busca de dados atualizada
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        prefixo: filtroPrefixo,
      });

      // Busca viaturas e OBMs em paralelo
      const [viaturasRes, obmsRes] = await Promise.all([
        api.get<ApiResponse<Viatura>>(`/viaturas?${params.toString()}`),
        api.get<ApiResponse<Obm>>('/obms?limit=500')
      ]);
      
      setViaturas(viaturasRes.data.data);
      setPagination(viaturasRes.data.pagination);
      setObms(obmsRes.data.data);

    } catch (err) {
      setError('Não foi possível carregar os dados.');
      toast.error('Não foi possível carregar os dados das viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroPrefixo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroPrefixo(e.target.value);
    setCurrentPage(1);
  };

  // ... (funções de modal, save e delete permanecem as mesmas, com a lógica de paginação na exclusão) ...
  const handleOpenModal = (viatura: Viatura | null = null) => {
    setViaturaToEdit(viatura);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setViaturaToEdit(null);
  };

  const handleSaveViatura = async (viaturaData: Omit<Viatura, 'id'> & { id?: number }) => {
    setIsSaving(true);
    const action = viaturaData.id ? 'atualizada' : 'criada';
    try {
      if (viaturaData.id) {
        await api.put(`/viaturas/${viaturaData.id}`, viaturaData);
      } else {
        await api.post('/viaturas', viaturaData);
      }
      toast.success(`Viatura ${action} com sucesso!`);
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao salvar viatura.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteViatura = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta viatura?')) {
      try {
        await api.delete(`/viaturas/${id}`);
        toast.success('Viatura excluída com sucesso!');
        if (viaturas.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchData();
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao excluir viatura.';
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Viaturas</h2>
          <p className="text-gray-600 mt-2">Gerencie a frota de viaturas.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Adicionar Nova Viatura</Button>
      </div>

      {/* Barra de filtro */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrar por prefixo..."
          value={filtroPrefixo}
          onChange={handleFiltroChange}
          className="max-w-xs"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.placa}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.tipo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viatura.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(viatura)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteViatura(viatura.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">Nenhuma viatura encontrada.</td></tr>
            )}
          </tbody>
        </table>
        
        {/* Componente de Paginação */}
        {pagination && (
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
        title={viaturaToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}
      >
        <ViaturaForm
          viaturaToEdit={viaturaToEdit}
          obms={obms}
          onSave={handleSaveViatura}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
