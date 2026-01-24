import React, { useEffect, useState, useCallback, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { militarService } from '@/services/militarService';
import { Militar } from '@/types/entities';
import Spinner from '@/components/ui/Spinner';
import { Search, User } from 'lucide-react';

// Internal Debounce Hook
function useDebounceInternal<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debouncedValue;
}

interface MilitarListModalProps {
    isOpen: boolean;
    onClose: () => void;
    crbmName: string;
    onSelectMilitar: (militar: Militar) => void;
}

const ITEMS_PER_PAGE = 50;

const MilitarListModal: React.FC<MilitarListModalProps> = ({
    isOpen,
    onClose,
    crbmName,
    onSelectMilitar,
}) => {
    const [militares, setMilitares] = useState<Militar[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const debouncedSearch = useDebounceInternal(searchTerm, 500);
    const observerTarget = useRef(null);

    // Reset when modal opens or filter changes
    useEffect(() => {
        if (isOpen) {
            setMilitares([]);
            setPage(1);
            setTotalRecords(0);
            setHasMore(true);
            // Fetch first page immediately
            fetchMilitares(1, true);
        } else {
            setMilitares([]);
            setSearchTerm('');
        }
    }, [isOpen, crbmName, debouncedSearch]);

    const fetchMilitares = useCallback(async (pageToFetch: number, reset = false) => {
        if (!crbmName && crbmName !== '') return; // Allow empty string if that means "All" but usually it means specific crbm

        if (pageToFetch === 1) setIsLoading(true);
        else setIsFetchingMore(true);

        try {
            const response = await militarService.list({
                crbm: crbmName,
                q: debouncedSearch,
                limit: ITEMS_PER_PAGE,
                page: pageToFetch,
                ativo: true
            });

            const newMilitares = response.data;
            const total = response.pagination.totalRecords;
            const totalPages = response.pagination.totalPages;

            setTotalRecords(total);
            setHasMore(pageToFetch < totalPages);

            setMilitares(prev => reset ? newMilitares : [...prev, ...newMilitares]);
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
            setIsFetchingMore(false);
        }
    }, [crbmName, debouncedSearch]);

    // Infinite Scroll Observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !isLoading && !isFetchingMore) {
                    setPage(prev => {
                        const nextPage = prev + 1;
                        fetchMilitares(nextPage);
                        return nextPage;
                    });
                }
            },
            { threshold: 1.0 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, isFetchingMore, fetchMilitares]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Militares - ${crbmName || 'Geral'}`}
            size="3xl"
        >
            <div className="flex flex-col h-[600px] relative">
                {/* Sticky Header with Search and Stats */}
                <div className="sticky top-0 z-20 bg-[#0a0d14]/95 backdrop-blur-xl pb-4 pt-1 border-b border-white/5 mb-4">
                    <div className="flex items-center justify-between gap-4 mb-3 px-1">
                        <div className="text-xs font-mono text-slate-400">
                            <span className="text-cyan-400 font-bold">{militares.length}</span> de <span className="text-white font-bold">{totalRecords}</span> militares listados
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar nome, matrícula ou posto..."
                            className="w-full bg-[#0f141e] border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 -mr-2 pb-4">
                    {isLoading && page === 1 ? (
                        <div className="flex justify-center items-center h-40">
                            <Spinner className="w-8 h-8 text-cyan-500" />
                        </div>
                    ) : militares.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                            <User className="w-12 h-12 mb-2 opacity-20" />
                            <p>Nenhum militar encontrado.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {militares.map((militar, index) => (
                                <div
                                    // Use unique key robustly
                                    key={`${militar.id}-${index}`}
                                    onClick={() => onSelectMilitar(militar)}
                                    className="bg-[#0f141e]/50 hover:bg-[#0f141e] border border-slate-800 hover:border-cyan-500/50 rounded-lg p-4 cursor-pointer transition-all duration-200 group flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-cyan-500/10 group-hover:text-cyan-400 transition-colors">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-200 group-hover:text-white transition-colors">
                                                {militar.nome_guerra || militar.nome_completo}
                                            </p>
                                            <p className="text-xs text-slate-500 font-mono">
                                                {militar.posto_graduacao} • Mat: {militar.matricula}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-400">{militar.obm_nome || 'N/A'}</p>
                                        <span className="text-[10px] text-emerald-500 font-mono">ATIVO</span>
                                    </div>
                                </div>
                            ))}

                            {/* Loading More Indicator */}
                            {hasMore && (
                                <div ref={observerTarget} className="flex justify-center p-4">
                                    {isFetchingMore ? (
                                        <Spinner className="w-6 h-6 text-cyan-500" />
                                    ) : (
                                        <div className="h-4" /> // Target for observer
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default MilitarListModal;
