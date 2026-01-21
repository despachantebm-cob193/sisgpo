import { useMemo, useState } from 'react';
import { UserRecord } from '@/types/entities';
import { ChevronDown, Pencil, Ban, RotateCcw, Trash2, Check, X } from 'lucide-react';

interface UserRowProps {
  user: UserRecord;
  onEdit: (user: UserRecord) => void;
  onToggleStatus: (user: UserRecord) => void;
  onDelete: (user: UserRecord) => void;
  onApprove: (user: UserRecord) => void;
  onReject: (user: UserRecord) => void;
  isOwnAccount: boolean;
  rowActionLoading: number | null;
  isDeleting: boolean;
  isAdmin: boolean;
}

export default function UserRow({
  user,
  onEdit,
  onToggleStatus,
  onDelete,
  onApprove,
  onReject,
  isOwnAccount,
  rowActionLoading,
  isDeleting,
  isAdmin,
}: UserRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const displayName = useMemo(
    () => user.nome_completo?.trim() || user.nome?.trim() || user.login,
    [user.nome_completo, user.nome, user.login],
  );

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleString('pt-BR');
  };

  const renderStatus = () => {
    if (user.status === 'pending' || user.status === 'pendente') {
      return (
        <span className="inline-flex items-center rounded-full bg-yellow-500/15 px-2.5 py-0.5 text-xs font-semibold text-yellow-300 ring-1 ring-yellow-500/40">
          Pendente
        </span>
      );
    }

    if (user.ativo) {
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
          Ativo
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-premiumOrange/20 px-2.5 py-0.5 text-xs font-semibold text-premiumOrange">
        Bloqueado
      </span>
    );
  };

  return (
    <div className="rounded-lg border border-borderDark/60 bg-background/40 shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-searchbar/60"
      >
        <div className="flex flex-col">
          <span className="text-base font-semibold text-textMain">{displayName}</span>
        </div>
        <div className="flex items-center gap-3">
          {renderStatus()}
          <ChevronDown
            className={`h-5 w-5 text-textSecondary transition-transform ${isExpanded ? 'rotate-180' : ''
              }`}
          />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-borderDark/60 bg-cardSlate/60 px-4 py-4">
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
            <div>
              <p className="font-semibold text-textSecondary">Login</p>
              <p className="text-textMain">{user.login}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Email</p>
              <p className="text-textMain">{user.email ?? '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Perfil</p>
              <p className="text-textMain">{user.perfil}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">WhatsApp</p>
              <p className="text-textMain">{user.whatsapp ?? '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Unidade/Cidade</p>
              <p className="text-textMain">{user.unidade ?? '-'}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Criado em</p>
              <p className="text-textMain">{formatDate(user.created_at)}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Atualizado em</p>
              <p className="text-textMain">{formatDate(user.updated_at)}</p>
            </div>
            <div>
              <p className="font-semibold text-textSecondary">Status detalhado</p>
              <p className="text-textMain">
                {user.status === 'pending' || user.status === 'pendente' ? 'Aguardando aprovacao' : user.ativo ? 'Ativo' : 'Bloqueado'}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            {user.status === 'pending' || user.status === 'pendente' ? (
              isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => onApprove(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded bg-green-500 text-white shadow hover:bg-green-600 transition disabled:opacity-60"
                    disabled={rowActionLoading === user.id || isDeleting}
                    aria-label={`Aprovar ${user.login}`}
                    title={`Aprovar ${user.login}`}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded bg-red-500 text-white shadow hover:bg-red-600 transition disabled:opacity-60"
                    disabled={rowActionLoading === user.id || isDeleting}
                    aria-label={`Rejeitar ${user.login}`}
                    title={`Rejeitar ${user.login}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </>
              )
            ) : (
              isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => onEdit(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded bg-sky-500 text-white shadow hover:bg-sky-600 transition disabled:opacity-60"
                    disabled={rowActionLoading === user.id || isDeleting}
                    aria-label={`Editar ${user.login}`}
                    title={`Editar ${user.login}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleStatus(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded bg-amber-500 text-white shadow hover:bg-amber-600 transition disabled:opacity-60"
                    disabled={
                      rowActionLoading === user.id ||
                      isDeleting ||
                      (isOwnAccount && user.ativo)
                    }
                    aria-label={user.ativo ? `Bloquear ${user.login}` : `Reativar ${user.login}`}
                    title={user.ativo ? `Bloquear ${user.login}` : `Reativar ${user.login}`}
                  >
                    {user.ativo ? <Ban className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(user)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded bg-rose-500 text-white shadow hover:bg-rose-600 transition disabled:opacity-60"
                    disabled={rowActionLoading === user.id || isDeleting || isOwnAccount}
                    aria-label={`Excluir ${user.login}`}
                    title={`Excluir ${user.login}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
