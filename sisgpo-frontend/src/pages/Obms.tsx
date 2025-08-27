import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal'; // Importe o Modal
import ObmForm from '../components/forms/ObmForm'; // Importe o Formulário

interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
  cidade: string | null;
  ativo: boolean;
}

interface ApiResponse {
  data: Obm[];
  pagination: any;
}

export default function Obms() {
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para controlar o modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [obmToEdit, setObmToEdit] = useState<Obm | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchObms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<ApiResponse>('/obms?limit=100');
      setObms(response.data.data);
    } catch (err) {
      setError('Não foi possível carregar as OBMs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchObms();
  }, []);

  const handleOpenModal = (obm: Obm | null = null) => {
    setObmToEdit(obm);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setObmToEdit(null);
  };

  const handleSaveObm = async (obmData: Omit<Obm, 'id'> & { id?: number }) => {
    setIsSaving(true);
    try {
      if (obmData.id) {
        // Edição
        await api.put(`/obms/${obmData.id}`, obmData);
      } else {
        // Criação
        await api.post('/obms', obmData);
      }
      handleCloseModal();
      fetchObms(); // Recarrega a lista após salvar
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar OBM.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteObm = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta OBM?')) {
      try {
        await api.delete(`/obms/${id}`);
        fetchObms(); // Recarrega a lista
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erro ao excluir OBM.');
      }
    }
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">OBMs</h2>
          <p className="text-gray-600 mt-2">Gerencie as Organizações Bombeiro Militar.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Adicionar Nova OBM</Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abreviatura</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cidade</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {obms.map((obm) => (
              <tr key={obm.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{obm.nome}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.abreviatura}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{obm.cidade || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${obm.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {obm.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(obm)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                  <button onClick={() => handleDeleteObm(obm.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* O Modal é renderizado aqui */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={obmToEdit ? 'Editar OBM' : 'Adicionar Nova OBM'}
      >
        <ObmForm
          obmToEdit={obmToEdit}
          onSave={handleSaveObm}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
