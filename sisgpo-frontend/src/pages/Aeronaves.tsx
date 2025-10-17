import React from 'react';
import { useCrud } from '../hooks/useCrud'; // CORREÇÃO: Importação nomeada
import { Aeronave } from '../types/entities';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import AeronaveForm from '../components/forms/AeronaveForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Spinner from '../components/ui/Spinner';

const Aeronaves: React.FC = () => {
  const {
    data: aeronaves,
    isLoading,
    isSaving,
    isDeleting,
    itemToEdit,
    isFormModalOpen,
    isConfirmModalOpen,
    handleOpenFormModal,
    handleCloseFormModal,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleSave,
    handleConfirmDelete,
  } = useCrud<Aeronave>({
    entityName: 'Aeronave', // Nome da entidade para as mensagens
    endpoint: '/api/admin/viaturas/aeronaves', // Endpoint customizado
  });

  const handleSubmit = async (data: Partial<Aeronave>) => {
    // A função handleSave já tem a lógica de criar ou editar
    await handleSave({ ...itemToEdit, ...data });
  };

  if (isLoading && !aeronaves.length) return <Spinner />;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gerenciar Aeronaves</h1>
      <Button onClick={() => handleOpenFormModal()}>Adicionar Aeronave</Button>

      {aeronaves.length > 0 ? (
        <table className="min-w-full bg-white mt-4">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b">Prefixo</th>
              <th className="py-2 px-4 border-b">Tipo de Asa</th>
              <th className="py-2 px-4 border-b">Ações</th>
            </tr>
          </thead>
          <tbody>
            {aeronaves.map((aeronave: Aeronave) => ( // CORREÇÃO: Adicionado o tipo Aeronave
              <tr key={aeronave.id}>
                <td className="border px-4 py-2">{aeronave.prefixo}</td>
                <td className="border px-4 py-2">{aeronave.tipo_asa}</td>
                <td className="border px-4 py-2">
                  <Button onClick={() => handleOpenFormModal(aeronave)} className="mr-2">
                    Editar
                  </Button>
                  <Button onClick={() => handleDeleteClick(aeronave.id)} variant="danger">
                    Excluir
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="mt-4">Nenhuma aeronave cadastrada até o momento.</p>
      )}

      {isFormModalOpen && (
        <Modal
          isOpen={isFormModalOpen}
          onClose={handleCloseFormModal}
          title={itemToEdit ? 'Editar Aeronave' : 'Adicionar Aeronave'}
        >
          <AeronaveForm
            onSubmit={handleSubmit}
            initialData={itemToEdit as Aeronave}
            isSubmitting={isSaving}
          />
        </Modal>
      )}

      {isConfirmModalOpen && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={handleCloseConfirmModal}
          onConfirm={handleConfirmDelete}
          title="Confirmar Exclusão"
          message="Tem certeza que deseja excluir esta aeronave?"
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default Aeronaves;