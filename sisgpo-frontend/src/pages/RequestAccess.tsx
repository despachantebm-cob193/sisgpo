import { FormEvent, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Label from '../components/ui/Label';
import api from '../services/api';
import { User, Mail, Phone, MapPin, ShieldAlert, BadgeCheck, ArrowLeft } from 'lucide-react';
import Spinner from '../components/ui/Spinner';

export default function RequestAccess() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [login, setLogin] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [obmCity, setObmCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    // Forçar zoom 100% para evitar problemas de escala global
    document.body.style.zoom = "100%";

    const url = `${import.meta.env.BASE_URL}login-bg.jpg`;
    const img = new Image();
    img.onload = () => setBgLoaded(true);
    img.src = url;
    setTimeout(() => setBgLoaded(true), 1500);

    return () => {
      document.body.style.zoom = "";
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const emailLower = email.trim().toLowerCase();
      if (!emailLower.endsWith('@gmail.com')) {
        toast.error('É necessário usar um e-mail @gmail.com.');
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
      toast.success(data?.message || 'Solicitação enviada com sucesso!');
      navigate('/login');
    } catch (err) {
      const message = (err as any)?.response?.data?.message || 'Erro ao enviar solicitação.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#050608] flex items-center justify-center font-sans tracking-wide p-4">
      {/* Background Ambience */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${bgLoaded ? 'opacity-30' : 'opacity-0'}`}
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}login-bg.jpg)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#050608] via-[#090b13]/90 to-[#0e1121]/80" />

      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-cyan-900/10 rounded-full blur-[150px] pointer-events-none" />

      {/* CARD PRINCIPAL - FRAME METÁLICO 3D (ATUALIZADO) */}
      <div
        className="relative z-10 w-full max-w-4xl p-[6px] rounded-[2.5rem] bg-gradient-to-br from-[#c0c5ce] via-[#e2e6eb] to-[#8a929e] shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in zoom-in-95 duration-700"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.8), 0 30px 60px -10px rgba(0,0,0,1), inset 0 1px 0 rgba(255,255,255,0.8)' }}
      >
        {/* Layer Escuro (Profundidade) */}
        <div className="absolute inset-[2px] rounded-[2.4rem] bg-[#0f1218] shadow-inner" />

        {/* Detalhes de Luz do Frame Laterais */}
        <div className="absolute top-1/4 bottom-1/4 left-[-2px] w-[5px] bg-cyan-400 shadow-[0_0_20px_cyan] z-20 rounded-full opacity-90 mix-blend-screen" />
        <div className="absolute top-1/4 bottom-1/4 right-[-2px] w-[5px] bg-cyan-400 shadow-[0_0_20px_cyan] z-20 rounded-full opacity-90 mix-blend-screen" />

        {/* Interior do Card (Glass Dark) */}
        <div className="relative z-10 w-full h-full bg-[#0a0d14]/90 backdrop-blur-xl rounded-[2.2rem] p-8 md:p-10 overflow-hidden border border-white/5 ring-1 ring-white/5">

          {/* Reflexo Superior (Vidro/Acrílico) */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-6 border-b border-cyan-500/20 relative z-10">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-cyan-500/10 rounded-full border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                <ShieldAlert className="w-8 h-8 text-cyan-300" />
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wide uppercase font-mono drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                  Solicitar Acesso
                </h1>
                <p className="text-cyan-300 text-xs tracking-wider uppercase mt-1 font-semibold">
                  Cadastro de Usuário SISGPO
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-4 md:mt-0 flex items-center gap-2 text-cyan-200 hover:text-white transition-colors text-sm uppercase tracking-widest font-mono group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform text-cyan-400" />
              Voltar ao Login
            </button>
          </div>

          {/* FORMULÁRIO */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

            <div className="md:col-span-2 group">
              <Label htmlFor="fullName" className="text-xs text-cyan-300 font-semibold uppercase tracking-widest pl-2 mb-1 block">Nome Completo</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="DIGITE SEU NOME COMPLETO"
                startIcon={<User className="w-5 h-5 text-cyan-400" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-white !py-3 !pl-12 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            <div className="group">
              <Label htmlFor="email" className="text-xs text-cyan-300 font-semibold uppercase tracking-widest pl-2 mb-1 block">E-mail (Gmail)</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="SEU.EMAIL@GMAIL.COM"
                startIcon={<Mail className="w-5 h-5 text-cyan-400" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-white !py-3 !pl-12 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            <div className="group">
              <Label htmlFor="login" className="text-xs text-cyan-300 font-semibold uppercase tracking-widest pl-2 mb-1 block">Posto / Nome de Guerra</Label>
              <Input
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                placeholder="EX: CAP FULANO"
                startIcon={<BadgeCheck className="w-5 h-5 text-cyan-400" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-white !py-3 !pl-12 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            <div className="group">
              <Label htmlFor="whatsapp" className="text-xs text-cyan-300 font-semibold uppercase tracking-widest pl-2 mb-1 block">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                required
                placeholder="(62) 9 0000-0000"
                startIcon={<Phone className="w-5 h-5 text-cyan-400" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-white !py-3 !pl-12 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            <div className="group">
              <Label htmlFor="obmCity" className="text-xs text-cyan-300 font-semibold uppercase tracking-widest pl-2 mb-1 block">OBM / Cidade</Label>
              <Input
                id="obmCity"
                value={obmCity}
                onChange={(e) => setObmCity(e.target.value)}
                required
                placeholder="EX: 1º BBM - GOIÂNIA"
                startIcon={<MapPin className="w-5 h-5 text-cyan-400" />}
                className="!rounded-full !bg-black/40 !border-cyan-500/40 !text-white !py-3 !pl-12 placeholder:text-cyan-700/60 focus:!border-cyan-400 focus:!shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-mono text-sm tracking-wider"
              />
            </div>

            <div className="md:col-span-2 pt-6 flex justify-end gap-4 border-t border-cyan-500/20 mt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate('/login')}
                className="hover:bg-cyan-900/20 text-cyan-400/70 hover:text-white border border-transparent hover:border-cyan-400/30 !rounded-full px-8 uppercase tracking-widest text-xs font-semibold h-12"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className={`h-12 px-10 !rounded-full text-xs font-bold tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden group border
                  ${isSubmitting
                    ? 'bg-slate-900 border-slate-700 text-slate-500'
                    : 'bg-black/80 border-cyan-500/60 text-cyan-400 hover:text-cyan-100 hover:border-cyan-400 hover:shadow-[0_0_25px_rgba(34,211,238,0.3)]'
                  }`}
              >
                <div className="absolute inset-0 bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors" />
                <div className="absolute inset-x-4 bottom-0 h-[1px] bg-cyan-400/50 blur-[2px] opacity-70" />

                {isSubmitting ? (
                  <span className="flex items-center gap-2 relative z-10"><Spinner className="w-4 h-4" /> Enviando...</span>
                ) : (
                  <span className="relative z-10">Enviar Solicitação</span>
                )}
              </Button>
            </div>
          </form>

        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 text-[9px] text-cyan-900/50 font-mono tracking-[0.4em] uppercase select-none">
        SISGPO • Access Request Protocol
      </div>
    </div>
  );
}
