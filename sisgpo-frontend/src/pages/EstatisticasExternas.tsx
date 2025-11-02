// sisgpo-frontend/src/pages/EstatisticasExternas.tsx

import React from 'react';
import Card from '../components/ui/Card';

// Lê a URL do dashboard externo via variável Vite
const DASHBOARD_URL:
  string = (import.meta as any).env.VITE_OCORRENCIAS_DASHBOARD_URL ||
  'https://sistema-controle-ocorrencias-fronte.vercel.app/dashboard';

const EstatisticasExternas: React.FC = () => {
  const isPlaceholder =
    !DASHBOARD_URL || DASHBOARD_URL.includes('[SEU_DOMINIO_OU_IP]');

  if (isPlaceholder) {
    return (
      <Card className="p-4 bg-yellow-50 border-l-4 border-yellow-400">
        <h2 className="text-xl font-bold mb-2 text-premiumOrange">
          Configuração necessária
        </h2>
        <p className="text-yellow-700">
          Defina a variável <code>VITE_OCORRENCIAS_DASHBOARD_URL</code> em
          <code> sisgpo-frontend/.env.local</code> com a URL do dashboard externo
          (ex.: https://seu-dominio/dashboard). Depois reinicie o servidor do Vite.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h2 className="text-xl font-bold mb-4 text-textMain">
        Dashboard do Sistema de Controle de Ocorrências
      </h2>
      <p className="mb-4 text-textSecondary">
        Espelho em tempo real do dashboard principal do sistema de ocorrências.
      </p>
      <div
        style={{
          width: '100%',
          height: '80vh',
          minHeight: '600px',
          overflow: 'hidden',
          border: '1px solid #ccc',
          borderRadius: '0.5rem',
        }}
      >
        <iframe
          src={DASHBOARD_URL}
          title="Dashboard de Controle de Ocorrências"
          width="100%"
          height="100%"
          frameBorder="0"
          style={{ border: 'none', width: '100%', height: '100%' }}
        />
      </div>
      <p className="mt-4 text-sm text-textSecondary">
        Observação: alguns servidores bloqueiam incorporação via iframe (CSP/X-Frame-Options).
        Caso a tela fique vazia, abra a URL em nova aba ou ajuste as políticas no servidor de origem.
      </p>
    </Card>
  );
};

export default EstatisticasExternas;

