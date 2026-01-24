import React from 'react';
import Modal from '@/components/ui/Modal';
import { Militar } from '@/types/entities';
import { User, Phone, MapPin, Hash, Award, Shield } from 'lucide-react';

interface MilitarDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    militar: Militar | null;
}

const MilitarDetailModal: React.FC<MilitarDetailModalProps> = ({
    isOpen,
    onClose,
    militar,
}) => {
    if (!militar) return null;

    const InfoItem = ({ icon: Icon, label, value }: { icon: any, label: string, value: string | undefined | null }) => (
        <div className="flex items-start gap-4 p-4 bg-[#0f141e] rounded-lg border border-slate-800/50 hover:border-slate-700 transition-colors">
            <div className="p-2 bg-slate-800/50 rounded-lg text-cyan-500">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-mono mb-1">{label}</p>
                <p className="text-slate-200 font-medium">{value || 'N/A'}</p>
            </div>
        </div>
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalhes do Militar"
            size="xl"
        >
            <div className="space-y-6">
                {/* Header Profile Section */}
                <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0f141e] to-transparent rounded-2xl border border-dashed border-slate-800">
                    <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4 border-4 border-[#0a0d14] shadow-[0_0_20px_rgba(34,211,238,0.1)]">
                        <User size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-white text-center mb-1">
                        {militar.nome_completo}
                    </h2>
                    <div className="flex items-center gap-2 bg-cyan-950/30 px-3 py-1 rounded-full border border-cyan-500/20">
                        <Award size={14} className="text-cyan-400" />
                        <span className="text-sm text-cyan-400 font-mono font-bold tracking-wide">
                            {militar.posto_graduacao}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoItem
                        icon={Hash}
                        label="Matrícula"
                        value={militar.matricula}
                    />
                    <InfoItem
                        icon={Shield}
                        label="Nome de Guerra"
                        value={militar.nome_guerra}
                    />
                    <InfoItem
                        icon={MapPin}
                        label="Lotação (OBM)"
                        value={militar.obm_nome}
                    />
                    <InfoItem
                        icon={Phone}
                        label="Contato"
                        value={militar.telefone}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default MilitarDetailModal;
