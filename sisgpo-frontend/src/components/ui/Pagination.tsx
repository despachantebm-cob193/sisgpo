// Arquivo: frontend/src/components/ui/Pagination.tsx (Novo Arquivo)

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="surface-panel mt-4 flex items-center justify-between px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:justify-end">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md border border-borderDark bg-searchbar px-3 py-2 text-sm font-semibold text-textMain transition-colors hover:bg-cardSlate/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Anterior
        </button>
        <div className="hidden sm:flex items-center mx-4">
          <p className="text-sm text-textSecondary">
            Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
          </p>
        </div>
        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md border border-borderDark bg-searchbar px-3 py-2 text-sm font-semibold text-textMain transition-colors hover:bg-cardSlate/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40"
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default Pagination;

