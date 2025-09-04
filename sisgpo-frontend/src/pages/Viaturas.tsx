// Arquivo: frontend/src/pages/Viaturas.tsx (Completo)

import { useState, ChangeEvent, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Upload, Edit, Trash2 } from 'lucide-react';

import { useCrud } from '../hooks/useCrud';
import api from '../services/api';

import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import ConfirmationModal from '../components/ui/ConfirmationModal';

// Interfaces
interface Viatura {
  id: number;
  prefixo: string;
  cidade: string | null;
  obm: string | null;
  ativa: boolean;
}

export default function Viaturas() {
  const {
    data: viaturas,
    isLoading,
    pagination,
    filters,
    isFormModalOpen,
    itemToEdit,
    isSaving,
    isConfirmModalOpen,
    isDeleting,
    fetchData,
    handleFilterChange,
    handlePageChange,
    handleOpenFormModal,
    handleCloseFormModal,
    handleSave,
    handleDeleteClick,
    handleCloseConfirmModal,
    handleConfirmDelete,
    validationErrors,
  } = useCrud<Viatura>({
    entityName: 'viaturas',
    initialFilters: { prefixo: '' },
    itemsPerPage: 15,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const fetchLastUpload = useCallback(async () => {
    try {
      const response = await api.get('/api/admin/metadata/viaturas_last_upload');
      const date = new Date(response.data.value);
      setLastUpload(date.toLocaleString('pt-BR'));
    } catch (error) {
      console.error("Não foi possível buscar a data da última atualização.");
      setLastUpload(null);
    }
  }, []);

  useEffect(() => {
    fetchLastUpload();
  }, [fetchLastUpload]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedExtensions = ['.xls', '.xlsx'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        toast.error('Formato de arquivo inválido. Use XLS ou XLSX.');
        event.target.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Nenhum arquivo selecionado.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.post('/api/admin/viaturas/upload-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message || 'Arquivo processado!');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchData();
      fetchLastUpload(); // Re-busca a data após o upload
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Viaturas</h2>
          <p className="text-gray-600 mt-2">Gerencie a frota de viaturas operacionais.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Viatura</Button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Importar/Atualizar Viaturas via Planilha</h3>
          {lastUpload && (
            <p className="text-sm text-gray-500">
              Última atualização: <span className="font-medium">{lastUpload}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (XLS, XLSX)'}</span>
            </div>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".xls, .xlsx" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar Arquivo'}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Filtrar por prefixo..."
          value={filters.prefixo || ''}
          onChange={(e) => handleFilterChange('prefixo', e.target.value)}
          className="max-w-xs"
        />
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[15%]">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[30%]">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[20%]">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[10%]">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 truncate">{viatura.prefixo}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 break-words">{viatura.obm || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 truncate">{viatura.cidade || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viatura.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                    <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                    <button onClick={() => handleDeleteClick(viatura.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="text-center py-4">Nenhuma viatura encontrada.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>

      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={itemToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={itemToEdit} onSave={handleSave} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
