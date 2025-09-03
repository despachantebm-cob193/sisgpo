// Arquivo: frontend/src/pages/Viaturas.tsx (Completo e Corrigido)

import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Upload } from 'lucide-react';

import api from '../services/api';
import Button from '../components/ui/Button';
import Spinner from '../components/ui/Spinner';
import Input from '../components/ui/Input';
import Pagination from '../components/ui/Pagination';

// Interface para os dados da viatura, alinhada com o backend
interface Viatura {
  id: number;
  prefixo: string;
  cidade: string | null;
  obm: string | null;
  telefone: string | null;
  ativa: boolean;
}

interface PaginationState {
  currentPage: number;
  totalPages: number;
}

interface ApiResponse {
  data: Viatura[];
  pagination: PaginationState;
}

export default function Viaturas() {
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationState | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filtroPrefixo, setFiltroPrefixo] = useState('');
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Função para buscar os dados da API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: '15',
        prefixo: filtroPrefixo,
      });
      const response = await api.get<ApiResponse>(`/api/admin/viaturas?${params.toString()}`);
      setViaturas(response.data.data);
      setPagination(response.data.pagination);
    } catch (err) {
      toast.error('Não foi possível carregar os dados das viaturas.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filtroPrefixo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiltroPrefixo(e.target.value);
    setCurrentPage(1);
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
      
      toast.success(response.data.message || 'Arquivo processado!');
      setSelectedFile(null);
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      // Recarrega os dados para exibir as atualizações
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
          <p className="text-gray-600 mt-2">Gerencie a frota de viaturas operacionais.</p>
        </div>
      </div>

      {/* Seção de Upload */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Importar/Atualizar Viaturas via Planilha</h3>
        <p className="text-sm text-gray-500 mb-3">
          O sistema irá importar apenas linhas onde a <strong>Coluna C contiver "VIATURA"</strong>.
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

      {/* Filtro */}
      <div className="mb-4">
        <Input 
          type="text" 
          placeholder="Filtrar por prefixo..." 
          value={filtroPrefixo} 
          onChange={handleFiltroChange} 
          className="max-w-xs"
        />
      </div>
      
      {/* Tabela de Exibição */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefixo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner className="h-8 w-8 text-gray-500 mx-auto" /></td></tr>
            ) : viaturas.length > 0 ? (
              viaturas.map((viatura) => (
                <tr key={viatura.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{viatura.prefixo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.cidade || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.obm || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{viatura.telefone || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${viatura.ativa ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {viatura.ativa ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="text-center py-4">Nenhuma viatura encontrada.</td></tr>
            )}
          </tbody>
        </table>
        {pagination && pagination.totalPages > 1 && <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={handlePageChange} />}
      </div>
    </div>
  );
}
