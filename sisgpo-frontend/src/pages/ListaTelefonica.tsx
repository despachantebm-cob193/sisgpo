import { useState, useEffect, useCallback, useRef, ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { Upload, Search } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

import api from '../services/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Spinner from '../components/ui/Spinner';

// Interfaces (sem alteração)
interface Contato {
  id: number;
  orgao: string;
  obm_local: string;
  secao_departamento: string;
  telefone: string;
}

interface ApiResponse {
  data: Contato[];
  pagination: null;
}

export default function ListaTelefonica() {
  // Toda a lógica de estados, busca de dados e upload permanece exatamente a mesma.
  // Nenhuma alteração é necessária aqui.
  const [allContatos, setAllContatos] = useState<Contato[]>([]);
  const [filteredContatos, setFilteredContatos] = useState<Contato[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchContatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>('/api/admin/contatos');
      const data = response.data.data || [];
      setAllContatos(data);
      setFilteredContatos(data);
    } catch (error) {
      toast.error('Não foi possível carregar a lista telefônica.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContatos();
  }, [fetchContatos]);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filtered = allContatos.filter(contato =>
      (contato.orgao?.toLowerCase() || '').includes(lowercasedFilter) ||
      (contato.obm_local?.toLowerCase() || '').includes(lowercasedFilter) ||
      (contato.secao_departamento?.toLowerCase() || '').includes(lowercasedFilter) ||
      (contato.telefone?.toLowerCase() || '').includes(lowercasedFilter)
    );
    setFilteredContatos(filtered);
  }, [searchTerm, allContatos]);

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Nenhum arquivo selecionado.');
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    try {
      const response = await api.post('/api/admin/contatos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success(response.data.message || 'Lista atualizada com sucesso!');
      setSelectedFile(null);
      setSearchTerm('');
      fetchContatos();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao enviar o arquivo.');
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error('Por favor, selecione um arquivo no formato CSV.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: filteredContatos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 49,
    overscan: 10,
  });

  return (
    <div>
      {/* Cabeçalho e Upload (sem alteração) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Lista Telefônica CBMGO</h2>
          <p className="text-gray-600 mt-2">Consulte e atualize os contatos da corporação.</p>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Atualizar Lista via CSV</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <label htmlFor="file-upload" className="flex-1 w-full">
            <div className="flex items-center justify-center w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-100">
              <Upload className="w-5 h-5 text-gray-500 mr-2" />
              <span className="text-sm text-gray-600">{selectedFile ? selectedFile.name : 'Clique para selecionar o arquivo CSV'}</span>
            </div>
            <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
          </label>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading} className="w-full sm:w-auto">
            {isUploading ? <Spinner className="h-5 w-5" /> : 'Enviar Arquivo'}
          </Button>
        </div>
      </div>

      {/* Busca (sem alteração) */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input type="text" placeholder="Buscar em todos os campos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
      </div>

      {/* Tabela Virtualizada com a coluna "ÓRGÃO" OCULTA */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* 1. Cabeçalho ajustado e larguras redistribuídas */}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[50%]">OBM/Local</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[34%]">Seção/Departamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-[14%]">Telefone</th>
            </tr>
          </thead>
        </table>
        <div ref={parentRef} className="h-[600px] overflow-y-auto">
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {isLoading ? (
              <div className="absolute inset-0 flex justify-center items-center"><Spinner className="h-8 w-8 text-gray-500" /></div>
            ) : (
              rowVirtualizer.getVirtualItems().map(virtualItem => {
                const contato = filteredContatos[virtualItem.index];
                return (
                  <div
                    key={virtualItem.key}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                    }}
                    className="flex items-center border-b border-gray-200 hover:bg-gray-50"
                  >
                    {/* 2. Células de dados ajustadas e larguras redistribuídas */}
                    <div className="w-[60%] px-6 py-3 text-sm text-gray-500 truncate">{contato.obm_local}</div>
                    <div className="w-[40%] px-6 py-3 text-sm text-gray-500 truncate">{contato.secao_departamento}</div>
                    <div className="w-[15%] px-6 py-3 text-sm text-gray-500 truncate">{contato.telefone}</div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
