// frontend/src/pages/Viaturas.tsx
import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import ViaturaForm from '../components/forms/ViaturaForm';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';

interface Viatura {
  id: number;
  prefixo: string;
  ativa: boolean;
  obm_id: number | null;
  obm_abreviatura?: string;
  obm_cidade?: string;
  obm_telefone?: string;
}

interface Obm { id: number; nome: string; abreviatura: string; }
interface PaginationState { currentPage: number; totalPages: number; totalRecords: number; perPage: number; }
interface ApiResponse<T> { data: T[]; pagination: PaginationState; }
interface ValidationError { field: string; message: string; }

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroPrefixo, setFiltroPrefixo] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [viaturaToEdit, setViaturaToEdit] = useState<Viatura | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [viaturaToDeleteId, setViaturaToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(currentPage), limit: '10', prefixo: filtroPrefixo });
      const [viaturasRes, obmsRes] = await Promise.all([
        api.get<ApiResponse<Viatura>>(`/api/admin/viaturas?${params.toString()}`),
        api.get<ApiResponse<Obm>>('/api/admin/obms?limit=500')
      ]);
      setViaturas(viaturasRes.data.data);
      setPagination(viaturasRes.data.pagination);
      setObms(obmsRes.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar os dados das viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroPrefixo]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFiltroPrefixo(e.target.value); setCurrentPage(1); };
  const handleOpenFormModal = (viatura: Viatura | null = null) => { setViaturaToEdit(viatura); setValidationErrors([]); setIsFormModalOpen(true); };
  const handleCloseFormModal = () => { setIsFormModalOpen(false); setViaturaToEdit(null); setValidationErrors([]); };

  const handleSaveViatura = async (viaturaData: Omit<Viatura, 'id'> & { id?: number }) => {
    setIsSaving(true);
    setValidationErrors([]);
    const action = viaturaData.id ? 'atualizada' : 'criada';
    try {
      if (viaturaData.id) {
        await api.put(`/api/admin/viaturas/${viaturaData.id}`, viaturaData);
      } else {
        await api.post('/api/admin/viaturas', viaturaData);
      }
      toast.success(`Viatura ${action} com sucesso!`);
      handleCloseFormModal();
      fetchData();
    } catch (err: any) {
      if (err.response && err.response.status === 400 && err.response.data.errors) {
        setValidationErrors(err.response.data.errors);
        toast.error('Por favor, corrija os erros no formulário.');
      } else {
        const errorMessage = err.response?.data?.message || 'Erro ao salvar viatura.';
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = (id: number) => { setViaturaToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => { setIsConfirmModalOpen(false); setViaturaToDeleteId(null); };

  const handleConfirmDelete = async () => {
    if (!viaturaToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/viaturas/${viaturaToDeleteId}`);
      toast.success('Viatura excluída com sucesso!');
      if (viaturas.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchData();
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao excluir viatura.';
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

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
      
      toast.success(`${response.data.inserted} viaturas inseridas, ${response.data.updated} atualizadas. ${response.data.message || ''}`);
      if (response.data.errors && response.data.errors.length > 0) {
        toast.error(`${response.data.errors.length} erros durante o processamento. Verifique o console para detalhes.`);
        console.error("Erros de importação:", response.data.errors);
      }
      
      setSelectedFile(null);
      fetchData(); 
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
          <p className="text-gray-600 mt-2">Gerencie a frota de viaturas.</p>
        </div>
        <Button onClick={() => handleOpenFormModal()}>Adicionar Nova Viatura</Button>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Importar/Atualizar Viaturas via Planilha</h3>
        <p className="text-sm text-gray-500 mb-3">
          O sistema irá importar apenas linhas onde a **Coluna C contiver "VIATURA"**.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo (XLS, XLSX)'}</span>
            </div>
            <input 
              id="file-upload" 
              name="file-upload" 
              type="file" 
              className="sr-only" 
              accept=".xls, .xlsx"
              onChange={handleFileChange} 
            />
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
          value={filtroPrefixo} 
          onChange={handleFiltroChange} 
          className="max-w-xs"
        />
      </div>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.obm_cidade || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.obm_abreviatura || 'N/A'}</td>
                  {/* --- CORREÇÃO FINAL AQUI --- */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.obm_telefone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{viatura.ativa ? 'Ativa' : 'Inativa'}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleOpenFormModal(viatura)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                    <button onClick={() => handleDeleteClick(viatura.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
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
      <Modal isOpen={isFormModalOpen} onClose={handleCloseFormModal} title={viaturaToEdit ? 'Editar Viatura' : 'Adicionar Nova Viatura'}>
        <ViaturaForm viaturaToEdit={viaturaToEdit} obms={obms} onSave={handleSaveViatura} onCancel={handleCloseFormModal} isLoading={isSaving} errors={validationErrors} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir esta viatura? Esta ação não pode ser desfeita." isLoading={isDeleting} />
    </div>
  );
}
