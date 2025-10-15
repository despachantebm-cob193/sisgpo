import React, { useEffect, useState } from 'react';
import api from '../services/api'; // Importação default
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'; // Usando o Card genérico
import { AlertCircle, CheckCircle, Skull } from 'lucide-react';

// Interface para os dados
interface OcorrenciasData {
  totalOcorrencias: number;
  totalOcorrenciasHoje: number;
  totalObitos: number;
}

const DashboardOcorrencias: React.FC = () => {
  const [data, setData] = useState<OcorrenciasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOcorrenciasData = async () => {
      try {
        setLoading(true);
        const response = await api.get<OcorrenciasData>('/api/dashboard-ocorrencias');
        setData(response.data);
        setError(null);
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || err.message;
        setError(`Falha ao carregar dados do Sistema de Ocorrências: ${errorMessage}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOcorrenciasData();
  }, []);

  if (loading) {
    return <div className="p-6 text-center">Carregando dados do Controle de Ocorrências...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500 bg-red-100 border border-red-400 rounded-md">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-lg font-medium">Erro de Conexão</h3>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-700">
        Dashboard de Ocorrências
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Ocorrências</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalOcorrencias}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocorrências Hoje</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalOcorrenciasHoje}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Óbitos</CardTitle>
                <Skull className="h-4 w-4 text-muted-foreground text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalObitos}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardOcorrencias;