import { useState, useEffect, useCallback } from 'react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import toast from 'react-hot-toast';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Label from '@/components/ui/Label'; // Added Label import
import Modal from '@/components/ui/Modal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import Spinner from '@/components/ui/Spinner';
import StatCard from '@/components/ui/StatCard';
import { PencilIcon, TrashIcon, PlusIcon, SearchIcon, PhoneIcon, MailIcon, CalendarIcon, UserIcon, Share2, ShieldAlert } from 'lucide-react';
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

const CRBMS = ['1º CRBM', '2º CRBM', '3º CRBM', '4º CRBM', '5º CRBM', '6º CRBM', '7º CRBM', '8º CRBM', '9º CRBM', 'COC', '1º CIBM'];

export default function ComandantesCrbmPage() {
    const { user } = useAuthStore();
    const isAdmin = user?.perfil === 'admin';
    const { setPageTitle } = useUiStore();

    const [comandantes, setComandantes] = useState<ComandanteCrbm[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ComandanteCrbm | null>(null);
    const [isBatchShareOpen, setIsBatchShareOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDeleteId, setItemToDeleteId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);

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
            toast.error('Erro ao carregar comandantes');
        } finally {
            setIsLoading(false);
        }
    };

    const searchMilitares = useCallback(async (term: string) => {
        if (term.length < 2) { setSearchResults([]); return; }
        try {
            const response = await api.get(`/api/comandantes-crbm/search-militares?q=${encodeURIComponent(term)}`);
            setSearchResults(response.data);
        } catch (error) { console.error('Erro ao buscar militares:', error); }
    }, []);

    const searchSubMilitares = useCallback(async (term: string) => {
        if (term.length < 2) { setSubSearchResults([]); return; }
        try {
            const response = await api.get(`/api/comandantes-crbm/search-militares?q=${encodeURIComponent(term)}`);
            setSubSearchResults(response.data);
        } catch (error) { console.error('Erro ao buscar subcomandantes:', error); }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => { searchTerm && searchTerm.length >= 2 ? searchMilitares(searchTerm) : setSearchResults([]); }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, searchMilitares]);

    useEffect(() => {
        const timer = setTimeout(() => { subSearchTerm && subSearchTerm.length >= 2 ? searchSubMilitares(subSearchTerm) : setSubSearchResults([]); }, 300);
        return () => clearTimeout(timer);
    }, [subSearchTerm, searchSubMilitares]);

    const handleSelectMilitar = (militar: MilitarOption) => {
        setFormData(prev => ({ ...prev, militar_id: militar.id, nome_comandante: militar.nome_completo, posto_graduacao: militar.posto_graduacao || '', telefone: militar.telefone || '' }));
        setSearchTerm(''); setSearchResults([]);
    };

    const handleSelectSubMilitar = (militar: MilitarOption) => {
        setFormData(prev => ({ ...prev, subcomandante_militar_id: militar.id, nome_subcomandante: militar.nome_completo, subcomandante_posto: militar.posto_graduacao || '', subcomandante_telefone: militar.telefone || '' }));
        setSubSearchTerm(''); setSubSearchResults([]);
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
                crbm: '', militar_id: null, nome_comandante: '', posto_graduacao: '', telefone: '', email: '', data_inicio: '',
                subcomandante_militar_id: null, nome_subcomandante: '', subcomandante_posto: '', subcomandante_telefone: '', subcomandante_email: '', observacoes: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => { setIsModalOpen(false); setEditingItem(null); setSearchTerm(''); setSearchResults([]); };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!formData.crbm || !formData.nome_comandante) { toast.error('CRBM e Nome do Comandante são obrigatórios'); return; }

        setIsSaving(true);
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
            toast.error(error.response?.data?.message || 'Erro ao salvar');
        } finally { setIsSaving(false); }
    };

    const handleDeleteClick = (id: number) => { setItemToDeleteId(id); setIsConfirmModalOpen(true); };

    const handleConfirmDelete = async () => {
        if (!itemToDeleteId) return;
        setIsDeleting(true);
        try {
            await api.delete(`/api/comandantes-crbm/${itemToDeleteId}`);
            toast.success('Comandante removido!');
            fetchComandantes();
        } catch (error) { toast.error('Erro ao remover comandante'); }
        finally { setIsDeleting(false); setIsConfirmModalOpen(false); }
    };

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-xl font-bold text-white tracking-wide font-mono hidden md:block">Comandantes Regionais</h2>
                    <p className="text-slate-400 text-sm mt-1">Gestão dos comandos regionais (CRBMs).</p>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="w-full md:w-auto min-w-[200px]">
                        <StatCard title="Total Cadastrado" value={isLoading ? '' : comandantes.length} isLoading={isLoading} variant="transparent" />
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-end">
                <Button
                    onClick={() => setIsBatchShareOpen(true)}
                    className="!bg-emerald-500/10 !border !border-emerald-500/50 !text-emerald-400 hover:!bg-emerald-500/20 hover:!shadow-[0_0_15px_rgba(16,185,129,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold h-10"
                >
                    <Share2 className="w-4 h-4 mr-2" />
                    Compartilhar Tudo
                </Button>
                {isAdmin && (
                    <Button
                        onClick={() => openModal()}
                        className="!bg-cyan-500/10 !border !border-cyan-500/50 !text-cyan-400 hover:!bg-cyan-500/20 hover:!shadow-[0_0_15px_rgba(34,211,238,0.4)] backdrop-blur-sm transition-all font-mono tracking-wide uppercase text-xs font-bold h-10"
                    >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Novo Comandante
                    </Button>
                )}
            </div>

            {/* Content Card */}
            <div className="bg-[#0a0d14]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden relative">
                {/* Decorative Top Line */}
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent opacity-50 pointer-events-none" />

                {/* Desktop View */}
                <div className="hidden md:block">
                    <table className="min-w-full divide-y divide-white/5">
                        <thead className="bg-white/5 decoration-clone">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">CRBM</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Comandante</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Telefone</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Subcomandante</th>
                                <th className="px-6 py-4 text-left text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Tel. Sub</th>
                                {isAdmin && <th className="px-6 py-4 text-right text-[10px] font-bold text-cyan-500/80 uppercase tracking-[0.2em] font-mono border-b border-white/5">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-sm">
                            {isLoading ? (
                                <tr><td colSpan={6} className="py-20 text-center"><Spinner className="w-8 h-8 mx-auto text-cyan-500" /></td></tr>
                            ) : comandantes.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-slate-500 font-mono uppercase tracking-widest text-xs">Nenhum registro encontrado</td></tr>
                            ) : (
                                comandantes.map((cmd) => (
                                    <tr key={cmd.id} className="group hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 text-white font-bold font-mono text-xs">{cmd.crbm}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-white font-medium">{cmd.nome_comandante}</span>
                                                <span className="text-xs text-slate-500">{cmd.posto_graduacao}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cmd.telefone ? (
                                                <a href={getWhatsappLink(cmd.telefone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-mono text-xs">
                                                    <PhoneIcon size={12} /> {cmd.telefone}
                                                </a>
                                            ) : <span className="text-slate-600">-</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-slate-300">{cmd.nome_subcomandante || '-'}</span>
                                                <span className="text-xs text-slate-600">{cmd.subcomandante_posto}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {cmd.subcomandante_telefone ? (
                                                <a href={getWhatsappLink(cmd.subcomandante_telefone)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors font-mono text-xs">
                                                    <PhoneIcon size={12} /> {cmd.subcomandante_telefone}
                                                </a>
                                            ) : <span className="text-slate-600">-</span>}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => openModal(cmd)} className="p-1.5 rounded-md text-sky-500 hover:bg-sky-500/10 hover:shadow-[0_0_10px_rgba(14,165,233,0.2)] transition-all"><PencilIcon className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDeleteClick(cmd.id)} className="p-1.5 rounded-md text-rose-500 hover:bg-rose-500/10 hover:shadow-[0_0_10px_rgba(244,63,94,0.2)] transition-all"><TrashIcon className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile View */}
                <div className="md:hidden p-4 space-y-4">
                    {comandantes.map((cmd) => (
                        <div key={cmd.id} className="bg-[#0e121b] border border-white/10 p-4 rounded-xl shadow-lg relative overflow-hidden">
                            <div className="flex justify-between items-start mb-3 border-b border-white/5 pb-2">
                                <h3 className="text-cyan-400 font-bold font-mono text-lg">{cmd.crbm}</h3>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button onClick={() => openModal(cmd)} className="p-1.5 text-sky-500"><PencilIcon size={16} /></button>
                                        <button onClick={() => handleDeleteClick(cmd.id)} className="p-1.5 text-rose-500"><TrashIcon size={16} /></button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-3">
                                <div className="bg-white/5 p-3 rounded-lg">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Comandante</span>
                                    <div className="text-white font-medium">{cmd.nome_comandante}</div>
                                    <div className="text-xs text-slate-400">{cmd.posto_graduacao}</div>
                                    {cmd.telefone && <a href={getWhatsappLink(cmd.telefone)} className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><PhoneIcon size={12} /> {cmd.telefone}</a>}
                                </div>
                                <div className="bg-white/5 p-3 rounded-lg border-l-2 border-slate-700">
                                    <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Subcomandante</span>
                                    <div className="text-slate-300 font-medium">{cmd.nome_subcomandante || '-'}</div>
                                    <div className="text-xs text-slate-500">{cmd.subcomandante_posto}</div>
                                    {cmd.subcomandante_telefone && <a href={getWhatsappLink(cmd.subcomandante_telefone)} className="text-emerald-400 text-xs mt-1 flex items-center gap-1"><PhoneIcon size={12} /> {cmd.subcomandante_telefone}</a>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Form Modal */}
            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingItem ? 'Editar Comandante' : 'Novo Comandante'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">CRBM</label>
                            <select
                                value={formData.crbm}
                                onChange={(e) => setFormData(prev => ({ ...prev, crbm: e.target.value }))}
                                className="w-full bg-[#1a1f2e] border border-slate-700 rounded-lg px-3 py-2 text-white focus:border-cyan-500 outline-none transition-all"
                                required
                            >
                                <option value="">Selecione...</option>
                                {CRBMS.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Data Início</label>
                            <Input type="date" value={formData.data_inicio || ''} onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))} />
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <h4 className="text-cyan-400 font-bold uppercase text-xs tracking-widest mb-3 flex items-center gap-2"><UserIcon size={14} /> Dados do Comandante</h4>

                        <div className="relative mb-3">
                            <Input placeholder="Buscar Militar (Autopreencher)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} icon={SearchIcon} className="bg-black/30" />
                            {searchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-[#1a1f2e] border border-slate-700 rounded-lg shadow-xl shadow-black/50 max-h-48 overflow-y-auto">
                                    {searchResults.map(m => (
                                        <button type="button" key={m.id} onClick={() => handleSelectMilitar(m)} className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                                            <div className="text-white font-bold text-sm">{m.nome_guerra} <span className="text-slate-500 font-normal">({m.posto_graduacao})</span></div>
                                            <div className="text-xs text-slate-400">{m.nome_completo}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Nome Completo" value={formData.nome_comandante} onChange={(e) => setFormData(prev => ({ ...prev, nome_comandante: e.target.value }))} required />
                            <Input label="Posto/Graduação" value={formData.posto_graduacao} onChange={(e) => setFormData(prev => ({ ...prev, posto_graduacao: e.target.value }))} />
                            <Input label="Telefone" value={formData.telefone} onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))} icon={PhoneIcon} />
                            <Input label="Email" type="email" value={formData.email || ''} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} icon={MailIcon} />
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4">
                        <h4 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-3 flex items-center gap-2"><ShieldAlert size={14} /> Dados do Subcomandante (Opcional)</h4>

                        <div className="relative mb-3">
                            <Input placeholder="Buscar Subcomandante (Autopreencher)..." value={subSearchTerm} onChange={(e) => setSubSearchTerm(e.target.value)} icon={SearchIcon} className="bg-black/30" />
                            {subSearchResults.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-[#1a1f2e] border border-slate-700 rounded-lg shadow-xl shadow-black/50 max-h-48 overflow-y-auto">
                                    {subSearchResults.map(m => (
                                        <button type="button" key={m.id} onClick={() => handleSelectSubMilitar(m)} className="w-full text-left p-3 hover:bg-white/5 border-b border-white/5 last:border-0">
                                            <div className="text-white font-bold text-sm">{m.nome_guerra} <span className="text-slate-500 font-normal">({m.posto_graduacao})</span></div>
                                            <div className="text-xs text-slate-400">{m.nome_completo}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input label="Nome Subcomandante" value={formData.nome_subcomandante || ''} onChange={(e) => setFormData(prev => ({ ...prev, nome_subcomandante: e.target.value }))} />
                            <Input label="Posto/Graduação" value={formData.subcomandante_posto || ''} onChange={(e) => setFormData(prev => ({ ...prev, subcomandante_posto: e.target.value }))} />
                            <Input label="Telefone" value={formData.subcomandante_telefone || ''} onChange={(e) => setFormData(prev => ({ ...prev, subcomandante_telefone: e.target.value }))} icon={PhoneIcon} />
                            <Input label="Email" type="email" value={formData.subcomandante_email || ''} onChange={(e) => setFormData(prev => ({ ...prev, subcomandante_email: e.target.value }))} icon={MailIcon} />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <div className="flex gap-3">
                            <Button type="button" onClick={closeModal} className="!bg-slate-700 hover:!bg-slate-600">Cancelar</Button>
                            <Button type="submit" variant="primary" isLoading={isSaving}>{editingItem ? 'Salvar' : 'Cadastrar'}</Button>
                        </div>
                    </div>
                </form>
            </Modal>

            <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmDelete} title="Confirmar Exclusão" message="Tem certeza que deseja remover este comandante?" isLoading={isDeleting} />

            <BatchWhatsAppModal isOpen={isBatchShareOpen} onClose={() => setIsBatchShareOpen(false)} comandantes={comandantes.map(c => ({ id: c.id, crbm: c.crbm, nome_comandante: c.nome_comandante, telefone: c.telefone }))} />
        </div>
    );
}
