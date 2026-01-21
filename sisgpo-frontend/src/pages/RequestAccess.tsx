import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import api from '../services/api';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [obmCity, setObmCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState(''); // mantido apenas para compatibilidade visual, não usado

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const emailLower = email.trim().toLowerCase();
      if (!emailLower.endsWith('@gmail.com')) {
        toast.error('Use um e-mail @gmail.com.');
        setIsSubmitting(false);
        return;
      }

      const { data } = await api.post('/api/public/access-request/submit', {
        fullName,
        email,
        login,
        whatsapp,
        obmCity
      });
      toast.success(data?.message || 'Solicitação registrada. Aguarde aprovação.');
      navigate('/login');
    } catch (err) {
      const message = (err as any)?.response?.data?.message || 'Não foi possível enviar a solicitação. Tente novamente.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full text-white flex items-center justify-center p-4 md:p-10">
      <div className="fixed inset-0 bg-gradient-to-br from-[#090b13] via-[#0e1121] to-[#0b0f1c] -z-10" aria-hidden />
      <div className="w-full max-w-6xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-lg p-6 md:p-10">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-3xl font-bold">Solicitar acesso</h1>
            <p className="text-sm text-gray-200 mt-1">
              Preencha os dados para que a equipe aprove seu cadastro.
            </p>
          </div>
          <Button onClick={() => navigate('/login')} variant="ghost" className="text-sm">
            Voltar ao login
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="md:col-span-2">
            <Label htmlFor="fullName" className="text-textSecondary">Nome completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="Seu nome completo"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-textSecondary">E-mail Gmail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@gmail.com"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div>
            <Label htmlFor="login" className="text-textSecondary">Posto/Graduação/Nome</Label>
            <Input
              id="login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              placeholder="ex: Ten Cel Nome"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div>
            <Label htmlFor="whatsapp" className="text-textSecondary">WhatsApp (contato)</Label>
            <Input
              id="whatsapp"
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              required
              placeholder="(62) 9 9999-9999"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div>
            <Label htmlFor="obmCity" className="text-textSecondary">Obm/Cidade</Label>
            <Input
              id="obmCity"
              value={obmCity}
              onChange={(e) => setObmCity(e.target.value)}
              required
              placeholder="Informe OBM e cidade"
              className="bg-white/5 border-white/20 text-white"
            />
          </div>

          <div className="md:col-span-2 flex gap-3 justify-end">
            <Button type="button" variant="ghost" onClick={() => navigate('/login')}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-60"
            >
              {isSubmitting ? 'Enviando...' : 'Enviar solicitação'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
