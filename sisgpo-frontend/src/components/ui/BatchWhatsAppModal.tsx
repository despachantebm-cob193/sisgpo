
import React, { useState } from 'react';
import Modal from './Modal';
import { Share2, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import Button from './Button';
import toast from 'react-hot-toast';
import { getWhatsappLink } from '@/utils/formatters';

interface Comandante {
    id: number;
    crbm: string;
    nome_comandante: string;
    telefone: string | null;
}

interface BatchWhatsAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    comandantes: Comandante[];
}

const BatchWhatsAppModal: React.FC<BatchWhatsAppModalProps> = ({ isOpen, onClose, comandantes }) => {
    const publicUrl = window.location.origin;
    const [message, setMessage] = useState(
        `Prezados Comandantes de CRBM,\n\nInformamos que os dados operacionais do CBMGO foram atualizados e estão disponíveis para consulta no link abaixo:\n\n${publicUrl}\n\nEste painel centraliza as informações sobre o poder operacional (viaturas, militares e aeronaves) para auxiliar na tomada de decisões.\n\nAtenciosamente,\nComando Operacional.`
    );
    const [sentStatus, setSentStatus] = useState<Record<number, boolean>>({});

    const handleSendIndividual = (cmd: Comandante) => {
        if (!cmd.telefone) {
            toast.error(`Telefone não cadastrado para o ${cmd.crbm}`);
            return;
        }

        const link = getWhatsappLink(cmd.telefone, message);
        window.open(link, '_blank');
        setSentStatus(prev => ({ ...prev, [cmd.id]: true }));
    };

    const handleSendAll = () => {
        const validComandantes = comandantes.filter(c => c.telefone);

        if (validComandantes.length === 0) {
            toast.error('Nenhum comandante possui telefone cadastrado.');
            return;
        }

        toast.loading('Iniciando envio em lote...', { duration: 2000 });

        // Browsers usually block multiple windows opening.
        // We will open the first one and provide a clear way to go through the others.
        // Or simply open the first 3 (sometimes allowed) and warn.
        // Best approach: Open the regular list and let user click each, OR open one by one with a "Next" button if they want automated flow.

        // For now, let's open the first one to start the flow.
        const first = validComandantes[0];
        handleSendIndividual(first);

        toast.success(`Iniciado com ${first.crbm}. Continue enviando nos botões abaixo.`);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Compartilhamento em Lote (WhatsApp)"
            size="2xl"
        >
            <div className="space-y-6 py-2">
                <p className="text-sm text-textSecondary">
                    Esta ferramenta permite enviar rapidamente o link do dashboard para todos os comandantes de CRBM via WhatsApp Web/App.
                </p>

                {/* Message Header */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-textSecondary uppercase">Mensagem a ser enviada</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="w-full p-4 bg-searchbar border border-borderDark rounded-lg text-sm text-textMain focus:ring-2 focus:ring-tagBlue outline-none transition-all"
                        placeholder="Digite a mensagem aqui..."
                    />
                </div>

                <div className="border-t border-borderDark pt-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-textMain">Comandantes ({comandantes.length})</h3>
                        <Button
                            onClick={handleSendAll}
                            className="!w-auto !py-1.5 !px-3 bg-tagBlue hover:bg-tagBlue/90 text-sm"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            Iniciar Envio em Lote
                        </Button>
                    </div>

                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        {comandantes.map((cmd) => (
                            <div
                                key={cmd.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-cardSlate/40 border border-borderDark/60 hover:bg-cardSlate/60 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-bold text-primary text-sm">{cmd.crbm}</span>
                                    <span className="text-textSecondary text-xs">{cmd.nome_comandante}</span>
                                    <span className="text-xs text-textSecondary">{cmd.telefone || 'Sem telefone'}</span>
                                </div>

                                <button
                                    onClick={() => handleSendIndividual(cmd)}
                                    disabled={!cmd.telefone}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sentStatus[cmd.id]
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-sm'
                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    {sentStatus[cmd.id] ? (
                                        <>
                                            <CheckCircle2 size={14} />
                                            Enviado
                                        </>
                                    ) : (
                                        <>
                                            <Send size={14} />
                                            Enviar
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}

                        {comandantes.length === 0 && (
                            <div className="text-center py-8 text-textSecondary italic text-sm">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                Nenhum comandante cadastrado para envio.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4 gap-3 border-t border-borderDark">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-textSecondary hover:text-textMain transition-colors"
                    >
                        Fechar
                    </button>
                    <Button
                        onClick={handleSendAll}
                        className="!w-auto bg-green-600 hover:bg-green-700"
                    >
                        <Share2 className="w-4 h-4 mr-2" />
                        Compartilhar com Todos
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default BatchWhatsAppModal;
