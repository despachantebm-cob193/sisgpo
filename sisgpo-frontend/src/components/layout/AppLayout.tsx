import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Futuramente, aqui entrarão a Sidebar e o Header */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-lg font-semibold leading-6 text-gray-900">SISGPO - CBMGO</h1>
        </div>
      </header>
      
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {/* O componente da rota filha (Dashboard, etc.) será renderizado aqui */}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
