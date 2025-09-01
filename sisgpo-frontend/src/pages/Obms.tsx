import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces (sem alteração)
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  telefone: string | null;
}
interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; perPage: number; }
interface ApiResponse { data: Obm[]; pagination: PaginationState; }
interface ValidationError { field: string; message: string; }

export default function Obms() {
  // Lógica de estados (sem alteração)
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroNome, setFiltroNome] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [obmToEdit, setObmToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [obmToDeleteId, setObmToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // Funções de busca e modais (sem alteração)
  const fetchObms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '10', nome: filtroNome });
      const response = await api.get<ApiResponse>(`/api/admin/obms?${params.toString()}`);
      setObms(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar as OBMs.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroNome]);

  useEffect(() => { fetchObms(); }, [fetchObms]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFiltroNome(e.target.value); setCurrentPage(1); };
  const handleOpenFormModal = (obm: Obm | null = null) => { setObmToEdit(obm); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => { setIsFormModalOpen(false); setObmToEdit(null); setValidationErrors([]); };

  // --- FUNÇÃO handleSaveObm CORRIGIDA ---
  const handleSaveObm = async (obmData: Omit<Obm, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    
    // Desestrutura o objeto para separar o ID do resto dos dados
    const { id, ...dataToSend } = obmData;
    const action = id ? 'atualizada' : 'criada';

    try {
      if (id) {
        // Envia a requisição PUT para o endpoint com o ID, e o corpo SEM o ID
        await api.put(`/api/admin/obms/${id}`, dataToSend);
      } else {
        // Envia a requisição POST para criar, o corpo já não tem o ID
        await api.post('/api/admin/obms', dataToSend);
      }
      toast.success(`OBM ${action} com sucesso!`);
      handleCloseFormModal();
      fetchObms();
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || `Erro ao salvar OBM.`;
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Funções de exclusão (sem alteração)
  const handleDeleteClick = (id: number) => { setObmToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setObmToDeleteId(null); };
  const handleConfirmDelete = async () => {
    if (!obmToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/obms/${obmToDeleteId}`);
      toast.success('OBM excluída com sucesso!');
      if (obms.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchObms();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir OBM.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  // JSX (sem alteração)
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
          <p className="text-gray-600 mt-2">Gerencie as Organizações Bombeiro Militar.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Nova OBM</Button>
      </div>
      <div className="mb-4">
        <Input type="text" placeholder="Filtrar por nome..." value={filtroNome} onChange={handleFiltroChange} className="max-w-xs" />
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abreviatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefone</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : obms.length > 0 ? (
              obms.map((obm) => (
                <tr key={obm.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obm.nome}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.abreviatura}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.cidade || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.telefone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenFormModal(obm)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteClick(obm.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">Nenhuma OBM encontrada.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={obmToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm obmToEdit={obmToEdit} onSave={handleSaveObm} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta OBM? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
