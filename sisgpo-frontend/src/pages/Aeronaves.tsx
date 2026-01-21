import React, { useEffect } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { Aeronave } from '../types/entities';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import AeronaveForm from '../components/forms/AeronaveForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Spinner from '../components/ui/Spinner';
import Card from '../components/ui/Card';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const Aeronaves: React.FC = () => {
  const { setPageTitle } = useUiStore();
  const user = useAuthStore(state => state.user);
  const isAdmin = user?.perfil === 'admin';

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

  const renderStatusBadge = (ativa: boolean, className = '') => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ativa ? 'bg-cardGreen/20 text-cardGreen' : 'bg-searchbar text-textSecondary'
        } ${className}`}
    >
      {ativa ? 'Ativa' : 'Inativa'}
    </span>
  );

  const renderTipoAsaBadge = (tipo: Aeronave['tipo_asa'], className = '') => (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipo === 'fixa' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
        } ${className}`}
    >
      {tipo === 'fixa' ? 'Asa fixa' : 'Asa rotativa'}
    </span>
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-textMain">Aeronaves</h1>
          <p className="text-textSecondary mt-1">
            Cadastre e mantenha a frota aerea atualizada para garantir o planejamento operacional.
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenFormModal()} variant="primary" className="w-full md:w-auto gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Aeronave
          </Button>
        )}
      </div>

      <Card title="Lista de Aeronaves" titleClassName="text-lg font-semibold text-textMain">
        {isLoading && !hasAeronaves ? (
          <div className="flex justify-center items-center h-48">
            <Spinner />
          </div>
        ) : hasAeronaves ? (
          <>
            <div className="hidden md:block overflow-x-auto">
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
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                        Ações
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-cardSlate divide-y divide-borderDark/60">
                  {aeronaves.map((aeronave) => (
                    <tr key={aeronave.id} className="hover:bg-searchbar transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-textMain">
                        {aeronave.prefixo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {renderTipoAsaBadge(aeronave.tipo_asa)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{renderStatusBadge(aeronave.ativa)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isAdmin && (
                          <div className="flex justify-center md:justify-end items-center space-x-3">
                            <button
                              onClick={() => handleOpenFormModal(aeronave)}
                              className="text-tagBlue hover:text-tagBlue/80 transition-colors"
                              title="Editar aeronave"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(aeronave.id)}
                              className="text-spamRed hover:text-red-700 transition-colors"
                              title="Excluir aeronave"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-4 md:hidden">
              {aeronaves.map((aeronave) => (
                <div
                  key={aeronave.id}
                  className="rounded-lg border border-borderDark/60 bg-cardSlate p-4 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs uppercase text-textSecondary tracking-wide">Prefixo</p>
                      <p className="text-xl font-semibold text-textMain">{aeronave.prefixo}</p>
                    </div>
                    {renderStatusBadge(aeronave.ativa)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-textSecondary">Tipo de Asa</span>
                    {renderTipoAsaBadge(aeronave.tipo_asa)}
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end gap-4 pt-2">
                      <button
                        onClick={() => handleOpenFormModal(aeronave)}
                        className="flex items-center gap-1 text-xs font-medium text-tagBlue hover:text-tagBlue/80"
                        title="Editar aeronave"
                      >
                        <Edit2 className="w-4 h-4" />
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(aeronave.id)}
                        className="flex items-center gap-1 text-xs font-medium text-spamRed hover:text-red-600"
                        title="Excluir aeronave"
                      >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-textSecondary">
            <p className="text-sm">
              Nenhuma aeronave cadastrada ate o momento. Clique em{' '}
              <span className="font-semibold text-tagBlue">“Adicionar Aeronave”</span> para registrar a primeira
              entrada.
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
            onCancel={handleCloseFormModal}
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
