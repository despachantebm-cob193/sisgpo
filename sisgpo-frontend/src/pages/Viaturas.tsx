// Arquivo: frontend/src/pages/Viaturas.tsx (Virtualizado)

import React, { useState, ChangeEvent, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces
interface Viatura { id: number; prefixo: string; cidade: string | null; obm: string | null; ativa: boolean; }
interface ApiResponse<T> { data: T[]; }

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ prefixo: '' });
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  // Estados para modais e upload
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<Viatura | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const response = await api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar as viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/metadata/viaturas_last_upload');
      setLastUpload(new Date(response.data.value).toLocaleString('pt-BR'));
    } catch (error) {
      setLastUpload(null);
    }
  }, []);

  useEffect(() => {
    fetchData();
    fetchLastUpload();
  }, [fetchData, fetchLastUpload]);

  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: viaturas.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 58,
    overscan: 10,
  });

  // Funções de CRUD e Upload (semelhantes ao que já tínhamos)
  const handleOpenFormModal = (item: Viatura | null = null) => { setItemToEdit(item); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => setIsFormModalOpen(false);
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);
  const handleSave = async (data: any) => { /* ... */ };
  const handleConfirmDelete = async () => { /* ... */ };
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => { /* ... */ };
  const handleUpload = async () => { /* ... */ };

  const gridTemplateColumns = "1.5fr 2fr 1.5fr 1fr 1fr";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900">Viaturas</h2>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Viatura</Button>
      </div>

      {/* Seção de Upload (sem alterações) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Importar/Atualizar Viaturas</h3>
          {lastUpload && <p className="text-sm text-gray-500">Última atualização: <span className="font-medium">{lastUpload}</span></p>}
        </div>
        {/* ...código do formulário de upload... */}
      </div>

      <Input
        type="text"
        placeholder="Filtrar por prefixo..."
        value={filters.prefixo}
        onChange={(e) => setFilters({ prefixo: e.target.value })}
        className="max-w-xs mb-4"
      />

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho da Tabela (Grid) */}
        <div style={{ display: 'grid', gridTemplateColumns }} className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</div>
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
                const viatura = viaturas[virtualItem.index];
                if (!viatura) return null;
                return (
                  <div
                    key={viatura.id}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)`, display: 'grid', gridTemplateColumns }}
                    className="items-center border-b border-gray-200"
                  >
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</div>
                    <div className="px-6 py-4 text-sm text-gray-500">{viatura.obm || 'N/A'}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.cidade || 'N/A'}</div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {viatura.ativa ? 'Ativa' : 'Inativa'}
                      </span>
                    </div>
                    <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                      <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => handleDeleteClick(viatura.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura?" isLoading={isDeleting} />
    </div>
  );
}
