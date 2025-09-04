// Arquivo: frontend/src/pages/Obms.tsx (Atualizado com funcionalidade de upload)

import React, { useState, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

import { useCrud } from '../hooks/useCrud';
import api from '../services/api';

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
  // O hook useCrud continua gerenciando a maior parte da página
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
    fetchData, // Precisamos do fetchData para recarregar os dados
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

  // Estados específicos para o upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
      const response = await api.post('/api/admin/obms/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message || 'Arquivo processado com sucesso!');
      setSelectedFile(null);
      const fileInput = document.getElementById('obm-file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchData(); // Recarrega a lista de OBMs para exibir os dados atualizados
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
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
          <p className="text-gray-600 mt-2">Gerencie as Organizações Bombeiro Militar.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Nova OBM</Button>
      </div>

      {/* Seção de Upload de Arquivo */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Atualizar Cidades/Telefones via Planilha</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="obm-file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (XLS, XLSX)'}</span>
            </div>
            <input id="obm-file-upload" name="obm-file-upload" type="file" className="sr-only" accept=".xls, .xlsx" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar Arquivo'}
          </Button>
        </div>
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
