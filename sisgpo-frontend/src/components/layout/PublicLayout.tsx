import { useState } from 'react';
import { Outlet, Link, NavLink } from 'react-router-dom';
import { ChevronDown, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const menuLinks = [
  { to: '/', label: 'Dashboard Público', type: 'link' as const },
  { to: '/dashboard-ocorrencias', label: 'Dashboard Ocorrências', type: 'link' as const },
  { to: '/login', label: 'Acesso Restrito', type: 'action' as const },
];

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated());

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-background font-sans text-textMain">
      {/* Cabeçalho público com menu dedicado */}
      <header className="sticky top-0 z-10 flex-none border-b border-borderDark bg-searchbar shadow-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-textMain">SISGPO - Dashboard Público</h1>
          </div>

          {!isAuthenticated && (
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-end sm:gap-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-md border border-borderDark/60 bg-cardSlate px-4 py-2 text-sm font-semibold text-textMain transition-colors hover:bg-cardSlate/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-searchbar"
                >
                  Menu Público
                  <ChevronDown className={`h-4 w-4 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md border border-borderDark/60 bg-searchbar shadow-lg">
                    <nav className="flex flex-col divide-y divide-borderDark/40">
                      {menuLinks.map((link) =>
                        link.type === 'link' ? (
                          <NavLink
                            key={link.to}
                            to={link.to}
                            end={link.to === '/'}
                            onClick={() => setMenuOpen(false)}
                            className={({ isActive }) =>
                              [
                                'px-4 py-2 text-sm transition-colors',
                                'text-background hover:bg-cardSlate/70 hover:text-textMain focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-searchbar',
                                isActive ? 'bg-cardSlate text-textMain shadow-inner' : '',
                              ]
                                .filter(Boolean)
                                .join(' ')
                            }
                          >
                            {link.label}
                          </NavLink>
                        ) : (
                          <Link
                            key={link.to}
                            to={link.to}
                            onClick={() => setMenuOpen(false)}
                            className="inline-flex items-center gap-2 bg-tagBlue px-4 py-2 text-sm font-semibold uppercase tracking-wide text-background transition-colors hover:bg-tagBlue/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-searchbar"
                          >
                            <LogIn className="h-4 w-4" />
                            {link.label}
                          </Link>
                        )
                      )}
                    </nav>
                  </div>
                )}
              </div>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-md border border-transparent bg-tagBlue px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-tagBlue/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tagBlue focus-visible:ring-offset-2 focus-visible:ring-offset-searchbar"
              >
                <LogIn className="h-4 w-4" />
                Acesso Restrito
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal renderizado pelas rotas públicas */}
      <main className="flex-1 pt-6 pb-[20px]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
