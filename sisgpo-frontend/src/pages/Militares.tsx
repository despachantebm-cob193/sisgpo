import { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import MilitarForm from '../components/forms/MilitarForm';

// Interfaces
interface Militar {
  id: number;
  matricula: string;
  nome_completo: string;
  nome_guerra: string;
  posto_graduacao: string;
  ativo: boolean;
  obm_id: number | null;
}

interface Obm {
  id: number;
  nome: string;
  abreviatura: string;
}

interface ApiResponse<T> {
  data: T[];
  pagination: any;
}

export default function Militares() {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [obms, setObms] = useState<Obm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [militarToEdit, setMilitarToEdit] = useState<Militar | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [militaresRes, obmsRes] = await Promise.all([
        api.get<ApiResponse<Militar>>('/militares?limit=100'),
        api.get<ApiResponse<Obm>>('/obms?limit=500')
      ]);
      setMilitares(militaresRes.data.data);
      setObms(obmsRes.data.data);
    } catch (err) {
      setError('Não foi possível carregar os dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (militar: Militar | null = null) => {
    setMilitarToEdit(militar);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setMilitarToEdit(null);
  };

  const handleSaveMilitar = async (militarData: Omit<Militar, 'id'> & { id?: number }) => {
    setIsSaving(true);
    try {
      if (militarData.id) {
        await api.put(`/militares/${militarData.id}`, militarData);
      } else {
        await api.post('/militares', militarData);
      }
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao salvar militar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteMilitar = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este militar?')) {
      try {
        await api.delete(`/militares/${id}`);
        fetchData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erro ao excluir militar.');
      }
    }
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Militares</h2>
          <p className="text-gray-600 mt-2">Gerencie o efetivo de militares.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Adicionar Novo Militar</Button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Posto/Grad.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome de Guerra</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matrícula</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {militares.map((militar) => (
              <tr key={militar.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{militar.posto_graduacao}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.nome_guerra}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{militar.matricula}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${militar.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {militar.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleOpenModal(militar)} className="text-indigo-600 hover:text-indigo-900">Editar</button>
                  <button onClick={() => handleDeleteMilitar(militar.id)} className="ml-4 text-red-600 hover:text-red-900">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={militarToEdit ? 'Editar Militar' : 'Adicionar Novo Militar'}
      >
        <MilitarForm
          militarToEdit={militarToEdit}
          obms={obms}
          onSave={handleSaveMilitar}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>
    </div>
  );
}
