// frontend/src/pages/Militares.tsx (Otimizado com Cartões Responsivos)

import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useVirtualizer } from '@tanstack/react-virtual';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Edit, Trash2, User, Shield, Hash, Building } from 'lucide-react'; // Ícones adicionais

// Interfaces (permanecem as mesmas)
interface Militar { id: number; matricula: string; nome_completo: string; nome_guerra: string; posto_graduacao: string; ativo: boolean; obm_id: number | null; obm_abreviatura?: string; }
interface Obm { id: number; nome: string; abreviatura: string; }
interface ApiResponse<T> { data: T[]; }

export default function Militares() {
  // ... (Todos os seus hooks useState, useCallback, useEffect permanecem os mesmos) ...
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ nome_completo: '' });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Militar | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const [militaresRes, obmsRes] = await Promise.all([
        api.get<ApiResponse<Militar>>(`/api/admin/militares?${params.toString()}`),
        api.get<ApiResponse<Obm>>('/api/admin/obms?limit=500')
      ]);
      setMilitares(militaresRes.data.data);
      setObms(obmsRes.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: militares.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120, // Aumentamos a estimativa para acomodar o cartão
    overscan: 10,
  });

  const handleOpenFormModal = (item: Militar | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);
  const handleSave = async (data: any) => { setIsLoading(true); try { if (data.id) { await api.put(`/api/admin/militares/${data.id}`, data); } else { await api.post('/api/admin/militares', data); } toast.success(`Militar salvo com sucesso!`); handleCloseFormModal(); fetchData(); } catch (err: any) { if (err.response?.status === 400) { setValidationErrors(err.response.data.errors); toast.error('Corrija os erros.'); } else { toast.error(err.response?.data?.message || 'Erro ao salvar.'); } } finally { setIsLoading(false); } };
  const handleConfirmDelete = async () => { if (!itemToDeleteId) return; setIsDeleting(true); try { await api.delete(`/api/admin/militares/${itemToDeleteId}`); toast.success('Militar excluído!'); fetchData(); } catch (err: any) { toast.error(err.response?.data?.message || 'Erro ao excluir.'); } finally { setIsDeleting(false); handleCloseConfirmModal(); } };

  const gridTemplateColumns = "1fr 1.5fr 1fr 1fr 1fr 1fr";

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Militares</h2>
          <p className="text-gray-600 mt-2">Gerencie o efetivo de militares.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()} className="w-full md:w-auto">Adicionar Novo Militar</Button>
      </div>
      <Input
        type="text"
        placeholder="Filtrar por nome..."
        value={filters.nome_completo}
        onChange={(e) => setFilters({ nome_completo: e.target.value })}
        className="w-full md:max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho da Tabela (Grid) - Visível apenas em telas médias ou maiores */}
        <div style={{ display: 'grid', gridTemplateColumns }} className="hidden md:grid bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto/Grad.</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome de Guerra</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome Completo</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        {/* Contêiner de Rolagem */}
        <div ref={parentRef} className="overflow-y-auto" style={{ height: '70vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const militar = militares[virtualItem.index];
                if (!militar) return null;
                return (
                  <div
                    key={militar.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualItem.start}px)`,
                      padding: '0.5rem', // Espaçamento para o modo cartão
                    }}
                    className="md:p-0" // Remove o padding em telas maiores
                  >
                    {/* --- Layout de Cartão para Mobile --- */}
                    <div className="md:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-lg font-bold text-gray-800">{militar.posto_graduacao} {militar.nome_guerra}</p>
                          <p className="text-sm text-gray-500">{militar.nome_completo}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {militar.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                        <div className="text-sm text-gray-600 space-y-1">
                           <p className="flex items-center"><Hash size={14} className="mr-2" /> {militar.matricula}</p>
                           <p className="flex items-center"><Building size={14} className="mr-2" /> {militar.obm_abreviatura || 'N/A'}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleOpenFormModal(militar)} className="p-2 text-indigo-600 hover:text-indigo-900" title="Editar"><Edit size={20} /></button>
                          <button onClick={() => handleDeleteClick(militar.id)} className="p-2 text-red-600 hover:text-red-900" title="Excluir"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    </div>

                    {/* --- Layout de Grid para Desktop --- */}
                    <div
                      style={{ gridTemplateColumns }}
                      className="hidden md:grid items-center border-b border-gray-200 h-full"
                    >
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{militar.posto_graduacao}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.nome_guerra}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate" title={militar.nome_completo}>{militar.nome_completo}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.matricula}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {militar.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => handleOpenFormModal(militar)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteClick(militar.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais (sem alterações) */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}>
        <MilitarForm militarToEdit={itemToEdit} obms={obms} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este militar? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
