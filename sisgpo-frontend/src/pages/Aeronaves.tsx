import React, { useEffect, useState } from 'react';
import { Edit2, Plus, Trash2, Plane } from 'lucide-react';
import { useCrud } from '../hooks/useCrud';
import { Aeronave } from '../types/entities';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import AeronaveForm from '../components/forms/AeronaveForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import Spinner from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';
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

  // Calculate stats
  const totalAeronaves = aeronaves.length;
  const ativas = aeronaves.filter(a => a.ativa).length;

  const renderStatusBadge = (ativa: boolean) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ativa
      ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40'
      : 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-500/40'
      }`}>
      {ativa ? 'Ativa' : 'Inativa'}
    </span>
  );

  const renderTipoAsaBadge = (tipo: Aeronave['tipo_asa']) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${tipo === 'fixa'
      ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
      : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
      }`}>
      <Plane size={12} className={tipo === 'rotativa' ? 'animate-pulse' : ''} />
      {tipo === 'fixa' ? 'Asa Fixa' : 'Asa Rotativa'}
    </span>
  );

  return (
    <div className="space-y-6">

      {/* Top Stats & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex gap-4 w-full md:w-auto">
          <div className="w-full md:w-48">
            <StatCard title="Total" value={isLoading ? '' : totalAeronaves} isLoading={isLoading} variant="transparent" />
          </div>
          <div className="w-full md:w-48">
            <StatCard title="Operacionais" value={isLoading ? '' : ativas} isLoading={isLoading} variant="transparent" />
          </div>
        </div>

        {isAdmin && (
          <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto !bg-cyan-500/10 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/20 hover:!shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold h-full min-h-[50px]">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Aeronave
          </Button>
        )}
      </div>

      <div className="bg-[#0a0d14]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
        {/* Decorative Top Line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

        {isLoading && !hasAeronaves ? (
          <div className="flex justify-center items-center py-20">
            <Spinner className="w-10 h-10 text-cyan-500" />
          </div>
        ) : hasAeronaves ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="min-w-full divide-y divide-white/5">
                <thead className="bg-white/5 decoration-clone">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Prefixo</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Tipo de Asa</th>
                    <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Status</th>
                    {isAdmin && <th className="px-6 py-4 text-right text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {aeronaves.map((aeronave) => (
                    <tr key={aeronave.id} className="group hover:bg-white/5 transition-colors text-sm">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-white font-mono">{aeronave.prefixo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{renderTipoAsaBadge(aeronave.tipo_asa)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{renderStatusBadge(aeronave.ativa)}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenFormModal(aeronave)} className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteClick(aeronave.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all" title="Excluir">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden p-4 space-y-4">
              {aeronaves.map((aeronave) => (
                <div key={aeronave.id} className="bg-[#0e121b] border border-white/10 p-4 rounded-xl shadow-lg relative overflow-hidden">
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                      <h3 className="text-white font-bold font-mono text-lg">{aeronave.prefixo}</h3>
                      <div className="mt-2 flex gap-2">
                        {renderTipoAsaBadge(aeronave.tipo_asa)}
                        {renderStatusBadge(aeronave.ativa)}
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenFormModal(aeronave)} className="p-2 text-sky-500 bg-sky-500/10 rounded-lg"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteClick(aeronave.id)} className="p-2 text-rose-500 bg-rose-500/10 rounded-lg"><Trash2 size={16} /></button>
                      </div>
                    )}
                  </div>
                  {/* Background Icon Opacity */}
                  <Plane className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 z-0" strokeWidth={1} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
            <Plane className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm font-mono uppercase tracking-widest">Nenhuma aeronave cadastrada</p>
          </div>
        )}
      </div>

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
