import React from 'react';
import { NavLink } from 'react-router-dom';

type Item = { label: string; to: string };

const items: Item[] = [
  { label: 'Dashboard', to: '/app/dashboard' },
  { label: 'Estatísticas Externas', to: '/app/estatisticas-externas' },
  { label: 'OBMs', to: '/app/obms' },
  { label: 'Viaturas', to: '/app/viaturas' },
  { label: 'Militares', to: '/app/militares' },
  { label: 'Médicos', to: '/app/medicos' },
  { label: 'Plantões', to: '/app/plantoes' },
  { label: 'Serviço do Dia', to: '/app/servico-dia' },
  { label: 'Relatórios', to: '/app/relatorio' },
  { label: 'Usuários', to: '/app/usuarios' },
  { label: 'Perfil', to: '/app/perfil' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="h-16 flex items-center px-4 font-bold text-gray-800 border-b">SISGPO</div>
      <nav className="p-3 space-y-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm font-medium ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;

