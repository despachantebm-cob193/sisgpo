import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Pagination from '../components/ui/Pagination'; // 1. Importe o componente de Paginação
import Input from '../components/ui/Input'; // Importe o Input para o filtro

// ... (interfaces Obm e ApiResponse permanecem as mesmas) ...
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  ativo: boolean;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  perPage: number;
}

interface ApiResponse {
  data: Obm[];
  pagination: PaginationState;
}

export default function Obms() {
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 2. Estados para paginação e filtros
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroNome, setFiltroNome] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obmToEdit, setObmToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 3. Função de busca de dados com useCallback para otimização
  const fetchObms = useCallback(async () => {
    setIsLoading(true);
    try {
      // Adiciona os parâmetros de paginação e filtro à URL
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10', // Define um limite de 10 itens por página
        nome: filtroNome,
      });

      const response = await api.get<ApiResponse>(`/obms?${params.toString()}`);
      setObms(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      setError('Não foi possível carregar as OBMs.');
      toast.error('Não foi possível carregar as OBMs.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroNome]); // A função será recriada se a página ou o filtro mudarem

  useEffect(() => {
    fetchObms();
  }, [fetchObms]); // O useEffect agora depende da função memoizada

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroNome(e.target.value);
    setCurrentPage(1); // Reseta para a primeira página ao filtrar
  };

  // ... (funções de modal e save/delete permanecem as mesmas) ...
  const handleOpenModal = (obm: Obm | null = null) => {
    setObmToEdit(obm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setObmToEdit(null);
  };

  const handleSaveObm = async (obmData: Omit<Obm, 'id'> & { id?: number }) => {
    setIsSaving(true);
    const action = obmData.id ? 'atualizada' : 'criada';
    try {
      if (obmData.id) {
        await api.put(`/obms/${obmData.id}`, obmData);
      } else {
        await api.post('/obms', obmData);
      }
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseModal();
      fetchObms();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || `Erro ao salvar OBM.`;
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteObm = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta OBM?')) {
      try {
        await api.delete(`/obms/${id}`);
        toast.success('OBM excluída com sucesso!');
        // Se o item excluído for o último da página, volta para a página anterior
        if (obms.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        } else {
          fetchObms();
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Erro ao excluir OBM.';
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
          <p className="text-gray-600 mt-2">Gerencie as Organizações Bombeiro Militar.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Adicionar Nova OBM</Button>
      </div>

      {/* 4. Adicionar a barra de filtro */}
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrar por nome..."
          value={filtroNome}
          onChange={handleFiltroChange}
          className="max-w-xs"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... (thead da tabela permanece o mesmo) ... */}
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abreviatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-4">Carregando...</td></tr>
            ) : obms.length > 0 ? (
              obms.map((obm) => (
                <tr key={obm.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obm.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.abreviatura}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.cidade || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${obm.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {obm.ativo ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenModal(obm)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteObm(obm.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">Nenhuma OBM encontrada.</td></tr>
            )}
          </tbody>
        </table>
        
        {/* 5. Adicionar o componente de Paginação */}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        )}
      </div>

      {/* ... (Modal permanece o mesmo) ... */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={obmToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}
      >
        <ObmForm
          obmToEdit={obmToEdit}
          onSave={handleSaveObm}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
