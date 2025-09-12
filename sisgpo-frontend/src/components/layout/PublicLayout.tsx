import { Outlet, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {/* Cabeçalho Público */}
      <header className="bg-white shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">SISGPO - Dashboard Público</h1>
            
            <Link
              to="/login" // Rota correta para a página de login
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Acesso Restrito
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo da Página (o Dashboard será renderizado aqui) */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
