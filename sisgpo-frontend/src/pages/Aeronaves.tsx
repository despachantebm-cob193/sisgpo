import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Spinner from '../components/ui/Spinner';

interface Aeronave {
  id: number;
  prefixo: string;
}

interface AeronavesResponse {
  data?: Aeronave[];
}

const Aeronaves: React.FC = () => {
  const [aeronaves, setAeronaves] = useState<Aeronave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAeronaves = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get<AeronavesResponse>('/api/admin/viaturas/aeronaves');
        const data = response.data?.data ?? [];
        setAeronaves(data);
      } catch (err: any) {
        const message = err.response?.data?.message || err.message || 'Falha ao carregar aeronaves.';
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchAeronaves();
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Aeronaves</h2>
          <p className="text-sm text-gray-500">
            Relação de aeronaves ativas registradas no sistema.
          </p>
        </div>
      </header>

      <section className="bg-white shadow-md rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-10 w-10 text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 font-medium">{error}</div>
        ) : aeronaves.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Nenhuma aeronave cadastrada até o momento.
          </div>
        ) : (
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prefixo
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {aeronaves.map((aeronave) => (
                <tr key={aeronave.id} className="transition hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {aeronave.prefixo}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default Aeronaves;
