import { useState, useEffect, useCallback } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PencilIcon, TrashIcon, PlusIcon, SearchIcon, PhoneIcon, MailIcon, CalendarIcon, UserIcon, Share2 } from 'lucide-react';
import { getWhatsappLink } from '@/utils/formatters';
import BatchWhatsAppModal from '@/components/ui/BatchWhatsAppModal';

interface ComandanteCrbm {
    id: number;
    crbm: string;
    militar_id: number | null;
    nome_comandante: string;
    posto_graduacao: string | null;
    telefone: string | null;
    email: string | null;
    data_inicio: string | null;
    // Subcomandante
    subcomandante_militar_id: number | null;
    nome_subcomandante: string | null;
    subcomandante_posto: string | null;
    subcomandante_telefone: string | null;
    subcomandante_email: string | null;
    observacoes: string | null;
}

interface MilitarOption {
    id: number;
    matricula: string;
    nome_completo: string;
    nome_guerra: string | null;
    posto_graduacao: string | null;
    telefone: string | null;
}

const CRBMS = ['1º CRBM', '2º CRBM', '3º CRBM', '4º CRBM', '5º CRBM', '6º CRBM', '7º CRBM', '8º CRBM', '9º CRBM'];

export default function ComandantesCrbmPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.perfil === 'admin';
    const { setPageTitle } = useUiStore();
    const [comandantes, setComandantes] = useState<ComandanteCrbm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ComandanteCrbm | null>(null);
    const [isBatchShareOpen, setIsBatchShareOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        crbm: '',
        militar_id: null as number | null,
        nome_comandante: '',
        posto_graduacao: '',
        telefone: '',
        email: '',
        data_inicio: '',
        // Subcomandante
        subcomandante_militar_id: null as number | null,
        nome_subcomandante: '',
        subcomandante_posto: '',
        subcomandante_telefone: '',
        subcomandante_email: '',
        observacoes: ''
    });

    // Autocomplete state (Comandante)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<MilitarOption[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Autocomplete state (Subcomandante)
    const [subSearchTerm, setSubSearchTerm] = useState('');
    const [subSearchResults, setSubSearchResults] = useState<MilitarOption[]>([]);

    useEffect(() => {
        setPageTitle('Comandantes de CRBM');
        fetchComandantes();
    }, [setPageTitle]);

    const fetchComandantes = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/api/comandantes-crbm');
            setComandantes(response.data);
        } catch (error) {
            console.error('Erro ao carregar comandantes:', error);
            toast.error('Erro ao carregar comandantes');
        } finally {
            setIsLoading(false);
        }
    };

    const searchMilitares = useCallback(async (term: string) => {
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.get(`/api/comandantes-crbm/search-militares?q=${encodeURIComponent(term)}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Erro ao buscar militares:', error);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const searchSubMilitares = useCallback(async (term: string) => {
        if (term.length < 2) {
            setSubSearchResults([]);
            return;
        }

        try {
            const response = await api.get(`/api/comandantes-crbm/search-militares?q=${encodeURIComponent(term)}`);
            setSubSearchResults(response.data);
        } catch (error) {
            console.error('Erro ao buscar subcomandantes:', error);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm && searchTerm.length >= 2) {
                searchMilitares(searchTerm);
            } else {
                setSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchMilitares]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (subSearchTerm && subSearchTerm.length >= 2) {
                searchSubMilitares(subSearchTerm);
            } else {
                setSubSearchResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [subSearchTerm, searchSubMilitares]);
    const handleSelectMilitar = (militar: MilitarOption) => {
        setFormData({
            ...formData,
            militar_id: militar.id,
            nome_comandante: militar.nome_completo,
            posto_graduacao: militar.posto_graduacao || '',
            telefone: militar.telefone || ''
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleSelectSubMilitar = (militar: MilitarOption) => {
        setFormData({
            ...formData,
            subcomandante_militar_id: militar.id,
            nome_subcomandante: militar.nome_completo,
            subcomandante_posto: militar.posto_graduacao || '',
            subcomandante_telefone: militar.telefone || ''
        });
        setSubSearchTerm('');
        setSubSearchResults([]);
    };

    const openModal = (item?: ComandanteCrbm) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                crbm: item.crbm,
                militar_id: item.militar_id,
                nome_comandante: item.nome_comandante,
                posto_graduacao: item.posto_graduacao || '',
                telefone: item.telefone || '',
                email: item.email || '',
                data_inicio: item.data_inicio || '',
                subcomandante_militar_id: item.subcomandante_militar_id,
                nome_subcomandante: item.nome_subcomandante || '',
                subcomandante_posto: item.subcomandante_posto || '',
                subcomandante_telefone: item.subcomandante_telefone || '',
                subcomandante_email: item.subcomandante_email || '',
                observacoes: item.observacoes || ''
            });
        } else {
            setEditingItem(null);
            setFormData({
                crbm: '',
                militar_id: null,
                nome_comandante: '',
                posto_graduacao: '',
                telefone: '',
                email: '',
                data_inicio: '',
                subcomandante_militar_id: null,
                nome_subcomandante: '',
                subcomandante_posto: '',
                subcomandante_telefone: '',
                subcomandante_email: '',
                observacoes: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setSearchTerm('');
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.crbm || !formData.nome_comandante) {
            toast.error('CRBM e Nome do Comandante são obrigatórios');
            return;
        }

        try {
            if (editingItem) {
                await api.put(`/api/comandantes-crbm/${editingItem.id}`, formData);
                toast.success('Comandante atualizado com sucesso!');
            } else {
                await api.post('/api/comandantes-crbm', formData);
                toast.success('Comandante cadastrado com sucesso!');
            }
            closeModal();
            fetchComandantes();
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Erro ao salvar';
            const errorDetails = error.response?.data?.details ? JSON.stringify(error.response.data.details) : '';
            console.error('Detalhes do erro:', error.response?.data);

            toast.error(`Erro: ${errorMsg} ${errorDetails ? `(${errorDetails})` : ''}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja remover este comandante?')) return;

        try {
            await api.delete(`/api/comandantes-crbm/${id}`);
            toast.success('Comandante removido com sucesso!');
            fetchComandantes();
        } catch (error) {
            console.error('Erro ao remover:', error);
            toast.error('Erro ao remover comandante');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <p className="text-white/70">Gerencie os comandantes dos Comandos Regionais de Bombeiros Militares</p>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <Button
                        onClick={() => setIsBatchShareOpen(true)}
                        className="w-full md:w-auto !bg-emerald-600 hover:!bg-emerald-700 justify-center"
                        title="Compartilhar dashboard com todos os comandantes"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar em Lote
                    </Button>
                    {isAdmin && (
                        <Button onClick={() => openModal()} className="w-full md:w-auto !bg-green-600 hover:!bg-green-700 justify-center">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Adicionar Comandante
                        </Button>
                    )}
                </div>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden space-y-4">
                {isLoading ? (
                    <div className="text-center py-8 text-textSecondary">Carregando...</div>
                ) : comandantes.length === 0 ? (
                    <div className="text-center py-8 text-textSecondary">Nenhum comandante cadastrado</div>
                ) : (
                    comandantes.map((cmd) => (
                        <div key={cmd.id} className="bg-card rounded-xl border border-border p-4 space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-lg text-primary">{cmd.crbm}</span>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => openModal(cmd)}
                                            className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                        >
                                            <PencilIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(cmd.id)}
                                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Comandante Info */}
                            <div className="bg-[#252b3d]/50 rounded-lg p-3">
                                <span className="text-xs text-textSecondary uppercase font-semibold">Comandante</span>
                                <div className="flex flex-col mt-1">
                                    <span className="text-textMain font-medium">
                                        {cmd.nome_comandante || <span className="text-textSecondary italic">Não informado</span>}
                                    </span>
                                    {cmd.posto_graduacao && (
                                        <span className="text-xs text-textSecondary">{cmd.posto_graduacao}</span>
                                    )}
                                    {cmd.telefone && (
                                        <a
                                            href={getWhatsappLink(cmd.telefone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-green-400 hover:text-green-300 mt-1 text-sm font-medium"
                                            title="Conversar no WhatsApp"
                                        >
                                            <PhoneIcon className="w-3 h-3" />
                                            {cmd.telefone}
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Subcomandante Info */}
                            <div className="bg-[#252b3d]/50 rounded-lg p-3">
                                <span className="text-xs text-textSecondary uppercase font-semibold">Subcomandante</span>
                                <div className="flex flex-col mt-1">
                                    <span className="text-textMain font-medium">
                                        {cmd.nome_subcomandante || <span className="text-textSecondary italic">-</span>}
                                    </span>
                                    {cmd.subcomandante_posto && (
                                        <span className="text-xs text-textSecondary">{cmd.subcomandante_posto}</span>
                                    )}
                                    {cmd.subcomandante_telefone && (
                                        <a
                                            href={getWhatsappLink(cmd.subcomandante_telefone)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-green-400 hover:text-green-300 mt-1 text-sm font-medium"
                                            title="Conversar no WhatsApp"
                                        >
                                            <PhoneIcon className="w-3 h-3" />
                                            {cmd.subcomandante_telefone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#252b3d] border-b border-border">
                            <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-textMain">CRBM</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-textMain">Comandante</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-textMain">Telefone</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-textMain">Subcomandante</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold text-textMain">Tel. Subcmt</th>
                                {isAdmin && <th className="px-4 py-3 text-center text-sm font-semibold text-textMain">Ações</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-textSecondary">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : comandantes.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-textSecondary">
                                        Nenhum comandante cadastrado
                                    </td>
                                </tr>
                            ) : (
                                comandantes.map((cmd) => (
                                    <tr key={cmd.id} className="border-b border-border hover:bg-[#252b3d] transition-colors">
                                        <td className="px-4 py-3">
                                            <span className="font-medium text-primary">{cmd.crbm}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-textMain font-medium">
                                                    {cmd.nome_comandante || <span className="text-textSecondary italic">Não informado</span>}
                                                </span>
                                                {cmd.posto_graduacao && (
                                                    <span className="text-xs text-textSecondary">{cmd.posto_graduacao}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-textSecondary">
                                            {cmd.telefone ? (
                                                <a
                                                    href={getWhatsappLink(cmd.telefone)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-green-400 hover:text-green-300 font-medium"
                                                    title="Conversar no WhatsApp"
                                                >
                                                    <PhoneIcon className="w-4 h-4" />
                                                    {cmd.telefone}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-textMain">
                                                    {cmd.nome_subcomandante || <span className="text-textSecondary italic">-</span>}
                                                </span>
                                                {cmd.subcomandante_posto && (
                                                    <span className="text-xs text-textSecondary">{cmd.subcomandante_posto}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-textSecondary">
                                            {cmd.subcomandante_telefone ? (
                                                <a
                                                    href={getWhatsappLink(cmd.subcomandante_telefone)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-1 text-green-400 hover:text-green-300 font-medium"
                                                    title="Conversar no WhatsApp"
                                                >
                                                    <PhoneIcon className="w-4 h-4" />
                                                    {cmd.subcomandante_telefone}
                                                </a>
                                            ) : '-'}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-center gap-2">
                                                    <button
                                                        onClick={() => openModal(cmd)}
                                                        className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(cmd.id)}
                                                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                                                        title="Remover"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1a1f2e] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-bold text-textMain">
                                {editingItem ? 'Editar Comandante' : 'Novo Comandante'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* CRBM Selection */}
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    CRBM *
                                </label>
                                <select
                                    value={formData.crbm}
                                    onChange={(e) => setFormData({ ...formData, crbm: e.target.value })}
                                    className="w-full px-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                    required
                                >
                                    <option value="">Selecione o CRBM</option>
                                    {CRBMS.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Search Militar */}
                            <div className="relative">
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    Buscar Militar (opcional)
                                </label>
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onBlur={() => setTimeout(() => setSearchResults([]), 200)}
                                        placeholder="Digite nome ou matrícula para buscar..."
                                        className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                                {searchTerm.length >= 2 && searchResults.length > 0 && (
                                    <div className="absolute z-10 w-full mt-1 bg-[#1a1f2e] border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                        {searchResults.map(mil => (
                                            <button
                                                key={mil.id}
                                                type="button"
                                                onClick={() => handleSelectMilitar(mil)}
                                                className="w-full px-4 py-2 text-left hover:bg-[#252b3d] transition-colors"
                                            >
                                                <span className="text-primary font-medium">{mil.posto_graduacao}</span>
                                                <span className="text-textMain ml-2">{mil.nome_completo}</span>
                                                <span className="text-textSecondary text-sm ml-2">({mil.matricula})</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Nome do Comandante */}
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    Nome do Comandante *
                                </label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                    <input
                                        type="text"
                                        value={formData.nome_comandante}
                                        onChange={(e) => setFormData({ ...formData, nome_comandante: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Posto/Graduacao */}
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    Posto/Graduação
                                </label>
                                <input
                                    type="text"
                                    value={formData.posto_graduacao}
                                    onChange={(e) => setFormData({ ...formData, posto_graduacao: e.target.value })}
                                    placeholder="Ex: Cel, Ten Cel, Maj..."
                                    className="w-full px-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>

                            {/* Two columns */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">
                                        Telefone
                                    </label>
                                    <div className="relative">
                                        <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                        <input
                                            type="text"
                                            value={formData.telefone}
                                            onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                            placeholder="(62) 99999-9999"
                                            className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textSecondary mb-1">
                                        Email
                                    </label>
                                    <div className="relative">
                                        <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            placeholder="email@cbm.go.gov.br"
                                            className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Data Início */}
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    Data de Início do Comando
                                </label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                    <input
                                        type="date"
                                        value={formData.data_inicio}
                                        onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>
                            </div>

                            {/* SUBCOMANDANTE SECTION */}
                            <div className="border-t border-border pt-4 mt-4">
                                <h3 className="text-lg font-semibold text-primary mb-4">Subcomandante</h3>

                                {/* Search Subcomandante (Militar) */}
                                <div className="mb-4 relative">
                                    <label className="block text-sm font-medium text-textSecondary mb-1">
                                        Buscar Subcomandante (opcional)
                                    </label>
                                    <div className="relative">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                        <input
                                            type="text"
                                            value={subSearchTerm}
                                            onChange={(e) => setSubSearchTerm(e.target.value)}
                                            onBlur={() => setTimeout(() => setSubSearchResults([]), 200)}
                                            placeholder="Digite nome ou matrícula para buscar..."
                                            className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                    {subSearchTerm.length >= 2 && subSearchResults.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-[#1a1f2e] border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                            {subSearchResults.map(mil => (
                                                <button
                                                    key={mil.id}
                                                    type="button"
                                                    onClick={() => handleSelectSubMilitar(mil)}
                                                    className="w-full px-4 py-2 text-left hover:bg-[#252b3d] transition-colors"
                                                >
                                                    <span className="text-primary font-medium">{mil.posto_graduacao}</span>
                                                    <span className="text-textMain ml-2">{mil.nome_completo}</span>
                                                    <span className="text-textSecondary text-sm ml-2">({mil.matricula})</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Nome do Subcomandante (Exibição/Edição Manual) */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-textSecondary mb-1">
                                        Nome do Subcomandante
                                    </label>
                                    <div className="relative">
                                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                        <input
                                            type="text"
                                            value={formData.nome_subcomandante}
                                            onChange={(e) => setFormData({ ...formData, nome_subcomandante: e.target.value })}
                                            className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                {/* Posto/Graduação do Subcomandante */}
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-textSecondary mb-1">
                                        Posto/Graduação
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.subcomandante_posto}
                                        onChange={(e) => setFormData({ ...formData, subcomandante_posto: e.target.value })}
                                        placeholder="Ex: Ten Cel, Maj..."
                                        className="w-full px-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                    />
                                </div>

                                {/* Two columns for Subcomandante */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-textSecondary mb-1">
                                            Telefone
                                        </label>
                                        <div className="relative">
                                            <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                            <input
                                                type="text"
                                                value={formData.subcomandante_telefone}
                                                onChange={(e) => setFormData({ ...formData, subcomandante_telefone: e.target.value })}
                                                placeholder="(62) 99999-9999"
                                                className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-textSecondary mb-1">
                                            Email
                                        </label>
                                        <div className="relative">
                                            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                                            <input
                                                type="email"
                                                value={formData.subcomandante_email}
                                                onChange={(e) => setFormData({ ...formData, subcomandante_email: e.target.value })}
                                                placeholder="email@cbm.go.gov.br"
                                                className="w-full pl-10 pr-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Observações */}
                            <div>
                                <label className="block text-sm font-medium text-textSecondary mb-1">
                                    Observações
                                </label>
                                <textarea
                                    value={formData.observacoes}
                                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-[#252b3d] border border-border rounded-lg text-textMain focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <Button type="button" onClick={closeModal} className="!bg-gray-600 hover:!bg-gray-700">
                                    Cancelar
                                </Button>
                                <Button type="submit" className="!bg-primary hover:!bg-primary/90">
                                    {editingItem ? 'Salvar Alterações' : 'Cadastrar'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Batch Share Modal */}
            <BatchWhatsAppModal
                isOpen={isBatchShareOpen}
                onClose={() => setIsBatchShareOpen(false)}
                comandantes={comandantes.map(c => ({
                    id: c.id,
                    crbm: c.crbm,
                    nome_comandante: c.nome_comandante,
                    telefone: c.telefone
                }))}
            />
        </div>
    );
}
