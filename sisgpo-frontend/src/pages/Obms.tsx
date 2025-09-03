// Arquivo: frontend/src/pages/Obms.tsx (Refatorado com o hook useCrud)

import React from 'react';
import { useCrud } from '../hooks/useCrud'; // 1. Importar o hook
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ObmForm from '../components/forms/ObmForm';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces
interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  telefone: string | null;
}

export default function Obms() {
  // 2. Utilizar o hook para gerenciar todo o estado e lógica
  const {
    data: obms,
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
  } = useCrud<Obm>({ entityName: 'obms', initialFilters: { nome: '' } });

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
        <Input
          type="text"
          placeholder="Filtrar por nome..."
          value={filters.nome || ''}
          onChange={(e) => handleFilterChange('nome', e.target.value)}
          className="max-w-xs"
        />
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abreviatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
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
      
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}>
        <ObmForm 
          obmToEdit={itemToEdit} 
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
        message="Tem certeza que deseja excluir esta OBM? Esta ação não pode ser desfeita." 
        isLoading={isDeleting}
      />
    </div>
  );
}
