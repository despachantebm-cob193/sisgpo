// Arquivo: frontend/src/pages/Militares.tsx (Refatorado com o hook useCrud)

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useCrud } from '../hooks/useCrud'; // 1. Importar o hook

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

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
interface ApiResponseObm { data: Obm[]; } // Interface específica para a resposta de OBMs

export default function Militares() {
  // 2. Utilizar o hook para gerenciar o CRUD de Militares
  const {
    data: militares,
    isLoading,
    pagination,
    filters,
    isFormModalOpen,
    itemToEdit,
    isSaving,
    isConfirmModalOpen,
    isDeleting,
    handleFilterChange,
    handlePageChange,
    handleOpenFormModal,
    handleCloseFormModal,
    handleSave,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleConfirmDelete,
    validationErrors,
  } = useCrud<Militar>({
    entityName: 'militares',
    initialFilters: { nome_completo: '' },
  });

  // 3. Manter a busca de OBMs, que é específica desta página
  const [obms, setObms] = useState<Obm[]>([]);
  const fetchObms = useCallback(async () => {
    try {
      // Usamos uma interface específica para a resposta de OBMs
      const response = await api.get<ApiResponseObm>('/api/admin/obms?limit=500');
      setObms(response.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar a lista de OBMs.');
    }
  }, []);

  useEffect(() => {
    fetchObms();
  }, [fetchObms]);

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
        <Input
          type="text"
          placeholder="Filtrar por nome..."
          value={filters.nome_completo || ''}
          onChange={(e) => handleFilterChange('nome_completo', e.target.value)}
          className="max-w-xs"
        />
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

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm
          militarToEdit={itemToEdit}
          obms={obms}
          onSave={handleSave}
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
