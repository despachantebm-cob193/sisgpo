import React, { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { Aeronave } from '../types/entities';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import AeronaveForm from '../components/forms/AeronaveForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useUiStore } from '@/store/uiStore';

const Aeronaves: React.FC = () => {
  const { setPageTitle } = useUiStore();

  useEffect(() => {
    setPageTitle('Gerenciar Aeronaves');
  }, [setPageTitle]);

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
    entityName: 'Aeronave',
    endpoint: '/api/admin/aeronaves',
  });

  const handleSubmit = async (data: Partial<Aeronave>) => {
    await handleSave({ ...itemToEdit, ...data });
  };

  const hasAeronaves = aeronaves.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain">Aeronaves</h1>
          <p className="text-textSecondary mt-1">
            Cadastre e mantenha a frota aérea atualizada para garantir o planejamento operacional.
          </p>
        </div>
        <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Aeronave
        </Button>
      </div>

      <Card title="Lista de Aeronaves" titleClassName="text-lg font-semibold text-textMain">
        {isLoading && !hasAeronaves ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : hasAeronaves ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-borderDark/60">
              <thead className="bg-searchbar">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                    Prefixo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                    Tipo de Asa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-cardSlate divide-y divide-borderDark/60">
                {aeronaves.map((aeronave) => (
                  <tr key={aeronave.id} className="hover:bg-searchbar transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textMain">
                      {aeronave.prefixo}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          aeronave.tipo_asa === 'fixa'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {aeronave.tipo_asa === 'fixa' ? 'Asa fixa' : 'Asa rotativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          aeronave.ativa
                            ? 'bg-cardGreen/20 text-cardGreen'
                            : 'bg-searchbar text-textSecondary'
                        }`}
                      >
                        {aeronave.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex justify-center md:justify-end items-center space-x-3">
                        <button
                          onClick={() => handleOpenFormModal(aeronave)}
                          className="text-tagBlue hover:text-tagBlue/80 transition-colors"
                          title="Editar aeronave"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                            <path
                              d="M21 7.5L16.5 3L3 16.5V21H7.5L21 7.5Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M15 4.5L19.5 9"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(aeronave.id)}
                          className="text-spamRed hover:text-red-700 transition-colors"
                          title="Excluir aeronave"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                            <path
                              d="M6 7.5H18M9 3H15M10.5 11.25V16.5M13.5 11.25V16.5M5.25 7.5L6.15011 18.3995C6.23657 19.4202 7.07804 20.25 8.10208 20.25H15.8979C16.922 20.25 17.7634 19.4202 17.8499 18.3995L18.75 7.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-textSecondary">
            <p className="text-sm">
              Nenhuma aeronave cadastrada até o momento. Clique em{' '}
              <span className="font-semibold text-tagBlue">“Adicionar Aeronave”</span>{' '}
              para registrar a primeira entrada.
            </p>
          </div>
        )}
      </Card>

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

