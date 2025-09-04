// Arquivo: frontend/src/pages/Plantoes.tsx (Código Completo e Responsivo)

import React, { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useVirtualizer } from '@tanstack/react-virtual';

import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import PlantaoForm from '../components/forms/PlantaoForm';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import Spinner from '../components/ui/Spinner';
import ConfirmationModal from '../components/ui/ConfirmationModal';
import { Edit, Trash2, Calendar, Car, Building } from 'lucide-react'; // Ícones adicionados

// Interfaces (sem alteração)
interface Plantao { id: number; data_plantao: string; viatura_prefixo: string; obm_abreviatura: string; }
interface Viatura { id: number; prefixo: string; obm_id: number; }
interface Militar { id: number; nome_guerra: string; posto_graduacao: string; }
interface PlantaoDetalhado { id: number; data_plantao: string; viatura_id: number; obm_id: number; observacoes: string; guarnicao: { militar_id: number; funcao: string }[]; }
interface ApiResponse<T> { data: T[]; }

export default function Plantoes() {
  // Hooks de estado (sem alteração)
  const [plantoes, setPlantoes] = useState<Plantao[]>([]);
  const [viaturas, setViaturas] = useState<Viatura[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({ data_inicio: '', data_fim: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [plantaoToEdit, setPlantaoToEdit] = useState<PlantaoDetalhado | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Funções de busca e salvamento (sem alteração)
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ ...filters, all: 'true' });
      const [plantoesRes, viaturasRes, militaresRes] = await Promise.all([
        api.get<ApiResponse<Plantao>>(`/api/admin/plantoes?${params.toString()}`),
        api.get<ApiResponse<Viatura>>('/api/admin/viaturas?limit=1000&all=true'),
        api.get<ApiResponse<Militar>>('/api/admin/militares?limit=1000&ativo=true&all=true')
      ]);
      setPlantoes(plantoesRes.data.data);
      setViaturas(viaturasRes.data.data);
      setMilitares(militaresRes.data.data);
    } catch (err) {
      toast.error('Não foi possível carregar os dados da página.');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleOpenModal = async (plantao: Plantao | null = null) => {
    if (plantao) {
      try {
        const response = await api.get<PlantaoDetalhado>(`/api/admin/plantoes/${plantao.id}`);
        setPlantaoToEdit(response.data);
      } catch (error) {
        toast.error("Não foi possível carregar os detalhes do plantão.");
        return;
      }
    } else {
      setPlantaoToEdit(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setPlantaoToEdit(null); };
  const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };
  const handleCloseConfirmModal = () => setIsConfirmModalOpen(false);

  const handleSavePlantao = async (data: any) => {
    setIsSaving(true);
    const action = data.id ? 'atualizado' : 'criado';
    try {
      if (data.id) {
        await api.put(`/api/admin/plantoes/${data.id}`, data);
      } else {
        await api.post('/api/admin/plantoes', data);
      }
      toast.success(`Plantão ${action} com sucesso!`);
      handleCloseModal();
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar o plantão.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDeleteId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/api/admin/plantoes/${itemToDeleteId}`);
      toast.success('Plantão excluído com sucesso!');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir plantão.');
    } finally {
      setIsDeleting(false);
      handleCloseConfirmModal();
    }
  };

  // Virtualização (ajuste no estimateSize)
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: plantoes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 110, // Aumenta a estimativa para o card
    overscan: 10,
  });

  const formatDate = (isoDate: string) => new Date(isoDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const gridTemplateColumns = "1fr 1fr 1fr 1fr";

  return (
    <div>
      {/* Cabeçalho e Filtros (sem alteração) */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Escala de Plantão</h2>
          <p className="text-gray-600 mt-2">Gerencie as escalas diárias de serviço.</p>
        </div>
        <Button onClick={() => handleOpenModal()}>Lançar Novo Plantão</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border">
        <div>
          <Label htmlFor="data_inicio">Data Início</Label>
          <Input id="data_inicio" type="date" value={filters.data_inicio} onChange={(e) => setFilters(f => ({...f, data_inicio: e.target.value}))} />
        </div>
        <div>
          <Label htmlFor="data_fim">Data Fim</Label>
          <Input id="data_fim" type="date" value={filters.data_fim} onChange={(e) => setFilters(f => ({...f, data_fim: e.target.value}))} />
        </div>
        <div className="flex items-end">
          <Button onClick={() => setFilters({ data_inicio: '', data_fim: '' })} className="!w-full bg-gray-600 hover:bg-gray-700">Limpar Filtros</Button>
        </div>
      </div>

      {/* --- ÁREA DE RENDERIZAÇÃO RESPONSIVA --- */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Cabeçalho da Tabela (visível apenas em telas médias ou maiores) */}
        <div style={{ display: 'grid', gridTemplateColumns }} className="hidden md:grid bg-gray-50 sticky top-0 z-10 border-b border-gray-200">
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Viatura</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OBM</div>
          <div className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</div>
        </div>

        {/* Contêiner da Lista Virtualizada */}
        <div ref={parentRef} className="overflow-y-auto" style={{ height: '65vh' }}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Spinner className="h-10 w-10" /></div>
          ) : (
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
              {rowVirtualizer.getVirtualItems().map((virtualItem) => {
                const plantao = plantoes[virtualItem.index];
                if (!plantao) return null;
                return (
                  <div
                    key={plantao.id}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${virtualItem.start}px)`, padding: '0.5rem' }}
                    className="md:p-0"
                  >
                    {/* Layout de Card para Mobile */}
                    <div className="md:hidden bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex justify-between items-start">
                        <p className="text-lg font-bold text-gray-800 flex items-center">
                          <Car size={20} className="mr-2 text-red-600" /> {plantao.viatura_prefixo}
                        </p>
                      </div>
                      <div className="mt-3 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center"><Calendar size={14} className="mr-2" /> {formatDate(plantao.data_plantao)}</p>
                        <p className="flex items-center"><Building size={14} className="mr-2" /> {plantao.obm_abreviatura}</p>
                      </div>
                      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end items-center">
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleOpenModal(plantao)} className="p-2 text-indigo-600 hover:text-indigo-900" title="Editar"><Edit size={20} /></button>
                          <button onClick={() => handleDeleteClick(plantao.id)} className="p-2 text-red-600 hover:text-red-900" title="Excluir"><Trash2 size={20} /></button>
                        </div>
                      </div>
                    </div>

                    {/* Layout de Tabela para Desktop */}
                    <div style={{ gridTemplateColumns }} className="hidden md:grid items-center border-b border-gray-200 h-full">
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(plantao.data_plantao)}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.viatura_prefixo}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plantao.obm_abreviatura}</div>
                      <div className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-4">
                        <button onClick={() => handleOpenModal(plantao)} className="text-indigo-600 hover:text-indigo-900" title="Editar"><Edit className="w-5 h-5" /></button>
                        <button onClick={() => handleDeleteClick(plantao.id)} className="text-red-600 hover:text-red-900" title="Excluir"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modais (sem alteração) */}
      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={plantaoToEdit ? 'Editar Plantão' : 'Lançar Novo Plantão'}>
        <PlantaoForm plantaoToEdit={plantaoToEdit} viaturas={viaturas} militares={militares} onSave={handleSavePlantao} onCancel={handleCloseModal} isLoading={isSaving} />
      </Modal>
      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={handleCloseConfirmModal} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja excluir este plantão?" isLoading={isDeleting} />
    </div>
  );
}
