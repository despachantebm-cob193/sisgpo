// Arquivo: frontend/src/pages/Militares.tsx (Com CRUD completo)

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm'; // 1. Importar o formulário
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal'; // 2. Importar modal de confirmação

// Interfaces
interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string;
  posto_graduacao: string;
  ativo: boolean;
  obm_id: number | null;
}
interface Obm { id: number; nome: string; abreviatura: string; }
interface PaginationState { currentPage: number; totalPages: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState; }
interface ValidationError { field: string; message: string; }

export default function Militares() {
  // --- Estados ---
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroNome, setFiltroNome] = useState('');

  // Estados para os modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [militarToEdit, setMilitarToEdit] = useState<Militar | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [militarToDeleteId, setMilitarToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  // --- Funções de busca e paginação ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '10',
        nome_completo: filtroNome,
      });

      const [militaresRes, obmsRes] = await Promise.all([
        api.get<ApiResponse<Militar>>(`/api/admin/militares?${params.toString()}`),
        api.get<ApiResponse<Obm>>('/api/admin/obms?limit=500')
      ]);
      
      setMilitares(militaresRes.data.data);
      setPagination(militaresRes.data.pagination);
      setObms(obmsRes.data.data);

    } catch (err) {
      toast.error('Não foi possível carregar os dados dos militares.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroNome]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFiltroNome(e.target.value); setCurrentPage(1); };

  // --- Funções para controlar os modais ---
  const handleOpenFormModal = (militar: Militar | null = null) => {
    setMilitarToEdit(militar);
    setValidationErrors([]);
    setIsFormModalOpen(true);
  };
  const handleCloseFormModal = () => { setIsFormModalOpen(false); setMilitarToEdit(null); };

  const handleDeleteClick = (id: number) => {
    setMilitarToDeleteId(id);
    setIsConfirmModalOpen(true);
  };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setMilitarToDeleteId(null); };

  // 3. --- Lógica para Salvar (Criar/Atualizar) ---
  const handleSaveMilitar = async (militarData: Omit<Militar, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = militarData.id ? 'atualizado' : 'criado';
    try {
      if (militarData.id) {
        await api.put(`/api/admin/militares/${militarData.id}`, militarData);
      } else {
        await api.post('/api/admin/militares', militarData);
      }
      toast.success(`Militar ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || 'Erro ao salvar militar.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // 4. --- Lógica para Excluir ---
  const handleConfirmDelete = async () => {
    if (!militarToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/militares/${militarToDeleteId}`);
      toast.success('Militar excluído com sucesso!');
      if (militares.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir militar.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Militares</h2>
          <p className="text-gray-600 mt-2">Gerencie o efetivo de militares.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Novo Militar</Button>
      </div>

      <div className="mb-4">
        <Input type="text" placeholder="Filtrar por nome..." value={filtroNome} onChange={handleFiltroChange} className="max-w-xs" />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto/Grad.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome de Guerra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : militares.length > 0 ? (
              militares.map((militar) => (
                <tr key={militar.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{militar.posto_graduacao}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.nome_guerra}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.matricula}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {militar.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteClick(militar.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">Nenhum militar encontrado.</td></tr>
            )}
          </tbody>
        </table>
        
        {pagination && pagination.totalPages > 1 && (
          <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />
        )}
      </div>

      {/* 5. --- Renderização dos Modais --- */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={militarToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm
          militarToEdit={militarToEdit}
          obms={obms}
          onSave={handleSaveMilitar}
          onCancel={handleCloseFormModal}
          isLoading={isSaving}
          errors={validationErrors}
        />
      </Modal>
      <ConfirmationModal 
        isOpen={isConfirmModalOpen} 
        onClose={handleCloseConfirmModal} 
        onConfirm={handleConfirmDelete} 
        title="Confirmar Exclusão" 
        message="Tem certeza que deseja excluir este militar? Esta ação não pode ser desfeita." 
        isLoading={isDeleting}
      />
    </div>
  );
}
