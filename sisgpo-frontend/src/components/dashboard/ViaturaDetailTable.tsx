import React, { useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { ViaturaStatAgrupada } from '@/types/dashboard';
import { Search, ChevronLeft, ChevronRight, Truck } from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef
} from '@tanstack/react-table';

interface ViaturaDetailTableProps {
  data: ViaturaStatAgrupada[];
  isLoading: boolean;
}

interface FlatViaturaRow {
  prefixo: string;
  tipo: string;
  obm: string;
  situacao: string;
  status: string;
}

const tableColumns: ColumnDef<FlatViaturaRow>[] = [
  { header: 'PREFIXO', accessorKey: 'prefixo' },
  { header: 'TIPO', accessorKey: 'tipo' },
  { header: 'OBM', accessorKey: 'obm' },
  { header: 'SITUAÇÃO', accessorKey: 'situacao' },
  { header: 'STATUS', accessorKey: 'status' },
];

const ViaturaDetailTable: React.FC<ViaturaDetailTableProps> = ({ data, isLoading }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  const flattenedData: FlatViaturaRow[] = React.useMemo(() => {
    if (!data) return [];
    const rows: FlatViaturaRow[] = [];
    data.forEach(group => {
      group.obms.forEach(obmGroup => {
        obmGroup.prefixos.forEach(prefixo => {
          rows.push({
            prefixo: prefixo,
            tipo: group.tipo,
            obm: obmGroup.nome,
            situacao: 'Operacionall', // Placeholder as per API limit
            status: 'Disponível' // Placeholder
          });
        });
      });
    });
    return rows;
  }, [data]);

  const table = useReactTable({
    data: flattenedData,
    columns: tableColumns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  if (isLoading) {
    return (
      <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 min-h-[400px] flex items-center justify-center">
        <Spinner className="h-10 w-10 text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="bg-[#0a0d14]/80 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-xl relative overflow-hidden flex flex-col gap-4">

      {/* Header com Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
            <Truck className="w-5 h-5 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white tracking-widest uppercase font-mono">
            Frota Operacional Detalhada
          </h3>
        </div>

        {/* Search Input Sci-Fi */}
        <div className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            value={globalFilter ?? ''}
            onChange={e => setGlobalFilter(e.target.value)}
            placeholder="BUSCAR VIATURA..."
            className="w-full bg-[#0e121b] border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
          />
        </div>
      </div>

      {/* Tabela Data Grid */}
      <div className="overflow-x-auto rounded-lg border border-white/5">
        <table className="w-full text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="bg-[#0e121b]">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-4 py-3 text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400 border-b border-white/10 whitespace-nowrap">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-white/5">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map(row => (
                <tr key={row.id} className="hover:bg-cyan-500/5 transition-colors group">
                  {row.getVisibleCells().map(cell => {
                    // Custom Render para Colunas Específicas
                    if (cell.column.id === 'situacao') {
                      const val = cell.getValue() as string;
                      const isDisponivel = val === 'Disponível' || val === 'Operante' || val === 'Em QAP';
                      return (
                        <td key={cell.id} className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${val === 'Indisponível'
                              ? 'bg-red-500/10 text-red-400 border-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}>
                            {val}
                          </span>
                        </td>
                      );
                    }
                    if (cell.column.id === 'status') {
                      const val = cell.getValue() as string;
                      const isEmpenhada = val === 'EMPENHADA';
                      return (
                        <td key={cell.id} className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${isEmpenhada
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                              : 'bg-slate-700/30 text-slate-400 border-slate-600/30'
                            }`}>
                            {isEmpenhada && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                            {val}
                          </span>
                        </td>
                      );
                    }
                    if (cell.column.id === 'prefixo') {
                      return (
                        <td key={cell.id} className="px-4 py-3 font-mono font-bold text-cyan-300 group-hover:text-cyan-200 transition-colors">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      );
                    }

                    return (
                      <td key={cell.id} className="px-4 py-3 text-sm text-slate-300 font-mono">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={tableColumns.length} className="px-4 py-8 text-center text-slate-500 font-mono text-sm">
                  NENHUMA VIATURA ENCONTRADA.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação Sci-Fi */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Mostrando {table.getRowModel().rows.length} registros
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 rounded bg-slate-800 border border-slate-700 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default ViaturaDetailTable;
