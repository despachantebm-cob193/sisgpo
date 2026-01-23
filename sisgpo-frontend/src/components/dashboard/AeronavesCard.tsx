import React, { useMemo } from 'react';
import { ColumnDef, flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Plane, Signal, Power } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AeronavesCardProps {
  data: any[];
  isLoading: boolean;
  lastUpdated: string | null;
}

const AeronavesCard: React.FC<AeronavesCardProps> = ({ data, isLoading, lastUpdated }) => {

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'modelo',
        header: 'AERONAVE',
        cell: (info) => (
          <div className="flex items-center gap-2">
            <Plane className="w-3 h-3 text-amber-400" />
            <span className="font-mono font-bold text-amber-100">{String(info.getValue())}</span>
          </div>
        ),
      },
      {
        accessorKey: 'prefixo',
        header: 'PREFIXO',
        cell: (info) => <span className="text-slate-300 font-mono text-xs">{String(info.getValue())}</span>,
      },
      {
        accessorKey: 'status',
        header: 'STATUS',
        cell: (info) => {
          const status = String(info.getValue()).toUpperCase();
          const isAvailable = status.includes('DISPONÍVEL') || status.includes('PRONTO');
          return (
            <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border tracking-wider
               ${isAvailable
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                : 'bg-red-950/30 border-red-500/30 text-red-400'
              }`}>
              {isAvailable && <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse mr-1" />}
              {status}
            </div>
          )
        }
      },
      {
        accessorKey: 'localizacao',
        header: 'BASE',
        cell: (info) => <span className="text-slate-400 font-mono text-xs">{String(info.getValue())}</span>,
      },
      {
        accessorKey: 'ultima_atualizacao',
        header: 'ATUALIZAÇÃO',
        cell: (info) => (
          <span className="text-[10px] text-slate-500">
            {format(new Date(), 'dd/MM HH:mm', { locale: ptBR })}
          </span>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 5,
      }
    }
  });

  return (
    <div className="bg-[#0a0d14]/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-full">

      {/* Header */}
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-amber-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 rounded border border-amber-500/20">
            <Plane className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-widest uppercase font-mono leading-none">
              Aeronaves
            </h3>
            <p className="text-[10px] text-amber-400/60 font-mono mt-0.5">Vigilância Aérea</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-black/40 rounded border border-white/5">
              <Signal className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 font-mono">{lastUpdated}</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-0 overflow-auto min-h-[200px] relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <Spinner className="text-amber-500 w-8 h-8" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-slate-500 h-full">
            <Power className="w-8 h-8 mb-2 opacity-20" />
            <p className="font-mono text-xs tracking-widest">NENHUM VETOR AÉREO</p>
          </div>
        ) : (
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map(headerGroup => (
                  <tr key={headerGroup.id} className="border-b border-white/5 bg-white/5">
                    {headerGroup.headers.map(header => (
                      <th key={header.id} className="p-3 text-[10px] font-bold text-amber-500/80 uppercase tracking-widest font-mono">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="p-3">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination (Simplified) */}
      {data && data.length > 5 && (
        <div className="p-2 border-t border-white/5 flex justify-end gap-2 bg-black/20">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded bg-white/5 hover:bg-amber-500/20 disabled:opacity-30 disabled:hover:bg-transparent text-amber-400 custom-transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded bg-white/5 hover:bg-amber-500/20 disabled:opacity-30 disabled:hover:bg-transparent text-amber-400 custom-transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default AeronavesCard;
