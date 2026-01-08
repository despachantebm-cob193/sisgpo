import React from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../config/supabase';
import { LogOut, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SubjectPendingPage: React.FC = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        logout();
        await supabase.auth.signOut();
        navigate('/login', { replace: true });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col px-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center space-y-6">
                <div className="flex justify-center">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <Clock className="w-12 h-12 text-yellow-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Acesso em Análise</h1>

                <p className="text-gray-600">
                    Sua conta foi criada com sucesso e a solicitacão de acesso foi enviada para o administrador.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-sm text-blue-800 text-left">
                    <p className="font-semibold mb-1">O que acontece agora?</p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>O administrador analisará seu cadastro.</li>
                        <li>Assim que aprovado, você terá acesso completo ao sistema.</li>
                        <li>Tente fazer login novamente mais tarde.</li>
                    </ul>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white py-3 rounded-lg transition-colors duration-200"
                >
                    <LogOut size={20} />
                    <span>Voltar para Login</span>
                </button>
            </div>

            <p className="mt-8 text-gray-400 text-sm">
                SISGPO - Sistema de Gestão de Policiamento Ostensivo
            </p>
        </div>
    );
};

export default SubjectPendingPage;
